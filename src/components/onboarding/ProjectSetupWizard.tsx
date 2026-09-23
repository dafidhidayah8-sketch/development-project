import React, { useState } from 'react';
import { 
  Building2, 
  Coins, 
  Wallet, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  AlertCircle,
  X
} from 'lucide-react';
import { Project, BankAccount, InitialCapitalEntry, ProjectBlock } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface ProjectSetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    project: Project,
    capital: InitialCapitalEntry,
    accounts: BankAccount[]
  ) => void;
}

export const ProjectSetupWizard: React.FC<ProjectSetupWizardProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // STEP 1: Project Profile
  const [projectName, setProjectName] = useState<string>('');
  const [projectCode, setProjectCode] = useState<string>('PRJ-001');
  const [developerCompany, setDeveloperCompany] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [totalLandArea, setTotalLandArea] = useState<number>(10000);
  const [targetUnits, setTargetUnits] = useState<number>(50);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [targetEndDate, setTargetEndDate] = useState<string>('2027-12-31');

  // STEP 2: Initial Capital / Sumber Dana
  const [capitalDate, setCapitalDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [capitalSourceName, setCapitalSourceName] = useState<string>('');
  const [capitalSourceType, setCapitalSourceType] = useState<InitialCapitalEntry['sourceType']>('MODAL_PEMILIK');
  const [capitalAmount, setCapitalAmount] = useState<number>(500000000); // Rp 500 Jt
  const [capitalRefNo, setCapitalRefNo] = useState<string>('MODAL-AWAL-01');
  const [capitalNotes, setCapitalNotes] = useState<string>('Penyetoran modal disetor awal pembangunan proyek');

  // STEP 3: Opening Cash/Bank Accounts
  const [accounts, setAccounts] = useState<Array<{
    id: string;
    name: string;
    bankName: string;
    accountNumber: string;
    holderName?: string;
    type: 'BANK' | 'KAS' | 'PETTY_CASH';
    openingBalance: number;
  }>>([
    {
      id: 'BNK-01',
      name: 'Bank BCA Operasional Proyek',
      bankName: 'BCA',
      accountNumber: '827-0912-88',
      holderName: '',
      type: 'BANK',
      openingBalance: 500000000,
    }
  ]);

  // Account creation sub-form
  const [newAccName, setNewAccName] = useState<string>('');
  const [newAccBank, setNewAccBank] = useState<string>('Mandiri');
  const [newAccNumber, setNewAccNumber] = useState<string>('');
  const [newAccBalance, setNewAccBalance] = useState<number>(0);
  const [newAccType, setNewAccType] = useState<'BANK' | 'KAS' | 'PETTY_CASH'>('BANK');

  // STEP 4: Blocks & Initial Budget Allocation
  const [budgetRAB, setBudgetRAB] = useState<number>(5000000000); // e.g. Rp 5 Miliar
  const [blocks, setBlocks] = useState<ProjectBlock[]>([
    { id: 'BLK-A', code: 'A', name: 'Blok A', totalUnits: 25, description: 'Cluster Utama' },
    { id: 'BLK-B', code: 'B', name: 'Blok B', totalUnits: 25, description: 'Cluster Sayap Timur' }
  ]);

  if (!isOpen) return null;

  // Validation per step
  const handleNext = () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      if (!projectName.trim()) {
        setErrorMsg('Nama Project wajib diisi.');
        return;
      }
      if (!projectCode.trim()) {
        setErrorMsg('Kode Project wajib diisi.');
        return;
      }
      if (!developerCompany.trim()) {
        setErrorMsg('Nama Developer / Perusahaan wajib diisi.');
        return;
      }
      if (!location.trim()) {
        setErrorMsg('Lokasi Project wajib diisi.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!capitalSourceName.trim()) {
        setErrorMsg('Sumber Dana / Nama Penyetor Modal wajib diisi.');
        return;
      }
      if (capitalAmount <= 0) {
        setErrorMsg('Nominal modal awal harus lebih besar dari 0.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (accounts.length === 0) {
        setErrorMsg('Minimal harus ada 1 rekening kas/bank penampung dana proyek.');
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    }
  };

  const handleAddAccount = () => {
    if (!newAccName.trim()) {
      setErrorMsg('Nama rekening kas/bank wajib diisi.');
      return;
    }
    const newId = `BNK-${Date.now().toString().slice(-4)}`;
    setAccounts(prev => [
      ...prev,
      {
        id: newId,
        name: newAccName,
        bankName: newAccBank,
        accountNumber: newAccNumber || '-',
        type: newAccType,
        openingBalance: Number(newAccBalance) || 0,
      }
    ]);
    setNewAccName('');
    setNewAccNumber('');
    setNewAccBalance(0);
    setErrorMsg(null);
  };

  const handleRemoveAccount = (id: string) => {
    if (accounts.length <= 1) {
      setErrorMsg('Minimal harus ada 1 rekening aktif.');
      return;
    }
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const handleFinalSubmit = () => {
    // Generate final real project object
    const projectId = projectCode.replace(/\s+/g, '-').toUpperCase() || `PRJ-${Date.now()}`;
    
    // Convert accounts to BankAccount[]
    const finalBankAccounts: BankAccount[] = accounts.map(a => ({
      id: a.id,
      name: a.name,
      accountNumber: a.accountNumber,
      bankName: a.bankName,
      currentBalance: a.openingBalance,
      statementBalance: a.openingBalance,
      lastReconciledDate: startDate,
      unreconciledDifference: 0,
    }));

    const finalProject: Project = {
      id: projectId,
      code: projectCode.toUpperCase(),
      name: projectName,
      developerCompany,
      address,
      location,
      totalLandArea: Number(totalLandArea) || 0,
      targetUnits: Number(targetUnits) || 0,
      isDemo: false,
      blocks,
      startDate,
      targetEndDate,
      budgetRAB: Number(budgetRAB) || 0,
      committedCost: 0,
      actualCost: 0,
      forecastEAC: Number(budgetRAB) || 0,
      plannedProgress: 0,
      actualProgress: 0,
      units: [],
    };

    const initialCapital: InitialCapitalEntry = {
      id: `CAP-${Date.now().toString().slice(-4)}`,
      projectId,
      date: capitalDate,
      sourceName: capitalSourceName,
      sourceType: capitalSourceType,
      amount: Number(capitalAmount) || 0,
      destinationAccountId: accounts[0]?.id || 'BNK-01',
      referenceNo: capitalRefNo,
      notes: capitalNotes,
      createdAt: new Date().toISOString(),
    };

    onSubmit(finalProject, initialCapital, finalBankAccounts);
  };

  const totalOpeningCash = accounts.reduce((acc, a) => acc + (Number(a.openingBalance) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100">
        
        {/* Wizard Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">SETUP PROJECT PERTAMA</h2>
              <p className="text-xs text-slate-400">Langkah {currentStep} dari 5: Inisialisasi Data Nyata</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Progress Indicator */}
        <div className="grid grid-cols-5 border-b border-slate-800 text-[11px] font-semibold bg-slate-950/40">
          {[
            { step: 1, title: 'Profil' },
            { step: 2, title: 'Modal Awal' },
            { step: 3, title: 'Kas & Bank' },
            { step: 4, title: 'Kavling/RAB' },
            { step: 5, title: 'Ringkasan' },
          ].map(s => (
            <div 
              key={s.step} 
              className={`py-2.5 text-center border-b-2 transition-colors ${
                currentStep === s.step 
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                  : currentStep > s.step 
                  ? 'border-emerald-500 text-emerald-400' 
                  : 'border-transparent text-slate-400'
              }`}
            >
              {s.step}. {s.title}
            </div>
          ))}
        </div>

        {/* Wizard Body (Scrollable) */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Profil Project */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 pb-1 border-b border-slate-800">
                Lengkapi identitas project developer yang akan dikelola.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nama Project *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Contoh: Perumahan Cendana Garden"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kode Project *
                  </label>
                  <input
                    type="text"
                    value={projectCode}
                    onChange={(e) => setProjectCode(e.target.value)}
                    placeholder="Contoh: PRJ-001"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nama Developer / Perusahaan PT *
                  </label>
                  <input
                    type="text"
                    value={developerCompany}
                    onChange={(e) => setDeveloperCompany(e.target.value)}
                    placeholder="Contoh: PT Cipta Graha Sejahtera"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Kota / Wilayah *
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Contoh: Sidoarjo, Jawa Timur"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Alamat Lengkap Lahan Proyek
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Contoh: Jl. Raya Desa Cendana RT 04 RW 02"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Luas Lahan (m²)
                  </label>
                  <input
                    type="number"
                    value={totalLandArea}
                    onChange={(e) => setTotalLandArea(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Total Rencana Unit Kavling
                  </label>
                  <input
                    type="number"
                    value={targetUnits}
                    onChange={(e) => setTargetUnits(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tanggal Mulai Proyek
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    value={targetEndDate}
                    onChange={(e) => setTargetEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Modal & Sumber Dana Awal */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2">
                <Coins className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Penting: Modal Awal bukan Pendapatan Penjualan.</strong>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Masukkan dana yang disetor pemilik atau investor untuk membiayai operasional, tanah, atau konstruksi awal.
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tanggal Penyetoran Modal *
                  </label>
                  <input
                    type="date"
                    value={capitalDate}
                    onChange={(e) => setCapitalDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Jenis Sumber Dana *
                  </label>
                  <select
                    value={capitalSourceType}
                    onChange={(e) => setCapitalSourceType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="MODAL_PEMILIK">Modal Pemilik / Disetor</option>
                    <option value="INVESTOR">Penyertaan Modal Investor</option>
                    <option value="PINJAMAN">Pinjaman Bank / Lembaga</option>
                    <option value="DANA_INTERNAL">Dana Internal Perusahaan</option>
                    <option value="LAINNYA">Sumber Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nama Penyetor / Sumber Dana *
                  </label>
                  <input
                    type="text"
                    value={capitalSourceName}
                    onChange={(e) => setCapitalSourceName(e.target.value)}
                    placeholder="Contoh: Bpk. Hendra (Direktur Utama)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nominal Modal (Rp) *
                  </label>
                  <input
                    type="number"
                    value={capitalAmount}
                    onChange={(e) => setCapitalAmount(Number(e.target.value))}
                    placeholder="Contoh: 500000000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold text-emerald-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <div className="text-[11px] text-slate-400 mt-1">
                    Terbaca: <strong>{formatRupiah(capitalAmount)}</strong>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    No. Referensi / Bukti Setor
                  </label>
                  <input
                    type="text"
                    value={capitalRefNo}
                    onChange={(e) => setCapitalRefNo(e.target.value)}
                    placeholder="Contoh: BUKTI-SETOR-01"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Keterangan Penyetoran
                  </label>
                  <input
                    type="text"
                    value={capitalNotes}
                    onChange={(e) => setCapitalNotes(e.target.value)}
                    placeholder="Keterangan alokasi modal..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Saldo Awal Kas / Bank */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 pb-1 border-b border-slate-800">
                Atur rekening penampungan kas dan bank proyek. Saldo awal ini akan menjadi dasar perhitungan saldo kas.
              </div>

              {/* Existing Accounts List */}
              <div className="space-y-2">
                {accounts.map((acc, idx) => (
                  <div 
                    key={acc.id} 
                    className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        {acc.bankName.slice(0, 3)}
                      </div>
                      <div>
                        <div className="font-bold text-white">{acc.name}</div>
                        <div className="text-[11px] text-slate-400">
                          {acc.type} • No: {acc.accountNumber}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-extrabold text-emerald-400">
                          {formatRupiah(acc.openingBalance)}
                        </div>
                        <div className="text-[10px] text-slate-400">Saldo Awal</div>
                      </div>
                      {accounts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAccount(acc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Account Form */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>+ Tambah Rekening Lain (Opsional)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Nama Rekening</label>
                    <input
                      type="text"
                      value={newAccName}
                      onChange={(e) => setNewAccName(e.target.value)}
                      placeholder="e.g. Kas Tunai Lapangan"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Jenis / Bank</label>
                    <input
                      type="text"
                      value={newAccBank}
                      onChange={(e) => setNewAccBank(e.target.value)}
                      placeholder="e.g. Mandiri / Kas Tunai"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Saldo Awal (Rp)</label>
                    <input
                      type="number"
                      value={newAccBalance}
                      onChange={(e) => setNewAccBalance(Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleAddAccount}
                    className="py-1.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Tambahkan ke Daftar
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs flex justify-between items-center">
                <span className="text-slate-400">Total Saldo Kas &amp; Bank Terbuka:</span>
                <span className="font-extrabold text-base text-emerald-400">{formatRupiah(totalOpeningCash)}</span>
              </div>
            </div>
          )}

          {/* STEP 4: Kavling & RAB */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 pb-1 border-b border-slate-800">
                Tentukan pembagian blok kavling dan estimasi pagu anggaran (RAB) proyek.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Estimasi Total Anggaran Proyek (RAB Plafon) Rp
                </label>
                <input
                  type="number"
                  value={budgetRAB}
                  onChange={(e) => setBudgetRAB(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold text-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <div className="text-[11px] text-slate-400 mt-1">
                  Plafon: <strong>{formatRupiah(budgetRAB)}</strong>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Daftar Blok Kavling Proyek
                </label>
                {blocks.map(b => (
                  <div key={b.id} className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white">{b.name}</span>
                      <span className="text-slate-400 ml-2">({b.totalUnits} unit) • {b.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Ringkasan Final */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400 pb-1 border-b border-slate-800">
                Periksa kembali data setup sebelum project dibuat.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-2 text-xs">
                  <div className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                    PROFIL PROJECT
                  </div>
                  <div>
                    <span className="text-slate-400">Nama:</span> <strong className="text-white">{projectName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Kode:</span> <span className="font-mono text-indigo-300 font-bold">{projectCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Developer:</span> <span className="text-slate-200">{developerCompany}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Lokasi:</span> <span className="text-slate-200">{location}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Target:</span> <span className="text-slate-200">{targetUnits} Unit ({totalLandArea} m²)</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700 space-y-2 text-xs">
                  <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    DANA AWAL &amp; KAS
                  </div>
                  <div>
                    <span className="text-slate-400">Penyetor Modal:</span> <strong className="text-white">{capitalSourceName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Jenis:</span> <span className="text-slate-200">{capitalSourceType.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Nominal Modal:</span> <strong className="text-emerald-400 font-bold">{formatRupiah(capitalAmount)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Total Saldo Kas:</span> <strong className="text-emerald-400 font-bold">{formatRupiah(totalOpeningCash)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Jumlah Rekening:</span> <span className="text-slate-200">{accounts.length} Akun</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  Sistem akan membuat jurnal saldo awal, mencatat entri audit pembentukan project, dan mengarahkan Anda ke Dashboard Proyek yang bersih.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer / Buttons */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => { setErrorMsg(null); setCurrentStep(prev => prev - 1); }}
              className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <span>Lanjut</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="py-3 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>BUAT PROJECT &amp; BUKA DASHBOARD</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
