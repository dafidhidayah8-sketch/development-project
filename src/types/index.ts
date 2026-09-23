export type TransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'COMMITMENT' | 'RECEIVING';

export type TransactionCategory = 
  | 'MATERIAL'
  | 'KONTRAKTOR_MANDOR'
  | 'ALAT_BERAT'
  | 'INFRASTRUKTUR'
  | 'LEGAL_PERIZINAN'
  | 'TANAH'
  | 'FASUM'
  | 'MARKETING'
  | 'OPERASIONAL'
  | 'PENJUALAN_UNIT'
  | 'PENDANAAN'
  | 'UNCLASSIFIED';

export type TransactionStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'APPROVED'
  | 'POSTED'
  | 'PAID'
  | 'RECONCILED'
  | 'REJECTED'
  | 'CLOSED';

export type PaymentMethod = 
  | 'TRANSFER_BCA'
  | 'TRANSFER_MANDIRI'
  | 'TRANSFER_BRI'
  | 'KAS_PROYEK'
  | 'PETTY_CASH'
  | 'GIRO_CEK'
  | 'BELUM_DIBAYAR_HUTANG';

export type UserRole = 
  | 'OPERATOR'
  | 'SITE_QS'
  | 'PROCUREMENT'
  | 'FINANCE'
  | 'ACCOUNTING'
  | 'PROJECT_MANAGER'
  | 'DIREKSI'
  | 'ADMIN';

// --- COA (Chart of Accounts) ---
export interface ChartOfAccount {
  code: string; // e.g. "1110", "2100", "5100"
  name: string;
  category: 'ASET' | 'LIABILITAS' | 'EKUITAS' | 'PENDAPATAN' | 'BIAYA';
  subCategory: string;
  normalBalance: 'DEBIT' | 'KREDIT';
  currentBalance: number;
  description?: string;
  isHeader?: boolean;
}

// --- WBS & Cost Code ---
export interface WBSNode {
  code: string; // e.g. "01", "04.01", "05.02"
  name: string;
  level: number;
  parentCode?: string;
  budgetTotal: number;
  actualCost: number;
}

export interface CostCode {
  code: string; // e.g. "BLD-001", "INF-001"
  name: string;
  wbsCode: string;
  coaExpenseCode: string; // mapping to standard COA (5xxx)
  unitOfMeasure: string;
  description: string;
  budgetAllocated: number;
  committedAmount: number;
  actualAmount: number;
  forecastToComplete: number;
}

// --- Master Project & Unit ---
export interface ProjectBlock {
  id: string;
  code: string; // e.g. "A", "B", "C"
  name: string;
  totalUnits: number;
  description: string;
}

export interface ProjectUnit {
  id: string;
  projectId?: string;
  block: string;
  unitNo: string; // e.g. "A01"
  type: string; // e.g. "Type 36/60"
  landArea: number; // m2
  buildingArea: number; // m2
  sellingPrice: number;
  status: 'AVAILABLE' | 'BOOKED' | 'SOLD' | 'CONSTRUCTION' | 'READY' | 'HANDED_OVER';
  customerName?: string;
  contractValue?: number;
  paidAmount?: number;
  outstandingAR?: number;
  progressPercent: number; // 0 - 100
  ppjbDate?: string;
  bastDate?: string;
  sp3kBank?: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  developerCompany?: string;
  address?: string;
  location: string;
  totalLandArea: number; // m2
  targetUnits: number;
  isDemo?: boolean;
  blocks: ProjectBlock[];
  startDate: string;
  targetEndDate: string;
  budgetRAB: number;
  committedCost: number;
  actualCost: number;
  forecastEAC: number; // Estimate at Completion
  plannedProgress: number; // %
  actualProgress: number; // %
  units: ProjectUnit[];
}

// --- Initial Capital & Equity Entry ---
export interface InitialCapitalEntry {
  id: string;
  projectId: string;
  date: string;
  sourceName: string; // e.g. "Bpk. Hendra (Owner)"
  sourceType: 'MODAL_PEMILIK' | 'INVESTOR' | 'PINJAMAN' | 'DANA_INTERNAL' | 'LAINNYA';
  amount: number;
  destinationAccountId: string;
  referenceNo?: string;
  notes?: string;
  proofFileName?: string;
  createdAt: string;
}

