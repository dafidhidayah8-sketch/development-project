import type { AppState } from './storageService';
import {
  BankAccount,
  CostAllocationItem,
  CostCode,
  Transaction,
  TransactionCategory,
  TransactionType,
  UserRole,
} from '../types';
import { createAuditRecord } from './auditService';
import { enqueueSync } from './syncService';

export interface EngineValidation {
  valid: boolean;
  errors: string[];
}

export interface EnginePostResult {
  state: AppState;
  validation: EngineValidation;
  duplicate: boolean;
  affectedProjectIds: string[];
  affectedCostCodes: string[];
  cashAccountId?: string;
}

function money(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function addDelta(value: number, delta: number): number {
  return Math.round((money(value) + delta) * 100) / 100;
}

export function resolveBankAccount(
  accounts: BankAccount[],
  bankAccountId?: string,
  paymentMethod?: Transaction['paymentMethod']
): BankAccount | undefined {
  if (bankAccountId) return accounts.find(account => account.id === bankAccountId);

  switch (paymentMethod) {
    case 'TRANSFER_BCA':
      return accounts.find(a => a.bankName === 'Bank BCA') ?? accounts.find(a => a.id === 'BNK-02');
    case 'TRANSFER_MANDIRI':
      return accounts.find(a => a.bankName === 'Bank Mandiri') ?? accounts.find(a => a.id === 'BNK-03');
    case 'TRANSFER_BRI':
      return accounts.find(a => a.bankName === 'Bank BRI') ?? accounts.find(a => a.id === 'BNK-04');
    case 'PETTY_CASH':
      return accounts.find(a => a.bankName === 'Imprest Fund') ?? accounts.find(a => a.id === 'BNK-05');
    case 'KAS_PROYEK':
      return accounts.find(a => a.bankName === 'Kas Tunai') ?? accounts.find(a => a.id === 'BNK-01');
    default:
      return undefined;
  }
}

export function validateTransaction(state: AppState, tx: Transaction): EngineValidation {
  const errors: string[] = [];

  if (!tx.id || !tx.projectId) errors.push('Transaksi wajib memiliki ID dan Project ID.');
  if (!tx.totalAmount || tx.totalAmount <= 0) errors.push('Nilai transaksi harus lebih besar dari 0.');

  const project = state.projects.find(p => p.id === tx.projectId);
  if (!project) errors.push(`Project ${tx.projectId} tidak ditemukan.`);

  const party = state.parties.find(p => p.id === tx.partyId);
  const isCustomerPayment = tx.type === 'INCOME' && tx.category === 'PENJUALAN_UNIT';
  if (!party && tx.partyId && !isCustomerPayment) {
    errors.push(`Pihak ${tx.partyId} belum terdaftar pada master pihak/rekanan.`);
  }

  if (!tx.wbsCode) errors.push('WBS wajib diisi.');
  if (!tx.costCode) errors.push('Cost Code wajib diisi.');

  if (tx.allocations && tx.allocations.length > 0) {
    const percent = tx.allocations.reduce((sum, item) => sum + money(item.percentage), 0);
    const amount = tx.allocations.reduce((sum, item) => sum + money(item.amount), 0);
    if (Math.abs(percent - 100) > 0.1) errors.push(`Alokasi biaya harus 100%. Saat ini ${percent.toFixed(2)}%.`);
    if (Math.abs(amount - tx.totalAmount) > 1) errors.push('Total nominal alokasi harus sama dengan nilai transaksi.');
    tx.allocations.forEach(item => {
      if (!state.projects.some(p => p.id === item.projectId)) {
        errors.push(`Project alokasi ${item.projectId} tidak ditemukan.`);
      }
      if (!state.costCodes.some(c => c.code === item.costCode)) {
        errors.push(`Cost Code alokasi ${item.costCode} tidak ditemukan pada master.`);
      }
    });
  }

  if (tx.isPaid) {
    const account = resolveBankAccount(state.bankAccounts, tx.bankAccountId, tx.paymentMethod);
    if (tx.type !== 'TRANSFER' && !account) {
      errors.push('Rekening/kas sumber pembayaran tidak dapat ditentukan.');
    }
  }

  return { valid: errors.length === 0, errors };
}

function updateCostCode(
  codes: CostCode[],
  code: string,
  mode: 'ACTUAL' | 'COMMITTED',
  amount: number
): CostCode[] {
  return codes.map(item => {
    if (item.code !== code) return item;
    if (mode === 'ACTUAL') {
      return { ...item, actualAmount: addDelta(item.actualAmount, amount) };
    }
    return { ...item, committedAmount: addDelta(item.committedAmount, amount) };
  });
}

function updateWbs(
  nodes: AppState['wbsNodes'],
  code: string,
  amount: number
): AppState['wbsNodes'] {
  return nodes.map(node =>
    node.code === code ? { ...node, actualCost: addDelta(node.actualCost, amount) } : node
  );
}

function applyAllocationCost(state: AppState, allocations: CostAllocationItem[], mode: 'ACTUAL' | 'COMMITTED') {
  let projects = state.projects;
  let costCodes = state.costCodes;
  let wbsNodes = state.wbsNodes;

  for (const allocation of allocations) {
    const amount = money(allocation.amount);

    projects = projects.map(project => {
      if (project.id !== allocation.projectId) return project;
      if (mode === 'ACTUAL') {
        return {
          ...project,
          actualCost: addDelta(project.actualCost, amount),
          forecastEAC: Math.max(project.forecastEAC, addDelta(project.actualCost, amount)),
        };
      }
      return { ...project, committedCost: addDelta(project.committedCost, amount) };
    });

    if (mode === 'ACTUAL') {
      costCodes = updateCostCode(costCodes, allocation.costCode, 'ACTUAL', amount);
      wbsNodes = updateWbs(wbsNodes, allocation.wbsCode, amount);
    } else {
      costCodes = updateCostCode(costCodes, allocation.costCode, 'COMMITTED', amount);
    }
  }

  return { projects, costCodes, wbsNodes };
}

function updatePartyExposure(
  parties: AppState['parties'],
  tx: Transaction
): AppState['parties'] {
  if (!tx.partyId) return parties;
  return parties.map(p => {
    if (p.id !== tx.partyId) return p;
    const isUnpaidExpense = tx.type === 'EXPENSE' && !tx.isPaid;
    const isCustomerIncome = tx.type === 'INCOME' && tx.category === 'PENJUALAN_UNIT';
    const isVendorSettlement = tx.type === 'TRANSFER' && tx.debitAccountCode === '2110';
    const exposureDelta = isUnpaidExpense
      ? money(tx.outstandingAmount)
      : isVendorSettlement
        ? -money(tx.totalAmount)
        : isCustomerIncome
          ? -money(tx.totalAmount)
          : 0;
    return {
      ...p,
      totalTransactions: money(p.totalTransactions) + 1,
      totalOutstanding: Math.max(0, addDelta(p.totalOutstanding, exposureDelta)),
    };
  });
}

function applyCashMovement(
  accounts: BankAccount[],
  tx: Transaction
): { accounts: BankAccount[]; account?: BankAccount } {
  if (!tx.isPaid || tx.type === 'COMMITMENT' || tx.type === 'RECEIVING') {
    return { accounts };
  }

  const account = resolveBankAccount(accounts, tx.bankAccountId, tx.paymentMethod);
  if (!account) return { accounts };

  const delta = tx.type === 'EXPENSE' || tx.type === 'TRANSFER'
    ? -money(tx.totalAmount)
    : tx.type === 'INCOME'
      ? money(tx.totalAmount)
      : 0;
  const updated = accounts.map(item =>
    item.id === account.id ? { ...item, currentBalance: addDelta(item.currentBalance, delta) } : item
  );
  return { accounts: updated, account: updated.find(item => item.id === account.id) };
}

export function postTransaction(
  state: AppState,
  tx: Transaction,
  actor: string = 'SYSTEM',
  actorRole: UserRole = 'ACCOUNTING'
): EnginePostResult {
  const duplicate = state.transactions.some(
    existing => existing.id === tx.id || (!!tx.idempotencyKey && existing.idempotencyKey === tx.idempotencyKey)
  );

  if (duplicate) {
    return {
      state,
      validation: { valid: true, errors: [] },
      duplicate: true,
      affectedProjectIds: [],
      affectedCostCodes: [],
    };
  }

  const validation = validateTransaction(state, tx);
  if (!validation.valid) return { state, validation, duplicate: false, affectedProjectIds: [], affectedCostCodes: [] };

  let projects = state.projects;
  let costCodes = state.costCodes;
  let wbsNodes = state.wbsNodes;
  let bankAccounts = state.bankAccounts;

  const isExpense = tx.type === 'EXPENSE';
  const isReceiving = tx.type === 'RECEIVING';
  const isCommitment = tx.type === 'COMMITMENT';
  const hasAllocation = !!tx.allocations?.length;
  const affectedProjectIds = new Set<string>();
  const affectedCostCodes = new Set<string>();

  if (hasAllocation && (isExpense || isReceiving || isCommitment)) {
    const allocationResult = applyAllocationCost(
      { ...state, projects, costCodes, wbsNodes },
      tx.allocations!,
      isExpense || isReceiving ? 'ACTUAL' : 'COMMITTED'
    );
    projects = allocationResult.projects;
    costCodes = allocationResult.costCodes;
    wbsNodes = allocationResult.wbsNodes;
    tx.allocations!.forEach(item => {
      affectedProjectIds.add(item.projectId);
      affectedCostCodes.add(item.costCode);
    });
  } else if (isExpense || isReceiving || isCommitment) {
    const amount = money(tx.totalAmount);
    projects = projects.map(project => {
      if (project.id !== tx.projectId) return project;
      if (isExpense || isReceiving) {
        const nextActual = addDelta(project.actualCost, amount);
        return { ...project, actualCost: nextActual, forecastEAC: Math.max(project.forecastEAC, nextActual) };
      }
      return { ...project, committedCost: addDelta(project.committedCost, amount) };
    });

    if (isExpense || isReceiving) {
      costCodes = updateCostCode(costCodes, tx.costCode, 'ACTUAL', amount);
      wbsNodes = updateWbs(wbsNodes, tx.wbsCode, amount);
    } else {
      costCodes = updateCostCode(costCodes, tx.costCode, 'COMMITTED', amount);
    }
    affectedProjectIds.add(tx.projectId);
    affectedCostCodes.add(tx.costCode);
  }

  const cash = applyCashMovement(bankAccounts, tx);
  bankAccounts = cash.accounts;

  const stateWithCore: AppState = {
    ...state,
    projects,
    costCodes,
    wbsNodes,
    bankAccounts,
    parties: updatePartyExposure(state.parties, tx),
    transactions: [tx, ...state.transactions],
    auditLogs: [
      createAuditRecord(
        'CREATE',
        tx.id,
        `Posting transaksi ${tx.id}: ${tx.subcategory} Rp ${money(tx.totalAmount).toLocaleString('id-ID')}`,
        actor,
        actorRole
      ),
      ...state.auditLogs,
    ],
  };

  const syncQueue = enqueueSync(stateWithCore.syncQueue, 'TRANSACTION', tx.id, 'CREATE', {
    transaction: tx,
    affectedProjectIds: [...affectedProjectIds],
    affectedCostCodes: [...affectedCostCodes],
    cashAccountId: cash.account?.id,
  });

  return {
    state: { ...stateWithCore, syncQueue },
    validation,
    duplicate: false,
    affectedProjectIds: [...affectedProjectIds],
    affectedCostCodes: [...affectedCostCodes],
    cashAccountId: cash.account?.id,
  };
}

export function createCapitalTransaction(
  state: AppState,
  projectId: string,
  entry: {
    id: string;
    date: string;
    sourceName: string;
    sourceType: 'MODAL_PEMILIK' | 'INVESTOR' | 'PINJAMAN' | 'DANA_INTERNAL' | 'LAINNYA';
    amount: number;
    destinationAccountId: string;
    referenceNo?: string;
    notes?: string;
  },
  actor: string,
  actorRole: UserRole
): Transaction {
  const credit = entry.sourceType === 'PINJAMAN' ? '2210' : '3100';
  return {
    id: `TRX-CAP-${entry.id}`,
    idempotencyKey: `CAPITAL-${entry.id}`,
    date: entry.date,
    projectId,
    projectName: state.projects.find(p => p.id === projectId)?.name ?? 'Project',
    type: 'INCOME',
    category: 'PENDANAAN',
    subcategory: 'Setoran Modal / Pendanaan',
    description: entry.notes || `Dana ${entry.sourceType} dari ${entry.sourceName}`,
    wbsCode: '00',
    costCode: 'MOD-001',
    costCodeName: 'Modal Disetor & Pendanaan Proyek',
    partyId: '',
    partyName: entry.sourceName,
    partyRole: 'INVESTOR',
    subtotal: entry.amount,
    totalAmount: entry.amount,
    paymentMethod: resolveCapitalPaymentMethod(entry.destinationAccountId),
    bankAccountId: entry.destinationAccountId,
    bankAccountName: state.bankAccounts.find(b => b.id === entry.destinationAccountId)?.name,
    isPaid: true,
    paidDate: entry.date,
    paidAmount: entry.amount,
    outstandingAmount: 0,
    debitAccountCode: bankAccountCoaCode(entry.destinationAccountId),
    creditAccountCode: credit,
    journalPosted: true,
    operatorName: actor,
    createdBy: actor,
    createdAt: new Date().toISOString(),
    status: 'PAID',
    currentApprovalLevel: 1,
    approvalSteps: [{ stepNo: 1, roleRequired: actorRole, status: 'APPROVED', approverName: actor, approverRole: actorRole, actionDate: new Date().toISOString() }],
  };
}

function bankAccountCoaCode(accountId: string): string {
  if (accountId === 'BNK-01' || accountId === 'BNK-05') return '1110';
  if (accountId === 'BNK-03') return '1130';
  if (accountId === 'BNK-04') return '1140';
  return '1120';
}

function resolveCapitalPaymentMethod(accountId: string): Transaction['paymentMethod'] {
  if (accountId === 'BNK-02') return 'TRANSFER_BCA';
  if (accountId === 'BNK-03') return 'TRANSFER_MANDIRI';
  if (accountId === 'BNK-04') return 'TRANSFER_BRI';
  if (accountId === 'BNK-05') return 'PETTY_CASH';
  return 'KAS_PROYEK';
}

export function recalculateCustomerAR(
  record: AppState['customerARRecords'][number]
): AppState['customerARRecords'][number] {
  const totalPaid = record.schedules.reduce((sum, item) => sum + money(item.paidAmount), 0);
  const outstanding = Math.max(0, money(record.sellingPrice) - totalPaid);
  return {
    ...record,
    totalPaid,
    totalOutstandingAR: outstanding,
    kprOutstandingOrRemaining: Math.max(0, money(record.sellingPrice) - totalPaid - money(record.bookingFeeAmount)),
    psak72: {
      ...record.psak72,
      contractLiabilityBalance: Math.max(0, totalPaid - money(record.psak72.recognizedRevenue)),
    },
  };
}

export function createCustomerPaymentTransaction(
  state: AppState,
  record: AppState['customerARRecords'][number],
  scheduleId: string,
  amount: number,
  bankAccountId: string,
  actor: string,
  actorRole: UserRole
): Transaction {
  const schedule = record.schedules.find(item => item.id === scheduleId);
  if (!schedule) throw new Error('Jadwal pembayaran konsumen tidak ditemukan.');

  const remainingSchedule = Math.max(0, money(schedule.amount) - money(schedule.paidAmount));
  const safeAmount = Math.min(money(amount), remainingSchedule);
  if (safeAmount <= 0) throw new Error('Nominal penerimaan tidak valid atau termin sudah lunas.');

  const account = state.bankAccounts.find(a => a.id === bankAccountId);
  if (!account) throw new Error('Rekening penerimaan tidak ditemukan.');

  return {
    id: `TRX-AR-${record.id}-${scheduleId}`,
    idempotencyKey: `AR-${record.id}-${scheduleId}`,
    date: new Date().toISOString().split('T')[0],
    projectId: record.projectId || state.activeProjectId || '',
    projectName: state.projects.find(p => p.id === (record.projectId || state.activeProjectId))?.name || 'Project',
    type: 'INCOME',
    category: 'PENJUALAN_UNIT',
    subcategory: `Penerimaan ${schedule.title}`,
    description: `Pembayaran konsumen ${record.customerName} untuk Unit ${record.unitNo}`,
    block: record.block,
    unitId: record.unitId,
    wbsCode: '09',
    costCode: 'SAL-001',
    costCodeName: 'Penerimaan Penjualan Unit',
    partyId: record.id,
    partyName: record.customerName,
    partyRole: 'KONSUMEN',
    quantity: 1,
    unitOfMeasure: 'termin',
    unitPrice: safeAmount,
    subtotal: safeAmount,
    totalAmount: safeAmount,
    paymentMethod: resolveCapitalPaymentMethod(bankAccountId),
    bankAccountId,
    bankAccountName: account.name,
    isPaid: true,
    paidDate: new Date().toISOString().split('T')[0],
    paidAmount: safeAmount,
    outstandingAmount: 0,
    invoiceNo: record.contractNo,
    receiptProofNo: schedule.id,
    debitAccountCode: bankAccountCoaCode(bankAccountId),
    creditAccountCode: record.psak72.handoverStatus === 'BAST_COMPLETED' ? '1210' : '2420',
    journalPosted: true,
    operatorName: actor,
    createdBy: actor,
    createdAt: new Date().toISOString(),
    status: 'PAID',
    currentApprovalLevel: 1,
    approvalSteps: [{ stepNo: 1, roleRequired: actorRole, status: 'APPROVED', approverName: actor, approverRole: actorRole, actionDate: new Date().toISOString() }],
  };
}


export function createContractOpnameTransaction(
  state: AppState,
  contract: AppState['poContracts'][number],
  deltaAmount: number,
  actor: string,
  actorRole: UserRole
): Transaction {
  const projectId = contract.projectId || state.activeProjectId || '';
  const project = state.projects.find(p => p.id === projectId);
  const party = state.parties.find(p => p.id === contract.vendorPartyId);
  return {
    id: `TRX-OPNAME-${contract.id}-${Date.now()}`,
    idempotencyKey: `OPNAME-${contract.id}-${contract.verifiedOpnameAmount + deltaAmount}`,
    date: new Date().toISOString().split('T')[0],
    projectId,
    projectName: project?.name || 'Project',
    type: 'RECEIVING',
    category: 'KONTRAKTOR_MANDOR',
    subcategory: `Opname ${contract.contractNo}`,
    description: `Pengakuan pekerjaan terverifikasi ${contract.title} sebesar Rp ${money(deltaAmount).toLocaleString('id-ID')}`,
    block: undefined,
    unitId: undefined,
    wbsCode: contract.wbsCode,
    costCode: contract.costCode,
    costCodeName: contract.costCodeName,
    partyId: contract.vendorPartyId,
    partyName: contract.vendorName,
    partyRole: contract.vendorRole,
    quantity: contract.verifiedOpnamePercent,
    unitOfMeasure: '% opname',
    unitPrice: contract.totalContractBudget / 100,
    subtotal: deltaAmount,
    totalAmount: deltaAmount,
    paymentMethod: 'BELUM_DIBAYAR_HUTANG',
    isPaid: false,
    paidAmount: 0,
    outstandingAmount: deltaAmount,
    debitAccountCode: '1320',
    creditAccountCode: '2110',
    journalPosted: true,
    operatorName: actor,
    createdBy: actor,
    createdAt: new Date().toISOString(),
    status: 'POSTED',
    currentApprovalLevel: 1,
    approvalSteps: [{ stepNo: 1, roleRequired: actorRole, status: 'APPROVED', approverName: actor, approverRole: actorRole, actionDate: new Date().toISOString() }],
    needsReviewReason: party ? undefined : 'Vendor SPK belum ditemukan di master pihak.',
  };
}

export function createContractPaymentTransaction(
  state: AppState,
  contract: AppState['poContracts'][number],
  amount: number,
  bankAccountId: string,
  actor: string,
  actorRole: UserRole
): Transaction {
  const safeAmount = Math.min(money(amount), Math.max(0, money(contract.outstandingPayable)));
  if (safeAmount <= 0) throw new Error('Nominal pembayaran SPK melebihi hutang terverifikasi.');

  const account = state.bankAccounts.find(a => a.id === bankAccountId);
  if (!account) throw new Error('Rekening pembayaran SPK tidak ditemukan.');

  const projectId = contract.projectId || state.activeProjectId || '';
  const project = state.projects.find(p => p.id === projectId);
  return {
    id: `TRX-AP-${contract.id}-${contract.paidAmount + safeAmount}`,
    idempotencyKey: `AP-PAY-${contract.id}-${contract.paidAmount + safeAmount}`,
    date: new Date().toISOString().split('T')[0],
    projectId,
    projectName: project?.name || 'Project',
    type: 'TRANSFER',
    category: 'KONTRAKTOR_MANDOR',
    subcategory: `Pembayaran SPK ${contract.contractNo}`,
    description: `Pelunasan hutang vendor untuk ${contract.title}`,
    wbsCode: contract.wbsCode,
    costCode: contract.costCode,
    costCodeName: contract.costCodeName,
    partyId: contract.vendorPartyId,
    partyName: contract.vendorName,
    partyRole: contract.vendorRole,
    subtotal: safeAmount,
    totalAmount: safeAmount,
    paymentMethod: resolveCapitalPaymentMethod(bankAccountId),
    bankAccountId,
    bankAccountName: account.name,
    isPaid: true,
    paidDate: new Date().toISOString().split('T')[0],
    paidAmount: safeAmount,
    outstandingAmount: 0,
    debitAccountCode: '2110',
    creditAccountCode: bankAccountCoaCode(bankAccountId),
    journalPosted: true,
    operatorName: actor,
    createdBy: actor,
    createdAt: new Date().toISOString(),
    status: 'PAID',
    currentApprovalLevel: 1,
    approvalSteps: [{ stepNo: 1, roleRequired: actorRole, status: 'APPROVED', approverName: actor, approverRole: actorRole, actionDate: new Date().toISOString() }],
  };
}

