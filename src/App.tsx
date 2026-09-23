import React, { useState, useEffect } from 'react';
import { 
  Project, 
  Transaction, 
  ChartOfAccount, 
  CostCode, 
  WBSNode, 
  Party, 
  BankAccount, 
  ApprovalMatrixRule, 
  ControlCheckItem, 
  AuditLog, 
  UserRole, 
  AgingItem, 
  CustomerARRecord, 
  POContractTracking, 
  NotificationAlert, 
  NotificationAuditStatus,
  InitialCapitalEntry,
  SyncOutboxItem
} from './types';
import { 
  INITIAL_COA, 
  INITIAL_APPROVAL_RULES, 
  INITIAL_CONTROL_CHECKS 
} from './data/initialData';
import { 
  AppState, 
  loadAppState, 
  saveAppState, 
  clearAppState, 
  getDemoAppState 
} from './services/storageService';
import { createAuditRecord } from './services/auditService';
import { enqueueSync, processSyncQueue } from './services/syncService';
import { exportTransactionsToCSV } from './services/exportService';

// UI Views & Modals
import { FirstRunScreen } from './components/onboarding/FirstRunScreen';
import { ProjectSetupWizard } from './components/onboarding/ProjectSetupWizard';
import { MigrationCenterModal } from './components/onboarding/MigrationCenterModal';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { OperatorInputModal } from './components/OperatorInputModal';
import { COAAndCostCodes } from './components/COAAndCostCodes';
import { ApprovalCenter } from './components/ApprovalCenter';
import { AccountingAndBankView } from './components/AccountingAndBankView';
import { ControlChecksView } from './components/ControlChecksView';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { APARAgingView } from './components/APARAgingView';
import { CustomerARAndPSAK72View } from './components/CustomerARAndPSAK72View';
import { POContractTrackingView } from './components/POContractTrackingView';
import { NotificationAlertCenter } from './components/NotificationAlertCenter';
import { NotificationHistoryView } from './components/NotificationHistoryView';
import { ProjectSwitchModal } from './components/modals/ProjectSwitchModal';
import { BackupRestoreModal } from './components/modals/BackupRestoreModal';
import { IntegrationCenterModal } from './components/modals/IntegrationCenterModal';
import { InitialCapitalModal } from './components/modals/InitialCapitalModal';

import { 
  Building2, 
  LayoutDashboard, 
  BookOpen, 
  ShieldCheck, 
  FileSpreadsheet, 
  ShieldAlert, 
  PlusCircle, 
  Sparkles, 
  CalendarClock, 
  FileCheck2, 
  Briefcase, 
  History, 
  ChevronDown, 
  Layers, 
  Menu, 
  Database,
  Network,
  Coins,
  Download,
  RefreshCw,
  ArrowUpDown,
  CheckCircle2
} from 'lucide-react';