// --- Project Migration Center Model ---
export interface ProjectMigrationData {
  projectId: string;
  cutoffDate: string;
  openingCash: number;
  openingBank: number;
  openingAP: number;
  openingAR: number;
  openingWIPCost: number;
  openingCommitment: number;
  openingBudget: number;
  soldUnitsCount: number;
  availableUnitsCount: number;
  openingCapital: number;
  reconciliationNotes?: string;
  status: 'UNVERIFIED' | 'VERIFIED' | 'POSTED';
}

// --- Real Sync Outbox Item ---
export interface SyncOutboxItem {
  id: string;
  entity: 'TRANSACTION' | 'PROJECT' | 'ACCOUNT' | 'BUDGET' | 'COMMITMENT' | 'CAPITAL' | 'AUDIT' | 'PARTY' | 'WORK_ORDER' | 'EQUIPMENT' | 'INTERNAL_DEPARTMENT' | 'CUSTOMER_AR' | 'PO_CONTRACT';
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE' | 'RECONCILE';
  payload: any;
  timestamp: string;
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  retryCount: number;
  lastError?: string;
}

// --- Integration Adapter Configuration ---
export interface IntegrationConfig {
  google: {
    status: 'NOT_CONFIGURED' | 'CONFIGURED' | 'CONNECTED' | 'ERROR';
    firebaseProject?: string;
    lastSync?: string;
  };
  github: {
    status: 'NOT_CONFIGURED' | 'CONFIGURED' | 'CONNECTED' | 'ERROR';
    repo?: string;
    lastCommit?: string;
  };
  cloudflare: {
    status: 'NOT_CONFIGURED' | 'CONFIGURED' | 'CONNECTED' | 'ERROR';
    pagesUrl?: string;
    workerStatus?: string;
  };
  whatsapp: {
    manualModeAvailable: boolean; // always available
    apiStatus: 'NOT_CONFIGURED' | 'CONFIGURED' | 'CONNECTED' | 'ERROR';
    phoneNumberId?: string;
  };
}

// --- Full Application Backup Payload ---
export interface AppBackupPayload {
  backupVersion: string;
  createdAt: string;
  appId: string;
  activeProjectId: string | null;
  projects: Project[];
  bankAccounts: BankAccount[];
  capitalEntries: InitialCapitalEntry[];
  transactions: Transaction[];
  parties: Party[];
  agingItems: AgingItem[];
  customerARRecords: CustomerARRecord[];
  poContracts: POContractTracking[];
  alerts: NotificationAlert[];
  auditLogs: AuditLog[];
  wbsNodes: WBSNode[];
  costCodes: CostCode[];
  workOrders?: WorkOrder[];
  equipmentAssets?: EquipmentAsset[];
  internalDepartments?: InternalDepartment[];
  syncQueue: SyncOutboxItem[];
  integrationConfig: IntegrationConfig;
}

// --- Aging AP & AR Models ---
export interface AgingItem {
  id: string;
  projectId?: string;
  entityName: string; // Customer Name or Vendor Name
  referenceNo: string; // Unit No or Invoice/SPK No
  type: 'AR' | 'AP';
  category: string; // e.g. "Cicilan DP", "Material Semen", "Upah Mandor"
  invoiceDate: string;
  dueDate: string;
  daysPastDue: number; // <= 0 means current/not yet due
  totalAmount: number;
  paidAmount: number;
  outstandingBalance: number;
  agingBucket: 'CURRENT' | 'DAYS_1_30' | 'DAYS_31_60' | 'DAYS_61_90' | 'OVER_90';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'UNPAID' | 'PARTIAL' | 'DISPUTED' | 'VERIFIED';
}

export interface AgingSummary {
  current: number;
  days1to30: number;
  days31to60: number;
  days61to90: number;
  over90: number;
  total: number;
}

// --- Customer AR & PSAK 72 Revenue Recognition Models ---
export interface PaymentScheduleItem {
  id: string;
  terminNo: number;
  title: string; // e.g. "Booking Fee", "DP Termin 1", "Pelunasan Akad KPR"
  dueDate: string;
  amount: number;
  status: 'PAID' | 'DUE' | 'OVERDUE';
  paidDate?: string;
  paidAmount?: number;
  receiptTxId?: string;
}

export interface CustomerARRecord {
  id: string;
  projectId?: string;
  unitId: string;
  block: string;
  unitNo: string;
  unitType: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  contractNo: string; // No PPJB
  contractDate: string;
  sellingPrice: number; // Transaksi Kontrak Bersih
  paymentScheme: 'KPR' | 'CASH_BERTAHAP' | 'HARD_CASH';
  partnerBank?: string;
  bookingFeeAmount: number;
  dpTotalAmount: number;
  kprOutstandingOrRemaining: number;
  totalPaid: number;
  totalOutstandingAR: number;
  schedules: PaymentScheduleItem[];
  
