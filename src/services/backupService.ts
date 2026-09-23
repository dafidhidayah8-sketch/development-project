import { AppBackupPayload } from '../types';
import { AppState } from './storageService';

export const BACKUP_SCHEMA_VERSION = '2.0.0';

export function createBackupPayload(state: AppState): AppBackupPayload {
  return {
    backupVersion: BACKUP_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    appId: 'developer-project-control',
    activeProjectId: state.activeProjectId,
    projects: state.projects,
    bankAccounts: state.bankAccounts,
    capitalEntries: state.capitalEntries,
    transactions: state.transactions,
    parties: state.parties,
    agingItems: state.agingItems,
    customerARRecords: state.customerARRecords,
    poContracts: state.poContracts,
    alerts: state.alerts,
    auditLogs: state.auditLogs,
    wbsNodes: state.wbsNodes,
    costCodes: state.costCodes,
    workOrders: state.workOrders,
    equipmentAssets: state.equipmentAssets,
    internalDepartments: state.internalDepartments,
    syncQueue: state.syncQueue,
    integrationConfig: state.integrationConfig,
  };
}

export function downloadBackupFile(payload: AppBackupPayload, fileNamePrefix = 'backup_project_control'): void {
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${fileNamePrefix}_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface BackupValidationResult {
  isValid: boolean;
  errorMessage?: string;
  payload?: AppBackupPayload;
  summary?: {
    projectsCount: number;
    transactionsCount: number;
    bankAccountsCount: number;
    capitalEntriesCount: number;
    auditLogsCount: number;
    backupDate: string;
    version: string;
  };
}

export function validateBackupJSON(rawText: string): BackupValidationResult {
  try {
    const data = JSON.parse(rawText);
    if (!data || typeof data !== 'object') {
      return { isValid: false, errorMessage: 'File bukan format JSON yang valid.' };
    }
    if (!Array.isArray(data.projects)) {
      return { isValid: false, errorMessage: 'Format backup tidak valid: array projects tidak ditemukan.' };
    }
    if (!Array.isArray(data.transactions)) {
      return { isValid: false, errorMessage: 'Format backup tidak valid: array transactions tidak ditemukan.' };
    }

    return {
      isValid: true,
      payload: data as AppBackupPayload,
      summary: {
        projectsCount: data.projects?.length || 0,
        transactionsCount: data.transactions?.length || 0,
        bankAccountsCount: data.bankAccounts?.length || 0,
        capitalEntriesCount: data.capitalEntries?.length || 0,
        auditLogsCount: data.auditLogs?.length || 0,
        backupDate: data.createdAt || 'Tidak diketahui',
        version: data.backupVersion || '1.0',
      },
    };
  } catch (err: any) {
    return {
      isValid: false,
      errorMessage: `Gagal membaca file JSON: ${err?.message || 'Syntax Error'}`,
    };
  }
}