export function App() {
  // Load persistent state from LocalStorage on mount
  const [appState, setAppState] = useState<AppState | null>(() => loadAppState());

  // UI Navigation & Active Persona
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'aging' | 'customer_ar' | 'po_tracking' | 'wbs_cost' | 'approvals' | 'accounting_bank' | 'control_checks' | 'notification_history'
  >('dashboard');
  const [activeRole, setActiveRole] = useState<UserRole>('DIREKSI');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState<boolean>(false);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState<boolean>(false);
  const [isProjectSwitchModalOpen, setIsProjectSwitchModalOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState<boolean>(false);
  const [isCapitalModalOpen, setIsCapitalModalOpen] = useState<boolean>(false);
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState<boolean>(false);
  const [inspectingTx, setInspectingTx] = useState<Transaction | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Synchronize state changes to LocalStorage
  const updateAndPersist = (updater: (prev: AppState) => AppState) => {
    setAppState(prev => {
      if (!prev) return prev;
      const nextState = updater(prev);
      saveAppState(nextState);
      return nextState;
    });
  };

  // Active Project helper
  const activeProject = appState?.projects.find(p => p.id === appState.activeProjectId) || appState?.projects[0] || null;

  // Filter transactions, accounts, and aging for active project
  const currentTransactions = (appState?.transactions || []).filter(t => !t.projectId || !activeProject || t.projectId === activeProject.id);
  const currentBankAccounts = appState?.bankAccounts || [];
  const currentAgingItems = (appState?.agingItems || []).filter(i => !i.projectId || !activeProject || i.projectId === activeProject.id);
  const currentCustomerAR = (appState?.customerARRecords || []).filter(r => !r.projectId || !activeProject || r.projectId === activeProject.id);
  const currentPoContracts = (appState?.poContracts || []).filter(c => !c.projectId || !activeProject || c.projectId === activeProject.id);
  const currentAlerts = appState?.alerts || [];
  const currentAuditLogs = appState?.auditLogs || [];
  const currentCostCodes = appState?.costCodes || [];
  const currentWbsNodes = appState?.wbsNodes || [];
  const currentParties = appState?.parties || [];
  const pendingSyncCount = (appState?.syncQueue || []).filter(s => s.status === 'PENDING' || s.status === 'FAILED').length;

  // ---------------------------------------------------------------------------
  // PROJECT LIFECYCLE HANDLERS
  // ---------------------------------------------------------------------------
  const handleCreateProject = (
    newProject: Project,
    initialCapital: InitialCapitalEntry,
    accounts: BankAccount[]
  ) => {
    const baseState: AppState = {
      activeProjectId: newProject.id,
      projects: [...(appState?.projects || []), newProject],
      bankAccounts: accounts,
      capitalEntries: [...(appState?.capitalEntries || [])],
      transactions: [...(appState?.transactions || [])],
      parties: appState?.parties || [],
      agingItems: appState?.agingItems || [],
      customerARRecords: appState?.customerARRecords || [],
      poContracts: appState?.poContracts || [],
      alerts: appState?.alerts || [],
      auditLogs: appState?.auditLogs || [],
      wbsNodes: appState?.wbsNodes || [],
      costCodes: appState?.costCodes || [],
      workOrders: appState?.workOrders || [],
      equipmentAssets: appState?.equipmentAssets || [],
      internalDepartments: appState?.internalDepartments || [],
      syncQueue: appState?.syncQueue || [],
      integrationConfig: appState?.integrationConfig || {
        google: { status: 'NOT_CONFIGURED' },
        github: { status: 'NOT_CONFIGURED' },
        cloudflare: { status: 'NOT_CONFIGURED' },
        whatsapp: { manualModeAvailable: true, apiStatus: 'NOT_CONFIGURED' },
      },
    };

    const tx = createCapitalTransaction(
      baseState,
      newProject.id,
      initialCapital,
      `${activeRole} Controller`,
      activeRole
    );
    const posted = postTransaction(baseState, tx, `${activeRole} Controller`, activeRole);

    if (!posted.validation.valid) {
      showToast(`⚠️ Project tidak dapat dibuat: ${posted.validation.errors.join(' | ')}`);
      return;
    }

    const audit = createAuditRecord(
      'CREATE',
      newProject.id,
      `Inisialisasi Project ${newProject.name} (${newProject.code}) melalui transaction engine dengan modal Rp ${initialCapital.amount.toLocaleString('id-ID')}`,
      `${activeRole} User`,
      activeRole
    );

    const projectSyncQueue = enqueueSync(
      posted.state.syncQueue,
      'PROJECT',
      newProject.id,
      'CREATE',
      newProject
    );
    const nextSyncQueue = enqueueSync(
      projectSyncQueue,
      'CAPITAL',
      initialCapital.id,
      'CREATE',
      initialCapital
    );

    const nextState: AppState = {
      ...posted.state,
      capitalEntries: [initialCapital, ...posted.state.capitalEntries],
      alerts: [
        {
          id: `ALT-INIT-${Date.now().toString().slice(-4)}`,
          timestamp: 'Baru saja',
          date: initialCapital.date,
          type: 'CONTROL_WARNING',
          title: `Project ${newProject.name} Dibuka`,
          message: `Project resmi dibuat dengan modal disetor Rp ${initialCapital.amount.toLocaleString('id-ID')}.`,
          priority: 'LOW',
          severity: 'LOW',
          read: false,
          targetRoles: ['DIREKSI', 'PROJECT_MANAGER', 'FINANCE', 'OPERATOR'],
          category: 'Setup Project',
          auditStatus: 'RESOLVED',
        },
        ...posted.state.alerts,
      ],
      auditLogs: [audit, ...posted.state.auditLogs],
      syncQueue: nextSyncQueue,
    };

    setAppState(nextState);
    saveAppState(nextState);
    setIsSetupWizardOpen(false);
    setIsMigrationModalOpen(false);
    showToast(`🎉 Project ${newProject.name} berhasil dibuat dan modal awal diposting melalui engine.`);
  };

  const handleSelectProject = (projectId: string) => {
    updateAndPersist(prev => ({
      ...prev,
      activeProjectId: projectId,
      auditLogs: [
        createAuditRecord('APPROVE', projectId, `Beralih ke project aktif ${projectId}`, `${activeRole} User`, activeRole),
        ...prev.auditLogs
      ]
    }));
    showToast(`Beralih ke project aktif.`);
  };

  const handleLoadDemoProject = () => {
    const demo = getDemoAppState();
    setAppState(demo);
    saveAppState(demo);
    showToast(`⚡ Data Simulasi / Demo Graha Asri berhasil dimuat!`);
  };

  const handleClearProductionData = () => {
    clearAppState();
    setAppState(null);
    showToast('Database berhasil direset. Aplikasi kembali ke kondisi awal.');
  };

  const handleAddParty = (party: Party) => {
    updateAndPersist(prev => ({
      ...prev,
      parties: prev.parties.some(p => p.id === party.id) ? prev.parties : [party, ...prev.parties],
      auditLogs: [
        createAuditRecord('CREATE', party.id, `Master pihak ${party.name} ditambahkan`, `${activeRole} User`, activeRole),
        ...prev.auditLogs
      ],
      syncQueue: enqueueSync(prev.syncQueue, 'PARTY', party.id, 'CREATE', party),
    }));
    showToast(`✓ Master pihak ${party.name} tersimpan.`);
  };

  const handleUpdateParty = (party: Party) => {
    updateAndPersist(prev => ({
      ...prev,
      parties: prev.parties.map(p => p.id === party.id ? party : p),
      auditLogs: [
        createAuditRecord('UPDATE', party.id, `Master pihak ${party.name} diperbarui`, `${activeRole} User`, activeRole),
        ...prev.auditLogs
      ],
      syncQueue: enqueueSync(prev.syncQueue, 'PARTY', party.id, 'UPDATE', party),
    }));
  };

  const handleAddWorkOrder = (workOrder: AppState['workOrders'][number]) => {
    updateAndPersist(prev => ({
      ...prev,
      workOrders: prev.workOrders.some(w => w.id === workOrder.id) ? prev.workOrders : [workOrder, ...prev.workOrders],
      auditLogs: [
        createAuditRecord('CREATE', workOrder.id, `Work Order ${workOrder.woNumber} dibuat untuk ${workOrder.destinationProjectName || 'Project umum'}`, `${activeRole} User`, activeRole),
        ...prev.auditLogs
      ],
      syncQueue: enqueueSync(prev.syncQueue, 'WORK_ORDER', workOrder.id, 'CREATE', workOrder),
    }));
    showToast(`✓ Work Order ${workOrder.woNumber} tersimpan dan terhubung ke project tujuan.`);
  };

  const handleUpdateWorkOrder = (workOrder: AppState['workOrders'][number]) => {
    updateAndPersist(prev => ({
      ...prev,
      workOrders: prev.workOrders.map(w => w.id === workOrder.id ? workOrder : w),
      auditLogs: [
        createAuditRecord('UPDATE', workOrder.id, `Work Order ${workOrder.woNumber} diperbarui`, `${activeRole} User`, activeRole),
        ...prev.auditLogs
      ],
      syncQueue: enqueueSync(prev.syncQueue, 'WORK_ORDER', workOrder.id, 'UPDATE', workOrder),
    }));
  };

  const handleAddEquipmentAsset = (asset: AppState['equipmentAssets'][number]) => {
    updateAndPersist(prev => ({
      ...prev,
      equipmentAssets: prev.equipmentAssets.some(e => e.id === asset.id) ? prev.equipmentAssets : [asset, ...prev.equipmentAssets],
      auditLogs: [
        createAuditRecord('CREATE', asset.id, `Equipment/Aset ${asset.code} ${asset.name} didaftarkan`, `${activeRole} User`, activeRole),
        ...prev.auditLogs
      ],
      syncQueue: enqueueSync(prev.syncQueue, 'EQUIPMENT', asset.id, 'CREATE', asset),
    }));
    showToast(`✓ Aset ${asset.code} tersimpan di register.`);
  };

  const handleUpdateEquipmentAsset = (asset: AppState['equipmentAssets'][number]) => {
    updateAndPersist(prev => ({
      ...prev,
      equipmentAssets: prev.equipmentAssets.map(e => e.id === asset.id ? asset : e),
      auditLogs: [
        createAuditRecord('UPDATE', asset.id, `Equipment/Aset ${asset.code} diperbarui`, `${activeRole} User`, activeRole),
        ...prev.auditLogs
      ],
      syncQueue: enqueueSync(prev.syncQueue, 'EQUIPMENT', asset.id, 'UPDATE', asset),
    }));
  };

  // ---------------------------------------------------------------------------
  // TRANSACTIONS & CASH ENGINE
  // ---------------------------------------------------------------------------
  const handleSaveTransaction = (newTx: Transaction) => {
    if (!appState) return;
    const result = postTransaction(appState, newTx, `${activeRole} User`, activeRole);
    if (!result.validation.valid) {
      showToast(`⚠️ Transaksi ditolak engine: ${result.validation.errors.join(' | ')}`);
      return;
    }
    if (result.duplicate) {
      showToast('⚠️ Transaksi duplikat dicegah oleh idempotency engine.');
      return;
    }
    setAppState(result.state);
    saveAppState(result.state);
    showToast(`✅ Transaksi ${newTx.id} diproses oleh transaction engine.`);
  };

  const handleApproveTransaction = (txId: string, stepNo: number, notes: string) => {
    const target = appState?.transactions.find(tx => tx.id === txId);
    const currentStep = target?.approvalSteps.find(step => step.status === 'PENDING');
    if (!target || !currentStep || currentStep.stepNo !== stepNo || (activeRole !== currentStep.roleRequired && activeRole !== 'ADMIN')) {
      showToast('⚠️ Approval ditolak: role atau langkah aktif tidak sesuai.');
      return;
    }
    updateAndPersist(prev => {
      const updatedTx = prev.transactions.map(tx => {
        if (tx.id !== txId) return tx;

        const updatedSteps = tx.approvalSteps.map(s => {
          if (s.stepNo === stepNo) {
            return {
              ...s,
              status: 'APPROVED' as const,
              approverName: `${activeRole} Officer`,
              approverRole: activeRole,
              actionDate: new Date().toISOString(),
              notes
            };
          }
          return s;
        });

        const allApproved = updatedSteps.every(s => s.status === 'APPROVED');
        const nextStatus = (allApproved ? (tx.isPaid ? 'PAID' : 'APPROVED') : 'VERIFIED') as import('./types').TransactionStatus;

        return {
          ...tx,
          approvalSteps: updatedSteps,
          status: nextStatus
        };
      });

      const audit = createAuditRecord(
        'APPROVE',
        txId,
        `Menyetujui langkah ${stepNo} untuk transaksi ${txId} (${notes})`,
        `${activeRole} User`,
        activeRole
      );

      return {
        ...prev,
        transactions: updatedTx,
        auditLogs: [audit, ...prev.auditLogs],
        syncQueue: enqueueSync(prev.syncQueue, 'TRANSACTION', txId, 'UPDATE', { status: 'APPROVED', stepNo }),
      };
    });

    showToast(`✅ Transaksi ${txId} langkah ${stepNo} disetujui.`);
  };

  const handleRejectTransaction = (txId: string, stepNo: number, notes: string) => {
    const target = appState?.transactions.find(tx => tx.id === txId);
    const currentStep = target?.approvalSteps.find(step => step.status === 'PENDING');
    if (!target || !currentStep || currentStep.stepNo !== stepNo || (activeRole !== currentStep.roleRequired && activeRole !== 'ADMIN')) {
      showToast('⚠️ Penolakan ditolak: role atau langkah aktif tidak sesuai.');
      return;
    }
    updateAndPersist(prev => {
      const updatedTx = prev.transactions.map(tx => {
        if (tx.id !== txId) return tx;
        const updatedSteps = tx.approvalSteps.map(s => {
          if (s.stepNo === stepNo) {
            return {
              ...s,
              status: 'REJECTED' as const,
              approverName: `${activeRole} Officer`,
              approverRole: activeRole,
              actionDate: new Date().toISOString(),
              notes
            };
          }
          return s;
        });

        const rejectedStatus = 'REJECTED' as import('./types').TransactionStatus;

        return {
          ...tx,
          approvalSteps: updatedSteps,
          status: rejectedStatus
        };
      });

      const audit = createAuditRecord(
        'REJECT',
        txId,
        `Menolak transaksi ${txId} pada langkah ${stepNo} (${notes})`,
        `${activeRole} User`,
        activeRole
      );

      return {
        ...prev,
        transactions: updatedTx,
        auditLogs: [audit, ...prev.auditLogs],
        syncQueue: enqueueSync(prev.syncQueue, 'TRANSACTION', txId, 'UPDATE', { status: 'REJECTED' }),
      };
    });

    showToast(`⚠️ Transaksi ${txId} ditolak.`);
  };

  // Additional Capital Injection Handler
  const handleAddInitialCapital = (entry: InitialCapitalEntry) => {
    if (!appState) return;
    const tx = createCapitalTransaction(appState, entry.projectId, entry, `${activeRole} User`, activeRole);
    const result = postTransaction(appState, tx, `${activeRole} User`, activeRole);
    if (!result.validation.valid) {
      showToast(`⚠️ Modal ditolak engine: ${result.validation.errors.join(' | ')}`);
      return;
    }
    if (result.duplicate) {
      showToast('⚠️ Setoran modal duplikat dicegah oleh idempotency engine.');
      return;
    }
    const nextState = {
      ...result.state,
      capitalEntries: [entry, ...result.state.capitalEntries],
      syncQueue: enqueueSync(result.state.syncQueue, 'CAPITAL', entry.id, 'CREATE', entry),
    };
    setAppState(nextState);
    saveAppState(nextState);
    showToast(`💰 Setoran modal Rp ${entry.amount.toLocaleString('id-ID')} terhubung ke transaksi, kas/bank, jurnal, audit, dan outbox.`);
  };

  // Real Sync Action
  const handleTriggerSync = async () => {
    if (!appState || isSyncing) return;
    setIsSyncing(true);
    showToast('Sedang memproses antrean sinkronisasi...');
    
    const result = await processSyncQueue(appState.syncQueue);
    updateAndPersist(prev => ({
      ...prev,
      syncQueue: result.updatedQueue,
    }));
    
    setIsSyncing(false);
    if (result.success) {
      showToast(`✓ Sinkronisasi tuntas! ${result.syncedCount} item berhasil diselaraskan.`);
    } else {
      showToast(`⚠️ Sinkronisasi selesai: ${result.syncedCount} berhasil, ${result.failedCount} gagal.`);
    }
  };

  // Export CSV Action
  const handleExportCSV = () => {
    if (!activeProject) return;
    exportTransactionsToCSV(currentTransactions, activeProject.name);
    showToast(`📥 File CSV transaksi ${activeProject.name} berhasil diunduh.`);
  };

  // ---------------------------------------------------------------------------
  // EXISTING ADVANCED AUDIT / RECONCILIATION HANDLERS
  // ---------------------------------------------------------------------------
  const handleResolveException = (txId: string, newCostCode: string, newCategory: any, note: string) => {
    updateAndPersist(prev => {
      const updatedTx = prev.transactions.map(tx => {
        if (tx.id === txId) {
          return {
            ...tx,
            costCode: newCostCode,
            costCodeName: newCostCode === 'BLD-002' ? 'Struktur Beton Bertulang (WBS 05)' : 'Pondasi Batu Kali (WBS 05)',
            wbsCode: '05',
            category: newCategory,
            debitAccountCode: '1320',
            creditAccountCode: '1120',
            status: 'VERIFIED' as const,
            description: `${tx.description} - [Diverifikasi: ${note}]`
          };
        }
        return tx;
      });

      const audit = createAuditRecord(
        'CORRECTION',
        txId,
        `Reklasifikasi transaksi ${txId} ke Cost Code ${newCostCode} (${note})`,
        `${activeRole} Controller`,
        activeRole
      );

      return {
        ...prev,
        transactions: updatedTx,
        auditLogs: [audit, ...prev.auditLogs],
        syncQueue: enqueueSync(prev.syncQueue, 'TRANSACTION', txId, 'UPDATE', { costCode: newCostCode }),
      };
    });

    showToast(`✓ Berhasil! Transaksi ${txId} direklasifikasi ke Cost Code ${newCostCode}.`);
  };

  const handlePostBankReconciliation = (accountId: string, adjustedBalance: number, causeDescription: string) => {
    updateAndPersist(prev => {
      const updatedAccounts = prev.bankAccounts.map(b => {
        if (b.id === accountId) {
          return {
            ...b,
            statementBalance: adjustedBalance,
            currentBalance: adjustedBalance,
            unreconciledDifference: 0,
            reconciliationStatus: 'RECONCILED' as const
          };
        }
        return b;
      });

      const account = prev.bankAccounts.find(b => b.id === accountId);
      const actualDifference = account?.unreconciledDifference || 0;
      const audit = createAuditRecord(
        'RECONCILE',
        accountId,
        `Posting Jurnal Penyesuaian Rekonsiliasi Bank Rp ${actualDifference.toLocaleString('id-ID')} (${causeDescription})`,
        `${activeRole} Akuntan`,
        activeRole
      );

      return {
        ...prev,
        bankAccounts: updatedAccounts,
        auditLogs: [audit, ...prev.auditLogs],
        syncQueue: enqueueSync(prev.syncQueue, 'ACCOUNT', accountId, 'RECONCILE', { adjustedBalance }),
      };
    });

    showToast(`✓ Rekonsiliasi Bank tuntas! Selisih berhasil diselaraskan.`);
  };

  // PSAK 72 & PO Operations
  const handleProcessBAST = (unitId: string) => {
    if (!appState) return;
    const record = appState.customerARRecords.find(rec => rec.unitId === unitId);
    if (!record) {
      showToast('⚠️ Unit/kontrak konsumen tidak ditemukan.');
      return;
    }
    if (record.psak72.handoverStatus === 'BAST_COMPLETED') {
      showToast(`ℹ️ BAST Unit ${unitId} sudah selesai. Engine tidak memposting ulang jurnal.`);
      return;
    }

    try {
      let nextState = appState;
      const bastTransactions = createBASTRecognitionTransactions(appState, record, `${activeRole} Controller`, activeRole);
      for (const tx of bastTransactions) {
        const posted = postTransaction(nextState, tx, `${activeRole} Controller`, activeRole);
        if (!posted.validation.valid) {
          showToast(`⚠️ BAST ditolak engine: ${posted.validation.errors.join(' | ')}`);
          return;
        }
        nextState = posted.state;
      }

      const today = new Date().toISOString().split('T')[0];
      const fullPrice = record.sellingPrice;
      const updatedCustomerAR = nextState.customerARRecords.map(rec => rec.id === record.id ? {
        ...rec,
        psak72: {
          ...rec.psak72,
          contractLiabilityBalance: 0,
          recognizedRevenue: fullPrice,
          handoverStatus: 'BAST_COMPLETED' as const,
          bastDate: today,
          bastNo: `BAST/${nextState.projects.find(p => p.id === rec.projectId)?.code || 'PROJECT'}/${new Date().getFullYear()}/${rec.unitNo}`,
          notes: `BAST selesai. Pendapatan kontrak Rp ${fullPrice.toLocaleString('id-ID')} diposting melalui engine.`
        }
      } : rec);

      const updatedProjects = nextState.projects.map(project => ({
        ...project,
        units: project.units.map(unit => unit.id === unitId ? {
          ...unit,
          status: 'HANDED_OVER' as const,
          bastDate: today,
          paidAmount: record.totalPaid,
          outstandingAR: Math.max(0, record.sellingPrice - record.totalPaid)
        } : unit)
      }));

      const finalState = {
        ...nextState,
        customerARRecords: updatedCustomerAR,
        projects: updatedProjects,
        auditLogs: [
          createAuditRecord(
            'APPROVE',
            unitId,
            `BAST Unit ${unitId} selesai; revenue recognition dan transfer HPP diposting.`,
            `${activeRole} Controller`,
            activeRole
          ),
          ...nextState.auditLogs,
        ],
        syncQueue: enqueueSync(nextState.syncQueue, 'CUSTOMER_AR', record.id, 'UPDATE', {
          event: 'BAST_COMPLETED',
          unitId,
          revenue: fullPrice,
          totalPaid: record.totalPaid,
        }),
      };

      setAppState(finalState);
      saveAppState(finalState);
      showToast(`🏛️ BAST Unit ${unitId} selesai; jurnal revenue/HPP dan status unit sudah terhubung.`);
    } catch (error: any) {
      showToast(`⚠️ BAST gagal: ${error?.message || 'Engine error'}`);
    }
  };

  const handleRecordCustomerPayment = (customerRecordId: string, scheduleId: string, amount: number) => {
    if (!appState) return;
    const record = appState.customerARRecords.find(r => r.id === customerRecordId);
    if (!record) {
      showToast('⚠️ Kontrak konsumen tidak ditemukan.');
      return;
    }
    const bankAccountId = 'BNK-03';
    try {
      const tx = createCustomerPaymentTransaction(appState, record, scheduleId, amount, bankAccountId, `${activeRole} Kasir`, activeRole);
      const posted = postTransaction(appState, tx, `${activeRole} Kasir`, activeRole);
      if (!posted.validation.valid) {
        showToast(`⚠️ Penerimaan ditolak engine: ${posted.validation.errors.join(' | ')}`);
        return;
      }
      if (posted.duplicate) {
        showToast('⚠️ Penerimaan termin ini sudah pernah diposting.');
        return;
      }
      const schedule = record.schedules.find(s => s.id === scheduleId);
      const paidAmount = Math.min(amount, schedule?.amount || amount);
      const updatedRecords = posted.state.customerARRecords.map(rec => {
        if (rec.id !== customerRecordId) return rec;
        const schedules = rec.schedules.map(s => s.id === scheduleId ? {
          ...s,
          status: 'PAID' as const,
          paidDate: tx.paidDate,
          paidAmount: (s.paidAmount || 0) + paidAmount,
          receiptTxId: tx.id
        } : s);
        const totalPaid = schedules.reduce((sum, item) => sum + (item.paidAmount || 0), 0);
        const outstanding = Math.max(0, rec.sellingPrice - totalPaid);
        return {
          ...rec,
          totalPaid,
          totalOutstandingAR: outstanding,
          kprOutstandingOrRemaining: Math.max(0, outstanding - rec.bookingFeeAmount),
          schedules,
          psak72: {
            ...rec.psak72,
            contractLiabilityBalance: rec.psak72.handoverStatus === 'BAST_COMPLETED'
              ? Math.max(0, rec.psak72.contractLiabilityBalance)
              : Math.max(0, totalPaid - rec.psak72.recognizedRevenue)
          }
        };
      });
      const nextState = {
        ...posted.state,
        customerARRecords: updatedRecords,
        syncQueue: enqueueSync(posted.state.syncQueue, 'CUSTOMER_AR', customerRecordId, 'UPDATE', { customerRecordId, scheduleId, payment: paidAmount })
      };
      setAppState(nextState);
      saveAppState(nextState);
      showToast('✓ Penerimaan konsumen diproses oleh transaction engine.');
    } catch (error: any) {
      showToast(`⚠️ Penerimaan gagal: ${error?.message || 'Nominal tidak valid'}`);
    }
  };

  const handleUpdateOpname = (contractId: string, newProgress: number) => {
    if (!appState) return;
    const contract = appState.poContracts.find(c => c.id === contractId);
    if (!contract) {
      showToast('⚠️ SPK tidak ditemukan.');
      return;
    }
    const bounded = Math.max(contract.verifiedOpnamePercent, Math.min(100, newProgress));
    const oldAmount = contract.verifiedOpnameAmount;
    const verifiedAmount = (bounded / 100) * contract.totalContractBudget;
    const deltaAmount = Math.max(0, verifiedAmount - oldAmount);
    let nextState = appState;
    if (deltaAmount > 0) {
      const tx = createContractOpnameTransaction(appState, contract, deltaAmount, `${activeRole} Site QS`, activeRole);
      const posted = postTransaction(appState, tx, `${activeRole} Site QS`, activeRole);
      if (!posted.validation.valid) {
        showToast(`⚠️ Opname ditolak engine: ${posted.validation.errors.join(' | ')}`);
        return;
      }
      nextState = posted.state;
    }

    const updatedContracts = nextState.poContracts.map(c => {
      if (c.id !== contractId) return c;
      const newInvoiced = Math.max(c.invoicedAmount, verifiedAmount);
      return {
        ...c,
        verifiedOpnamePercent: bounded,
        verifiedOpnameAmount: verifiedAmount,
        invoicedAmount: newInvoiced,
        outstandingPayable: Math.max(0, newInvoiced - c.paidAmount),
        status: bounded >= 100 ? ('COMPLETED' as const) : ('ACTIVE' as const)
      };
    });
    nextState = {
      ...nextState,
      poContracts: updatedContracts,
      syncQueue: enqueueSync(nextState.syncQueue, 'PO_CONTRACT', contractId, 'UPDATE', { contractId, verifiedOpnamePercent: bounded, verifiedOpnameAmount: verifiedAmount })
    };
    setAppState(nextState);
    saveAppState(nextState);
    showToast(`Opname fisik SPK ${contractId} terhubung ke WBS, cost code, biaya proyek, AP dan audit.`);
  };

  const handlePayContractTermin = (contractId: string, amount: number) => {
    if (!appState) return;
    const contract = appState.poContracts.find(c => c.id === contractId);
    if (!contract) {
      showToast('⚠️ SPK tidak ditemukan.');
      return;
    }
    try {
      const bankAccountId = 'BNK-02';
      const tx = createContractPaymentTransaction(appState, contract, amount, bankAccountId, `${activeRole} Finance`, activeRole);
      const posted = postTransaction(appState, tx, `${activeRole} Finance`, activeRole);
      if (!posted.validation.valid) {
        showToast(`⚠️ Pembayaran SPK ditolak engine: ${posted.validation.errors.join(' | ')}`);
        return;
      }
      if (posted.duplicate) {
        showToast('⚠️ Settlement hutang ini sudah pernah diposting.');
        return;
      }
      const paid = tx.totalAmount;
      const updatedContracts = posted.state.poContracts.map(c => {
        if (c.id !== contractId) return c;
        const newPaid = c.paidAmount + paid;
        return {
          ...c,
          paidAmount: newPaid,
          outstandingCommitment: Math.max(0, c.totalContractBudget - newPaid),
          outstandingPayable: Math.max(0, c.invoicedAmount - newPaid),
          status: newPaid >= c.totalContractBudget ? ('COMPLETED' as const) : c.status
        };
      });
      const nextState = {
        ...posted.state,
        poContracts: updatedContracts,
        syncQueue: enqueue(posted.state.syncQueue, 'PO_CONTRACT', contractId, 'UPDATE', { contractId, paidAmount: paid })
      };
      setAppState(nextState);
      saveAppState(nextState);
      showToast(`Pembayaran SPK ${contractId} diproses melalui settlement engine.`);
    } catch (error: any) {
      showToast(`⚠️ Pembayaran SPK gagal: ${error?.message || 'Nominal tidak valid'}`);
    }
  };

  // ---------------------------------------------------------------------------
  // FIRST-RUN STATE CHECK
  // ---------------------------------------------------------------------------
  if (!appState || appState.projects.length === 0 || !activeProject) {
    return (
      <>
        <FirstRunScreen
          onStartSetup={() => setIsSetupWizardOpen(true)}
          onStartMigration={() => setIsMigrationModalOpen(true)}
          onLoadDemo={handleLoadDemoProject}
        />

        <ProjectSetupWizard
          isOpen={isSetupWizardOpen}
          onClose={() => setIsSetupWizardOpen(false)}
          onSubmit={handleCreateProject}
        />

        <MigrationCenterModal
          isOpen={isMigrationModalOpen}
          onClose={() => setIsMigrationModalOpen(false)}
          onSubmitMigration={handleCreateProject}
        />
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN RUNNING APPLICATION
  // ---------------------------------------------------------------------------
  const pendingApprovalsCount = currentTransactions.filter(t => t.status === 'SUBMITTED' || t.status === 'VERIFIED').length;
  const isSecondaryActive = ['aging', 'customer_ar', 'po_tracking', 'mitra', 'control_checks', 'notification_history'].includes(activeTab);

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-800 flex flex-col font-sans">
      {/* Top Main Navigation Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo & Name (Interactive Project Selector) */}
            <div 
              onClick={() => setIsProjectSwitchModalOpen(true)}
              className="flex items-center gap-3 cursor-pointer group p-1 -ml-1 rounded-xl hover:bg-slate-800/80 transition-colors"
              title="Klik untuk memilih atau menambah project"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center shadow-md">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-base tracking-tight block group-hover:text-indigo-300 transition-colors">
                    {activeProject.name}
                  </span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-300" />
                  {activeProject.isDemo ? (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Simulasi
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Produksi
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {activeProject.developerCompany || 'PT Developer'} • {activeProject.code}
                </span>
              </div>
            </div>

            {/* Persona / Role Switcher */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-800/90 p-1 px-2.5 rounded-xl border border-indigo-500/30 shadow-xs">
              <div className="flex items-center gap-1.5 pl-1 pr-1.5 border-r border-slate-700/80">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <div className="leading-tight">
                  <span className="text-[10px] uppercase font-black text-indigo-300 tracking-wider block">
                    Role Aktif
                  </span>
                  <span className="text-[9px] text-slate-400 block -mt-0.5">{activeRole}</span>
                </div>
              </div>
              {(['OPERATOR', 'FINANCE', 'PROJECT_MANAGER', 'DIREKSI'] as UserRole[]).map(role => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeRole === role
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {role === 'OPERATOR' ? '👷 Operator' :
                   role === 'FINANCE' ? '💼 Finance' :
                   role === 'PROJECT_MANAGER' ? '📐 PM' : '👔 Direksi'}
                </button>
              ))}
            </div>

            {/* Action buttons & Notification Center */}
            <div className="flex items-center gap-2">
              {/* Real Sync Outbox Button */}
              <button
                type="button"
                onClick={handleTriggerSync}
                disabled={isSyncing}
                title="Sinkronisasi Antrean Outbox"
                className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  pendingSyncCount > 0 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
                {pendingSyncCount > 0 && (
                  <span className="text-[10px] font-black">{pendingSyncCount}</span>
                )}
              </button>

              <NotificationAlertCenter
                alerts={currentAlerts}
                currentRole={activeRole}
                onSelectAlert={(a) => {
                  if (a.transactionId) {
                    const found = currentTransactions.find(t => t.id === a.transactionId);
                    if (found) setInspectingTx(found);
                  }
                }}
                onSimulateNewAlert={() => {}}
                onMarkAllAsRead={() => {
                  updateAndPersist(prev => ({
                    ...prev,
                    alerts: prev.alerts.map(a => ({ ...a, read: true }))
                  }));
                  showToast('Semua notifikasi ditandai dibaca.');
                }}
                onViewAllHistory={() => { setActiveTab('notification_history'); setIsMoreMenuOpen(false); }}
              />

              <button
                onClick={() => setIsOperatorModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">+ Catat Transaksi</span>
                <span className="sm:hidden">+ Catat</span>
              </button>
            </div>
          </div>

          {/* Modular Navigation Tabs */}
          <div className="border-t border-slate-800/70 flex items-center justify-between py-1.5">
            <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => { setActiveTab('dashboard'); setIsMoreMenuOpen(false); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Executive Dashboard</span>
              </button>

              <button
                onClick={() => { setActiveTab('wbs_cost'); setIsMoreMenuOpen(false); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'wbs_cost'
                    ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Kontrol Biaya &amp; COA</span>
              </button>

              <button
                onClick={() => { setActiveTab('accounting_bank'); setIsMoreMenuOpen(false); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'accounting_bank'
                    ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Kas &amp; Bank</span>
              </button>

              <button
                onClick={() => { setActiveTab('approvals'); setIsMoreMenuOpen(false); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'approvals'
                    ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Approval Center</span>
                {pendingApprovalsCount > 0 && (
                  <span className="bg-amber-400 text-slate-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>

              {/* Modul Lanjutan & Utility Actions */}
              <div className="relative">
                <button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    isSecondaryActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700/60'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Modul &amp; Utilitas</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMoreMenuOpen && (
                  <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                      Modul Kontrol Proyek
                    </div>

                    <button
                      onClick={() => { setActiveTab('aging'); setIsMoreMenuOpen(false); }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white cursor-pointer"
                    >
                      <CalendarClock className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <div className="font-semibold">AP &amp; AR Aging</div>
                        <div className="text-[10px] text-slate-500">Jadwal jatuh tempo hutang &amp; piutang</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setActiveTab('customer_ar'); setIsMoreMenuOpen(false); }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white cursor-pointer"
                    >
                      <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-semibold">AR &amp; PSAK 72 (Pendapatan)</div>
                        <div className="text-[10px] text-slate-500">Kontrak konsumen &amp; eksekusi BAST</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setActiveTab('po_tracking'); setIsMoreMenuOpen(false); }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white cursor-pointer"
                    >
                      <Briefcase className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <div className="font-semibold">PO &amp; Kontrak Rekanan</div>
                        <div className="text-[10px] text-slate-500">Komitmen subkon &amp; opname fisik</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setActiveTab('mitra'); setIsMoreMenuOpen(false); }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white cursor-pointer"
                    >
                      <Briefcase className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <div className="font-semibold">Mitra, Workshop &amp; Equipment</div>
                        <div className="text-[10px] text-slate-500">Master pihak, fabrikasi, lifting, aset &amp; alokasi biaya</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setActiveTab('control_checks'); setIsMoreMenuOpen(false); }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <div className="font-semibold">Control Checks &amp; Risk Register</div>
                        <div className="text-[10px] text-slate-500">Diagnostic aturan integritas</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setActiveTab('notification_history'); setIsMoreMenuOpen(false); }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white cursor-pointer"
                    >
                      <History className="w-4 h-4 text-purple-400 shrink-0" />
                      <div>
                        <div className="font-semibold">Notification History &amp; Audit Trail</div>
                        <div className="text-[10px] text-slate-500">Log audit notifikasi &amp; respons</div>
                      </div>
                    </button>

                    <div className="px-3 py-1 mt-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-t border-b border-slate-800">
                      Utilitas Data &amp; Operasional
                    </div>

                    <button
                      onClick={() => { setIsCapitalModalOpen(true); setIsMoreMenuOpen(false); }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-emerald-400 cursor-pointer"
                    >
                      <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-semibold">Setor Modal / Dana Awal</span>
                    </button>

                    <button
                      onClick={() => { handleExportCSV(); setIsMoreMenuOpen(false); }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-indigo-400 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="font-semibold">Export CSV Transaksi</span>
                    </button>

                    <button
                      onClick={() => { setIsBackupModalOpen(true); setIsMoreMenuOpen(false); }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-purple-400 cursor-pointer"
                    >
                      <Database className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="font-semibold">Backup &amp; Restore JSON</span>
                    </button>

                    <button
                      onClick={() => { setIsIntegrationModalOpen(true); setIsMoreMenuOpen(false); }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-cyan-400 cursor-pointer"
                    >
                      <Network className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="font-semibold">Integrasi Cloud &amp; WhatsApp</span>
                    </button>
                  </div>
                )}
              </div>
            </nav>

            {/* Mobile Navigation Toggle */}
            <div className="md:hidden flex items-center justify-between w-full py-1">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-2 text-xs font-bold"
              >
                <Menu className="w-4 h-4" />
                <span className="capitalize">{activeTab.replace('_', ' ')}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>{activeRole}</span>
              </div>
            </div>
          </div>

          {/* Mobile Collapsible Drawer */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-slate-800 py-2 space-y-1 animate-in fade-in duration-150">
              {[
                { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
                { id: 'wbs_cost', label: 'Kontrol Biaya & COA', icon: BookOpen },
                { id: 'accounting_bank', label: 'Kas & Bank', icon: FileSpreadsheet },
                { id: 'approvals', label: 'Approval Center', icon: ShieldCheck },
                { id: 'aging', label: 'AP & AR Aging', icon: CalendarClock },
                { id: 'customer_ar', label: 'AR & PSAK 72', icon: FileCheck2 },
                { id: 'po_tracking', label: 'PO & Kontrak Rekanan', icon: Briefcase },
                { id: 'mitra', label: 'Mitra, Workshop & Equipment', icon: Briefcase },
                { id: 'control_checks', label: 'Control Checks & Audit', icon: ShieldAlert },
                { id: 'notification_history', label: 'Notification History', icon: History }
              ].map(item => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold ${
                      activeTab === item.id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* Toast notification banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {activeTab === 'dashboard' && (
          <ExecutiveDashboard
            project={activeProject}
            bankAccounts={currentBankAccounts}
            transactions={currentTransactions}
            controlChecks={INITIAL_CONTROL_CHECKS}
            agingItems={currentAgingItems}
            activeRole={activeRole}
            onOpenOperatorInput={() => setIsOperatorModalOpen(true)}
            onOpenApprovals={() => setActiveTab('approvals')}
            onNavigateToTab={(tab) => {
              setActiveTab(tab as any);
              setIsMoreMenuOpen(false);
            }}
            onSelectTransactionForReview={(tx) => setInspectingTx(tx)}
            onResolveException={handleResolveException}
            onPostBankReconciliation={handlePostBankReconciliation}
          />
        )}

        {activeTab === 'notification_history' && (
          <NotificationHistoryView
            alerts={currentAlerts}
            activeRole={activeRole}
            onUpdateAlertStatus={(alertId, newStatus, note, responderName) => {
              updateAndPersist(prev => ({
                ...prev,
                alerts: prev.alerts.map(a => a.id === alertId ? { ...a, auditStatus: newStatus, responseNote: note, respondedBy: responderName, read: true } : a)
              }));
              showToast(`✓ Audit alert [${alertId}] disimpan.`);
            }}
            onToggleRead={(alertId) => {
              updateAndPersist(prev => ({
                ...prev,
                alerts: prev.alerts.map(a => a.id === alertId ? { ...a, read: !a.read } : a)
              }));
            }}
            onMarkAllAsRead={() => {
              updateAndPersist(prev => ({
                ...prev,
                alerts: prev.alerts.map(a => ({ ...a, read: true }))
              }));
              showToast('Semua notifikasi ditandai dibaca.');
            }}
            onSelectTransaction={(txId) => {
              const foundTx = currentTransactions.find(t => t.id === txId);
              if (foundTx) setInspectingTx(foundTx);
            }}
            onNavigateToTab={(tab) => setActiveTab(tab as any)}
          />
        )}

        {activeTab === 'aging' && (
          <APARAgingView
            agingItems={currentAgingItems}
          />
        )}

        {activeTab === 'customer_ar' && (
          <CustomerARAndPSAK72View
            records={currentCustomerAR}
            onProcessBAST={handleProcessBAST}
            onRecordCustomerPayment={handleRecordCustomerPayment}
          />
        )}

        {activeTab === 'po_tracking' && (
          <POContractTrackingView
            contracts={currentPoContracts}
            onUpdateOpname={handleUpdateOpname}
            onPayContractTermin={handlePayContractTermin}
          />
        )}

        {activeTab === 'mitra' && (
          <MitraAndInternalServicesView
            parties={currentParties}
            workOrders={appState.workOrders}
            equipmentAssets={appState.equipmentAssets}
            internalDepartments={appState.internalDepartments}
            projects={appState.projects}
            transactions={currentTransactions}
            wbsNodes={currentWbsNodes}
            costCodes={currentCostCodes}
            activeRole={activeRole}
            onAddParty={handleAddParty}
            onUpdateParty={handleUpdateParty}
            onAddWorkOrder={handleAddWorkOrder}
            onUpdateWorkOrder={handleUpdateWorkOrder}
            onAddEquipmentAsset={handleAddEquipmentAsset}
            onUpdateEquipmentAsset={handleUpdateEquipmentAsset}
          />
        )}

        {activeTab === 'wbs_cost' && (
          <COAAndCostCodes
            coaList={INITIAL_COA}
            costCodes={currentCostCodes.length > 0 ? currentCostCodes : []}
            wbsNodes={currentWbsNodes.length > 0 ? currentWbsNodes : []}
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalCenter
            transactions={currentTransactions}
            approvalRules={INITIAL_APPROVAL_RULES}
            activeRole={activeRole}
            onApproveTransaction={handleApproveTransaction}
            onRejectTransaction={handleRejectTransaction}
          />
        )}

        {activeTab === 'accounting_bank' && (
          <AccountingAndBankView
            transactions={currentTransactions}
            bankAccounts={currentBankAccounts}
            coaList={INITIAL_COA}
            agingItems={currentAgingItems}
          />
        )}

        {activeTab === 'control_checks' && (
          <ControlChecksView
            controlChecks={INITIAL_CONTROL_CHECKS}
            auditLogs={currentAuditLogs}
            onReclassifyLegacy50M={() => {
              handleResolveException('TRX-2026-0003', 'BLD-002', 'MATERIAL', 'Reklasifikasi resmi via Diagnostic C-001');
            }}
            onVerifyPaDidiContract={() => {
              showToast('Kontrak & KTP Pa Didi terverifikasi.');
            }}
            onReconcileBankBCA={() => {
              const bca = appState.bankAccounts.find(b => b.id === 'BNK-02');
              if (bca) handlePostBankReconciliation(bca.id, bca.statementBalance, 'Verifikasi saldo terhadap rekening koran tersimpan');
            }}
          />
        )}
      </main>

      {/* Operator Modal */}
      <OperatorInputModal
        isOpen={isOperatorModalOpen}
        onClose={() => setIsOperatorModalOpen(false)}
        project={activeProject}
        parties={currentParties}
        costCodes={currentCostCodes}
        bankAccounts={currentBankAccounts}
        onSaveTransaction={handleSaveTransaction}
      />

      {/* Transaction Details Modal */}
      <TransactionDetailModal
        transaction={inspectingTx}
        onClose={() => setInspectingTx(null)}
        activeRole={activeRole}
        onApprove={handleApproveTransaction}
      />

      {/* Project Switch Modal */}
      <ProjectSwitchModal
        isOpen={isProjectSwitchModalOpen}
        onClose={() => setIsProjectSwitchModalOpen(false)}
        projects={appState.projects}
        activeProjectId={appState.activeProjectId}
        onSelectProject={handleSelectProject}
        onAddNewProject={() => setIsSetupWizardOpen(true)}
        onLoadDemoProject={handleLoadDemoProject}
      />

      {/* Project Setup Wizard Modal */}
      <ProjectSetupWizard
        isOpen={isSetupWizardOpen}
        onClose={() => setIsSetupWizardOpen(false)}
        onSubmit={handleCreateProject}
      />

      {/* Migration Center Modal */}
      <MigrationCenterModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
        onSubmitMigration={handleCreateProject}
      />

      {/* Backup & Restore Modal */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        appState={appState}
        onRestoreState={(restored) => {
          setAppState(restored);
          saveAppState(restored);
          showToast('✓ Pemulihan data cadangan berhasil dilakukan.');
        }}
        onClearProductionData={handleClearProductionData}
      />

      {/* Integration Center Modal */}
      <IntegrationCenterModal
        isOpen={isIntegrationModalOpen}
        onClose={() => setIsIntegrationModalOpen(false)}
        config={appState.integrationConfig}
        recentTransaction={currentTransactions[0]}
        senderRole={activeRole}
      />

      {/* Initial / Additional Capital Modal */}
      <InitialCapitalModal
        isOpen={isCapitalModalOpen}
        onClose={() => setIsCapitalModalOpen(false)}
        projectId={activeProject.id}
        bankAccounts={currentBankAccounts}
        onSubmitCapital={handleAddInitialCapital}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-medium text-slate-300">
            Sistem Akuntansi &amp; Kontrol Proyek Developer • {activeProject.name} ({activeProject.code})
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Standar SAK Entitas Privat &amp; PSAK 72 • Persistensi Nyata Browser • Audit Trail Integrity
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