  // PSAK 72 Attributes
  psak72: {
    step1ContractIdentified: boolean;
    step2PerformanceObligation: string; // "Penyerahan rumah fisik 100% siap huni beserta sertifikat split"
    step3TransactionPrice: number;
    step4Allocation: string; // "100% Bangunan & Kavling Tanah Unit"
    step5RecognitionTiming: 'POINT_IN_TIME_BAST' | 'OVER_TIME';
    contractLiabilityBalance: number; // Akun 2420: Kas diterima sebelum BAST (Uang Muka)
    recognizedRevenue: number; // Akun 4110: Pendapatan yang sah diakui
    cogsWIPTransfer: number; // Akun 5100 HPP / Akun 1320 KDPP
    handoverStatus: 'NOT_READY' | 'READY_FOR_BAST' | 'BAST_COMPLETED';
    bastDate?: string;
    bastNo?: string;
    notes?: string;
  };
}

// --- PO & Kontrak Kontraktor/Supplier Tracking ---
export interface POContractTracking {
  id: string;
  projectId?: string;
  contractNo: string; // e.g. "SPK-2026-004"
  poNumber?: string;
  title: string; // e.g. "Pekerjaan Struktur Beton Blok A"
  vendorPartyId: string;
  vendorName: string;
  vendorRole: PartyRole;
  wbsCode: string;
  costCode: string;
  costCodeName: string;
  startDate: string;
  targetEndDate: string;
  
  // Financial tracking pillars
  budgetRABItem: number; // Alokasi Anggaran
  totalContractBudget: number; // Nilai SPK/PO (Committed)
  verifiedOpnamePercent: number; // % Opname Fisik diverifikasi
  verifiedOpnameAmount: number; // Nilai Pekerjaan Selesai
  invoicedAmount: number; // Tagihan Masuk (Invoice)
  paidAmount: number; // Sudah Dibayar (Actual Paid)
  retentionPercent: number; // e.g. 5%
  retentionAmount: number; // Rp ditahan garansi
  outstandingCommitment: number; // Sisa Komitmen (totalContractBudget - paidAmount)
  outstandingPayable: number; // Hutang jatuh tempo (invoicedAmount - paidAmount)
  
  status: 'ACTIVE' | 'PENDING_OPNAME' | 'INVOICED' | 'COMPLETED' | 'DISPUTED';
  notes?: string;
}

// --- Alert Notification Entity ---
export type NotificationType = 
  | 'PENDING_APPROVAL' 
  | 'AP_OVERDUE' 
  | 'AR_OVERDUE' 
  | 'CONTROL_WARNING' 
  | 'BAST_READY'
  | 'RECONCILIATION_FLAG'
  | 'BUDGET_OVERRUN'
  | 'OPNAME_VERIFICATION';

export type NotificationSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type NotificationAuditStatus = 'PENDING' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';

export interface NotificationAlert {
  id: string;
  timestamp: string; // e.g. "2026-09-23 09:30" or "Baru saja"
  date?: string; // e.g. "2026-09-23"
  type: NotificationType;
  title: string;
  message: string;
  txId?: string;
  transactionId?: string;
  poContractId?: string;
  unitId?: string;
  amount?: number;
  priority: NotificationSeverity; // Backwards compatible with existing code
  severity?: NotificationSeverity; // Explicit severity field
  read: boolean;
  targetRoles: UserRole[];
  category?: string;
  auditStatus?: NotificationAuditStatus;
  responseNote?: string;
  respondedBy?: string;
  respondedAt?: string;
}

// --- Entity Type & Relationship Models ---
export type EntityType = 'INTERNAL_DEPARTMENT' | 'EXTERNAL_ENTITY' | 'INDIVIDUAL';

export type RelationshipType = 
  | 'INTERNAL_DEPARTMENT'
  | 'EXTERNAL_VENDOR'
  | 'CONTRACTOR'
  | 'SUBCONTRACTOR'
  | 'PARTNER'
  | 'RELATED_PARTY'
  | 'INVESTOR'
  | 'LENDER'
  | 'CUSTOMER'
  | 'EMPLOYEE'
  | 'MANDOR';

