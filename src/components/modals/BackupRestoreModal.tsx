import React, { useState } from 'react';
import { 
  Download, 
  Upload, 
  Database, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  RotateCcw,
  ShieldCheck 
} from 'lucide-react';
import { AppState } from '../../services/storageService';
import { 
  createBackupPayload, 
  downloadBackupFile, 
  validateBackupJSON, 
  BackupValidationResult 
} from '../../services/backupService';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
  onRestoreState: (restoredState: AppState) => void;
  onClearProductionData: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  appState,
  onRestoreState,
  onClearProductionData,
}) => {
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [restoreSuccess, setRestoreSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  // Handle Export / Download JSON
  const handleDownloadBackup = () => {
    const payload = createBackupPayload(appState);
    const activeProject = appState.projects.find(p => p.id === appState.activeProjectId);
    const prefix = activeProject ? `backup_${activeProject.code.toLowerCase()}` : 'backup_project_control';
    downloadBackupFile(payload, prefix);
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setRestoreSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = validateBackupJSON(content);
      setValidationResult(res);
    };
    reader.readAsText(file);
  };

  // Execute Restore
  const handleExecuteRestore = () => {
    if (!validationResult || !validationResult.isValid || !validationResult.payload) return;
    
    setIsRestoring(true);
    const p = validationResult.payload;

    const restoredState: AppState = {
      activeProjectId: p.activeProjectId || (p.projects.length > 0 ? p.projects[0].id : null),
      projects: p.projects || [],
      bankAccounts: p.bankAccounts || [],
      capitalEntries: p.capitalEntries || [],
      transactions: p.transactions || [],
      parties: p.parties || [],
      agingItems: p.agingItems || [],
      customerARRecords: p.customerARRecords || [],
      poContracts: p.poContracts || [],
      alerts: p.alerts || [],
      auditLogs: p.auditLogs || [],
      wbsNodes: p.wbsNodes || [],
      costCodes: p.costCodes || [],
      workOrders: p.workOrders || appState.workOrders || [],
      equipmentAssets: p.equipmentAssets || appState.equipmentAssets || [],
      internalDepartments: p.internalDepartments || appState.internalDepartments || [],
      syncQueue: p.syncQueue || [],
      integrationConfig: p.integrationConfig || appState.integrationConfig,
    };

    setTimeout(() => {
      onRestoreState(restoredState);
      setIsRestoring(false);
      setRestoreSuccess(true);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">BACKUP &amp; RESTORE DATABASE</h2>
              <p className="text-xs text-slate-400">Pencadangan file JSON mandiri &amp; pemulihan data aplikasi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs">
          
          {/* SECTION 1: EXPORT BACKUP */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download Backup JSON</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Unduh seluruh database aplikasi (projects, transaksi, modal, rekening, audit trail).
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh File .JSON</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-700/60 text-slate-300">
              <div className="p-2 rounded-lg bg-slate-900/60 text-center">
                <div className="font-extrabold text-white text-sm">{appState.projects.length}</div>
                <div className="text-[10px] text-slate-400">Projects</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 text-center">
                <div className="font-extrabold text-white text-sm">{appState.transactions.length}</div>
                <div className="text-[10px] text-slate-400">Transaksi</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 text-center">
                <div className="font-extrabold text-white text-sm">{appState.bankAccounts.length}</div>
                <div className="text-[10px] text-slate-400">Kas &amp; Bank</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900/60 text-center">
                <div className="font-extrabold text-white text-sm">{appState.auditLogs.length}</div>
                <div className="text-[10px] text-slate-400">Audit Logs</div>
              </div>
            </div>
          </div>

          {/* SECTION 2: IMPORT / RESTORE */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-4">
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-purple-400" />
                <span>Restore Database dari File JSON</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Pilih file cadangan .json yang pernah Anda unduh untuk mengembalikan data aplikasi.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-700 rounded-2xl p-4 text-center hover:border-indigo-500/50 transition-colors">
              <input
                type="file"
                id="restore-file-input"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <label 
                htmlFor="restore-file-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-2 py-2"
              >
                <FileText className="w-8 h-8 text-slate-400" />
                <span className="font-semibold text-indigo-400 hover:text-indigo-300">
                  {selectedFileName ? selectedFileName : 'Pilih File Cadangan (.json)'}
                </span>
                <span className="text-[10px] text-slate-400">Mendukung format backup v2.0</span>
              </label>
            </div>

            {/* Validation Feedback */}
            {validationResult && (
              <div className="space-y-3">
                {validationResult.isValid && validationResult.summary ? (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>File Valid! Ringkasan Arsip:</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-200">
                      <div>Projects: <strong>{validationResult.summary.projectsCount}</strong></div>
                      <div>Transaksi: <strong>{validationResult.summary.transactionsCount}</strong></div>
                      <div>Rekening: <strong>{validationResult.summary.bankAccountsCount}</strong></div>
                      <div>Audit Log: <strong>{validationResult.summary.auditLogsCount}</strong></div>
                    </div>
                    <div className="text-[10px] text-slate-400 pt-1">
                      Waktu Pembuatan: {validationResult.summary.backupDate}
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        disabled={isRestoring}
                        onClick={handleExecuteRestore}
                        className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-600/30"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>{isRestoring ? 'Sedang Memulihkan...' : 'Lakukan Restore Sekarang'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2 text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{validationResult.errorMessage || 'Format file backup tidak valid.'}</span>
                  </div>
                )}
              </div>
            )}

            {restoreSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold text-center">
                ✓ Pemulihan Database Berhasil! Data aplikasi telah dimuat ulang.
              </div>
            )}
          </div>

          {/* SECTION 3: DANGER ZONE (CLEAR STATE) */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 flex items-center justify-between">
            <div>
              <div className="font-bold text-rose-300 text-xs">Reset / Kosongkan Database</div>
              <div className="text-[10px] text-slate-400">Kembalikan aplikasi ke tampilan awal &quot;Belum Ada Project&quot;.</div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Yakin ingin mereset seluruh database lokal? Semua data belum dibackup akan hilang.')) {
                  onClearProductionData();
                  onClose();
                }
              }}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-xs font-bold transition-colors cursor-pointer"
            >
              Reset Data
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
