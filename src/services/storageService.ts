import { 
  Project, 
  BankAccount, 
  Transaction, 
  Party, 
  AgingItem, 
  CustomerARRecord, 
  POContractTracking, 
  NotificationAlert, 
  AuditLog, 
  WBSNode, 
  CostCode, 
  InitialCapitalEntry,
  SyncOutboxItem,
  IntegrationConfig,
  AppBackupPayload,
  InternalDepartment,
  EquipmentAsset,
  WorkOrder
} from '../types';
import { 
  INITIAL_PROJECT, 
  INITIAL_BANK_ACCOUNTS, 
  INITIAL_TRANSACTIONS, 
  INITIAL_PARTIES, 
  INITIAL_AGING_ITEMS, 
  INITIAL_CUSTOMER_AR_RECORDS, 
  INITIAL_PO_CONTRACTS, 
  INITIAL_ALERTS, 
  INITIAL_AUDIT_LOGS, 
  INITIAL_WBS, 
  INITIAL_COST_CODES,
  INITIAL_INTERNAL_DEPARTMENTS,
  INITIAL_EQUIPMENT_ASSETS,
  INITIAL_WORK_ORDERS
} from '../data/initialData';

export const APP_STORAGE_KEY = 'DEV_PROJECT_CONTROL_APP_STATE_V2';

export interface AppState {
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
  workOrders: WorkOrder[];
  equipmentAssets: EquipmentAsset[];
  internalDepartments: InternalDepartment[];
  syncQueue: SyncOutboxItem[];
  integrationConfig: IntegrationConfig;
}

export const DEFAULT_INTEGRATION_CONFIG: IntegrationConfig = {
  google: {
    status: 'NOT_CONFIGURED',
  },
  github: {
    status: 'NOT_CONFIGURED',
  },
  cloudflare: {
    status: 'NOT_CONFIGURED',
  },
  whatsapp: {
    manualModeAvailable: true,
    apiStatus: 'NOT_CONFIGURED',
  },
};

/**
 * Loads application state from localStorage.
 * Returns null if this is a fresh first run (no projects saved).
 */
export function loadAppState(): AppState | null {
  try {
    const raw = localStorage.getItem(APP_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.projects)) {
      return null;
    }
    return {
      activeProjectId: parsed.activeProjectId || (parsed.projects.length > 0 ? parsed.projects[0].id : null),
      projects: parsed.projects || [],
      bankAccounts: parsed.bankAccounts || [],
      capitalEntries: parsed.capitalEntries || [],
      transactions: parsed.transactions || [],
      parties: parsed.parties || [],
      agingItems: parsed.agingItems || [],
      customerARRecords: parsed.customerARRecords || [],
      poContracts: parsed.poContracts || [],
      alerts: parsed.alerts || [],
      auditLogs: parsed.auditLogs || [],
      wbsNodes: parsed.wbsNodes || [],
      costCodes: parsed.costCodes || [],
      workOrders: Array.isArray(parsed.workOrders) ? parsed.workOrders : [],
      equipmentAssets: Array.isArray(parsed.equipmentAssets) ? parsed.equipmentAssets : [],
      internalDepartments: Array.isArray(parsed.internalDepartments) ? parsed.internalDepartments : [],
      syncQueue: parsed.syncQueue || [],
      integrationConfig: parsed.integrationConfig || DEFAULT_INTEGRATION_CONFIG,
    };
  } catch (err) {
    console.error('Error loading app state from storage:', err);
    return null;
  }
}

/**
 * Saves current application state to localStorage.
 */
export function saveAppState(state: AppState): boolean {
  try {
    localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (err) {
    console.error('Error saving app state to storage:', err);
    return false;
  }
}

/**
 * Resets/clears production state to completely fresh first-run state.
 */
export function clearAppState(): void {
  try {
    localStorage.removeItem(APP_STORAGE_KEY);
  } catch (err) {
    console.error('Error clearing app state:', err);
  }
}

/**
 * Generates the Demo/Simulation dataset for testing purposes.
 * Clearly marked with isDemo: true.
 */
export function getDemoAppState(): AppState {
  const demoProject: Project = {
    ...INITIAL_PROJECT,
    isDemo: true,
    developerCompany: 'PT Graha Cipta Mandiri Developer',
    address: 'Jl. Raya Cendana Indah No. 88, Sidoarjo'
  };

  const initialDemoCapitals: InitialCapitalEntry[] = [
    {
      id: 'CAP-DEMO-001',
      projectId: demoProject.id,
      date: '2026-01-10',
      sourceName: 'Ir. Hartono (Founder)',
      sourceType: 'MODAL_PEMILIK',
      amount: 4000000000,
      destinationAccountId: 'BNK-02',
      referenceNo: 'MODAL-AWAL-01',
      notes: 'Penyetoran modal awal disetor pendirian proyek Graha Asri',
      createdAt: '2026-01-10T08:00:00Z'
    },
    {
      id: 'CAP-DEMO-002',
      projectId: demoProject.id,
      date: '2026-01-12',
      sourceName: 'PT Mitra Properti Investama',
      sourceType: 'INVESTOR',
      amount: 2500000000,
      destinationAccountId: 'BNK-03',
      referenceNo: 'INVEST-MITRA-01',
      notes: 'Penyertaan dana bagi hasil investor mitra tahap 1',
      createdAt: '2026-01-12T09:30:00Z'
    }
  ];

  return {
    activeProjectId: demoProject.id,
    projects: [demoProject],
    bankAccounts: INITIAL_BANK_ACCOUNTS,
    capitalEntries: initialDemoCapitals,
    transactions: INITIAL_TRANSACTIONS,
    parties: INITIAL_PARTIES,
    agingItems: INITIAL_AGING_ITEMS,
    customerARRecords: INITIAL_CUSTOMER_AR_RECORDS,
    poContracts: INITIAL_PO_CONTRACTS,
    alerts: INITIAL_ALERTS,
    auditLogs: INITIAL_AUDIT_LOGS,
    wbsNodes: INITIAL_WBS,
    costCodes: INITIAL_COST_CODES,
    workOrders: INITIAL_WORK_ORDERS,
    equipmentAssets: INITIAL_EQUIPMENT_ASSETS,
    internalDepartments: INITIAL_INTERNAL_DEPARTMENTS,
    syncQueue: [],
    integrationConfig: DEFAULT_INTEGRATION_CONFIG,
  };
}