export interface RelatedPartyInfo {
  isRelatedParty: boolean;
  relationshipDescription?: string; // e.g. "Pemilik saham 35% di PT Developer", "Keluarga Direktur Utama"
  controlType?: 'COMMON_CONTROL' | 'SIGNIFICANT_INFLUENCE' | 'KEY_MANAGEMENT' | 'SUBSIDIARY' | 'OTHER';
  reportingNotes?: string;
}

// PSAK 216 / IAS 16 / IAS 2 / PSAK 202 Accounting Classification
export type OutputClassification = 'PROJECT_COST' | 'INVENTORY' | 'FIXED_ASSET' | 'SERVICE';

// --- Cost Allocation Engine Model ---
export interface CostAllocationItem {
  id: string;
  projectId: string;
  projectName: string;
  block?: string;
  unitId?: string;
  wbsCode: string;
  costCode: string;
  costCodeName?: string;
  costCenter?: string; // e.g. "Workshop", "Project Permata Hijau", "Overhead Kantor"
  percentage: number; // 0 - 100
  amount: number; // Calculated Rp
  notes?: string;
}

// --- Internal Department Entity ---
export interface InternalDepartment {
  id: string;
  code: string;
  name: string;
  costCenterCode: string;
  headOfDepartment: string;
  serviceScope: string[];
  monthlyBudget: number;
  totalAllocatedCost: number;
}

// --- Equipment & Asset Register (PSAK 216 / IAS 16) ---
export interface EquipmentAsset {
  id: string; // e.g. "EQP-LIFT-001"
  code: string;
  name: string;
  category: 'LIFTING' | 'ALAT_BERAT' | 'WORKSHOP_MACHINE' | 'KENDARAAN_PROYEK' | 'TOOLS';
  ownership: 'MILIK_PT' | 'SEWA_EKSTERNAL' | 'MITRA_KONSORSIUM';
  custodianDepartment: string;
  currentProjectId?: string;
  currentProjectName?: string;
  currentLocation: string;
  acquisitionDate: string;
  acquisitionCost: number;
  usefulLifeYears: number;
  depreciationMethod: 'GARIS_LURUS' | 'JAM_KERJA';
  accumulatedDepreciation: number;
  netBookValue: number;
  hourlyRate?: number;
  totalHoursLogged?: number;
  status: 'OPERASIONAL' | 'MAINTENANCE' | 'IDLE' | 'RUSAK';
  lastServiceDate?: string;
  nextServiceDate?: string;
}

// --- Workshop & Fabrication Work Order Entity ---
export interface WorkOrder {
  id: string; // e.g. "WO-2026-00025"
  woNumber: string;
  title: string;
  workCategory: 'FABRIKASI' | 'MAINTENANCE' | 'WELDING' | 'MACHINING' | 'VEHICLE_REPAIR' | 'LIFTING_EQUIPMENT' | 'TOOLS';
  internalDepartmentId?: string;
  partyId?: string;
  partyName: string;
  startDate: string;
  targetEndDate: string;
  completionDate?: string;
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'INSPECTED' | 'CANCELLED';
  
  // Cost Breakdown (Material + Labor + Machine + Consumables + Overhead)
  materialCost: number;
  laborCost: number;
  machineCost: number;
  consumablesCost: number;
  overheadCost: number;
  totalCost: number;
  
  // Output & Accounting Destination (PSAK 216 / IAS 16 / IAS 2)
  outputAssetCode?: string;
  outputName: string;
  outputClassification: OutputClassification;
  destinationProjectId?: string;
  destinationProjectName?: string;
  destinationLocation?: string;
  
  allocations?: CostAllocationItem[];
  notes?: string;
  inspectedBy?: string;
  inspectionDate?: string;
}

// --- Master Party ---
export type PartyRole = 
  | 'SUPPLIER'
  | 'KONTRAKTOR'
  | 'MANDOR'
  | 'SUBKON'
  | 'KONSUMEN'
  | 'INVESTOR'
  | 'BANK'
  | 'NOTARIS'
  | 'PEMERINTAH'
  | 'DEVELOPER'
  | 'UNVERIFIED';

export interface Party {
  id: string;
  code: string;
  name: string;
  legalName?: string;
  entityType: EntityType;
  relationshipType: RelationshipType;
  roles?: PartyRole[];
  role?: PartyRole; // Backwards compatibility
  services?: string[]; // e.g. ['Teknikal', 'Lifting', 'Workshop', 'Fabrikasi', 'Maintenance']
  relatedPartyInfo?: RelatedPartyInfo;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  npwp?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountHolder?: string;
  isVerified: boolean;
  totalTransactions: number;
  totalOutstanding: number; // AP or AR
  notes?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'UNDER_REVIEW';
}

