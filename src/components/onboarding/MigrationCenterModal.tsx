import React, { useState } from 'react';
import { Layers, X, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { Project, BankAccount, InitialCapitalEntry } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface MigrationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitMigration: (
    project: Project,
    capital: InitialCapitalEntry,
    accounts: BankAccount[]
  ) => void;
}

export const MigrationCenterModal: React.FC<MigrationCenterModalProps> = ({
  isOpen,
  onClose,
  onSubmitMigration,
}) => {
  const [projectName, setProjectName] = useState<string>('');
  const [projectCode, setProjectCode] = useState<string>('PRJ-MIG-01');
  const [developerCompany, setDeveloperCompany] = useState<string>('');
  const [cutoffDate, setCutoffDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Cutoff Financials
  const [openingCash, setOpeningCash] = useState<number>(15000000);
  const [openingBank, setOpeningBank] = useState<number>(200000000);
  const [openingAP, setOpeningAP] = useState<number>(50000000);
  const [openingAR, setOpeningAR] = useState<number>(120000000);
  const [openingWIPCost, setOpeningWIPCost] = useState<number>(450000000);
  const [openingCommitment, setOpeningCommitment] = useState<number>(800000000);
  const [openingBudget, setOpeningBudget] = useState<number>(3500000000);
  const [openingCapital, setOpeningCapital] = useState<number>(1000000000);
  const [targetUnits, setTargetUnits] = useState<number>(40);
  const [soldUnits, setSoldUnits] = useState<number>(10);
  const [notes, setNotes] = useState<string>('Data saldo berjalan per tanggal cutoff migrasi');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!projectName.trim()) {
      setErrorMsg('Nama project wajib diisi.');
      return;
    }
    if (!projectCode.trim()) {
      setErrorMsg('Kode project wajib diisi.');
      return;
    }

    const projectId = projectCode.toUpperCase();

    const bankAcc: BankAccount = {
      id: `BNK-MIG-01`,
      name: 'Bank Operasional Proyek (Migrasi)',
      bankName: 'Bank Utama',
      accountNumber: 'REK-MIGRASI-01',
      currentBalance: Number(openingBank) || 0,
      statementBalance: Number(openingBank) || 0,
      lastReconciledDate: cutoffDate,
      unreconciledDifference: 0,
    };

    const cashAcc: BankAccount = {
      id: `CSH-MIG-01`,
      name: 'Kas Fisik Proyek (Migrasi)',
      bankName: 'Kas Tunai',
      accountNumber: 'KAS-PROYEK',
      currentBalance: Number(openingCash) || 0,
      statementBalance: Number(openingCash) || 0,
      lastReconciledDate: cutoffDate,
      unreconciledDifference: 0,
    };

    const capitalEntry: InitialCapitalEntry = {
      id: `CAP-MIG-${Date.now().toString().slice(-4)}`,
      projectId,
      date: cutoffDate,
      sourceName: 'Modal Kumulatif Disetor (Migrasi)',
      sourceType: 'MODAL_PEMILIK',
      amount: Number(openingCapital) || 0,
      destinationAccountId: bankAcc.id,
      notes,
      createdAt: new Date().toISOString(),
    };

    const migratedProject: Project = {
      id: projectId,
      code: projectCode.toUpperCase(),
      name: projectName,
      developerCompany,
      location: 'Lokasi Proyek',
      totalLandArea: 10000,
      targetUnits: Number(targetUnits) || 0,
      isDemo: false,
      blocks: [
        { id: 'BLK-A', code: 'A', name: 'Blok Utama', totalUnits: Number(targetUnits) || 0, description: 'Blok Eksisting' }
      ],
      startDate: cutoffDate,
      targetEndDate: '2028-12-31',
      budgetRAB: Number(openingBudget) || 0,
      committedCost: Number(openingCommitment) || 0,
      actualCost: Number(openingWIPCost) || 0,
      forecastEAC: Number(openingBudget) || 0,
      plannedProgress: 50,
      actualProgress: 45,
      units: [],
    };

    onSubmitMigration(migratedProject, capitalEntry, [bankAcc, cashAcc]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">MIGRASI DATA PROJECT BERJALAN</h2>
              <p className="text-xs text-slate-400">Input saldo pembukuan awal / cutoff date</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nama Project *</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Contoh: Green Valley Residence"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Kode Project *</label>
              <input
                type="text"
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                placeholder="GVR-01"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white uppercase"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nama Perusahaan / PT</label>
              <input
                type="text"
                value={developerCompany}
                onChange={(e) => setDeveloperCompany(e.target.value)}
                placeholder="PT Developer Abadi"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tanggal Cutoff Saldo Awal *</label>
              <input
                type="date"
                value={cutoffDate}
                onChange={(e) => setCutoffDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="font-bold text-slate-200 mb-2">Posisi Keuangan Cutoff</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Saldo Bank Awal (Rp)</label>
                <input
                  type="number"
                  value={openingBank}
                  onChange={(e) => setOpeningBank(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Saldo Kas Lapangan (Rp)</label>
                <input
                  type="number"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Hutang Usaha (AP) Berjalan (Rp)</label>
                <input
                  type="number"
                  value={openingAP}
                  onChange={(e) => setOpeningAP(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-rose-400 font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Piutang Konsumen (AR) Berjalan (Rp)</label>
                <input
                  type="number"
                  value={openingAR}
                  onChange={(e) => setOpeningAR(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-indigo-400 font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Akumulasi Biaya Konstruksi/WIP (Rp)</label>
                <input
                  type="number"
                  value={openingWIPCost}
                  onChange={(e) => setOpeningWIPCost(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Modal Disetor Terakumulasi (Rp)</label>
                <input
                  type="number"
                  value={openingCapital}
                  onChange={(e) => setOpeningCapital(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-amber-400 font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Simpan &amp; Migrasikan Proyek</span>
          </button>
        </div>

      </div>
    </div>
  );
};