// --- Approval Step & Record ---
export interface ApprovalStepRecord {
  stepNo: number;
  roleRequired: UserRole;
  approverName?: string;
  approverRole?: UserRole;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  actionDate?: string;
  notes?: string;
}

export interface ApprovalMatrixRule {
  id: string;
  transactionType: TransactionType | 'CONTRACT' | 'BUDGET_CHANGE';
  minAmount: number;
  maxAmount: number;
  requiredRoles: UserRole[];
  description: string;
}

// --- Primary Transaction Entity ---
export interface JournalLine {
  accountCode: string;
  debit: number;
  credit: number;
}

export interface Transaction {
  id: string; // e.g. "TRX-2026-00012"
  idempotencyKey?: string;
  date: string;
  projectId: string;
  projectName: string;
  
  // What Happened (Operator simplicity)
  type: TransactionType;
  category: TransactionCategory;
  subcategory: string;
  description: string; // Uraian transaksi
  
  // Project Spatial & Breakdown
  block?: string;
  unitId?: string; // Unit code or "A01-A05" or "PROJECT-GENERAL"
  wbsCode: string;
  costCode: string;
  costCodeName?: string;
  
  // Pihak
  partyId: string;
  partyName: string;
  partyRole: PartyRole;
  
  // Volume & Financials
  quantity?: number;
  unitOfMeasure?: string;
  unitPrice?: number;
  subtotal: number;
  taxAmount?: number;
  totalAmount: number;
  
  // Payment & Bank
  paymentMethod: PaymentMethod;
  bankAccountId?: string; // Actual account affected by cash movement
  bankAccountName?: string;
  isPaid: boolean;
  paidDate?: string;
  paidAmount: number;
  outstandingAmount: number;
  
  // Documents & References
  invoiceNo?: string;
  poNumber?: string;
  receiptProofNo?: string;
  proofFileUrl?: string;
  proofFileName?: string;
  
  // Dual Identity: Accounting mapping
  debitAccountCode: string;
  creditAccountCode: string;
  journalLines?: JournalLine[];
  journalPosted: boolean;
  
  // Audit & Governance
  operatorName: string;
  createdBy: string;
  createdAt: string;
  status: TransactionStatus;
  
  // Approval
  approvalSteps: ApprovalStepRecord[];
  currentApprovalLevel: number;
  needsReviewReason?: string; // e.g. "PA DIDI peranan belum diverifikasi"
  
  // Cost Allocation Engine (Multi-Project, Multi-WBS, Multi-Unit)
  allocations?: CostAllocationItem[];
  allocationStatus?: 'VALID' | 'ALLOCATION_ERROR' | 'SINGLE_TARGET';
  allocationDifference?: number;
  
  // Output & Accounting Classification (PSAK 216 / IAS 16 / IAS 2)
  outputClassification?: OutputClassification;
  serviceCenter?: string; // e.g. "Workshop / Bengkel", "Divisi Teknikal", "Lifting Service"
  relatedPartyFlag?: boolean;
  relatedPartyNotes?: string;
  workOrderId?: string;
  fundingType?: 'CAPITAL' | 'LOAN' | 'ADVANCE' | 'INVESTMENT' | 'OTHER';
}

// --- Bank Account Entity ---
export interface BankAccount {
  id: string;
  name: string; // e.g. "Bank BCA Proyek"
  accountNumber: string;
  bankName: string;
  currentBalance: number;
  statementBalance: number;
  lastReconciledDate: string;
  unreconciledDifference: number;
  reconciliationStatus?: 'OPEN' | 'RECONCILED';
}

// --- Audit Log Entity ---
export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  action: 'CREATE' | 'UPDATE' | 'APPROVE' | 'REJECT' | 'POST' | 'PAY' | 'RECONCILE' | 'CORRECTION';
  recordId: string;
  description: string;
  previousValue?: string;
  newValue?: string;
}

// --- Control Check Item ---
export interface ControlCheckItem {
  code: string; // e.g. "C-001"
  name: string;
  status: 'PASS' | 'WARNING' | 'CRITICAL_BLOCK';
  count: number;
  impactAmount: number;
  description: string;
  actionRequired: string;
}
