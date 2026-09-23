import React, { useState } from 'react';
import { 
  Transaction, 
  TransactionType, 
  TransactionCategory, 
  PaymentMethod, 
  Party,
  BankAccount, 
  CostCode, 
  Project,
  ApprovalStepRecord
} from '../types';
import { formatRupiah } from '../utils/formatters';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  UploadCloud, 
  HelpCircle, 
  ShieldCheck, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface OperatorInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  parties: Party[];
  costCodes: CostCode[];
  bankAccounts: BankAccount[];
  onSaveTransaction: (tx: Transaction) => void;
}

export const OperatorInputModal: React.FC<OperatorInputModalProps> = ({
  isOpen,
  onClose,
  project,
  parties,
  costCodes,
  bankAccounts,
  onSaveTransaction
}) => {
  // Form State
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [category, setCategory] = useState<TransactionCategory>('MATERIAL');
  const [subcategory, setSubcategory] = useState<string>('Semen Gresik PPC');
  const [description, setDescription] = useState<string>('');
  const [partyId, setPartyId] = useState<string>(parties[0]?.id || '');
  const [block, setBlock] = useState<string>('A');
  const [unitId, setUnitId] = useState<string>('A01-A05');
  const [quantity, setQuantity] = useState<number>(100);
  const [unitOfMeasure, setUnitOfMeasure] = useState<string>('sak');
  const [unitPrice, setUnitPrice] = useState<number>(75000);
  const [nominal, setNominal] = useState<number>(7500000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TRANSFER_BCA');
  const [invoiceNo, setInvoiceNo] = useState<string>('INV-' + Math.floor(1000 + Math.random() * 9000));
  const [receiptProofNo, setReceiptProofNo] = useState<string>('BK-' + Math.floor(100 + Math.random() * 900));
  const [proofFileName, setProofFileName] = useState<string>('');
  const [proofDataUrl, setProofDataUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Auto-deduce Cost Code & COA in background
  const getAutoCostCode = (): CostCode => {
    if (category === 'MATERIAL') {
      return costCodes.find(c => c.code === 'BLD-002') || costCodes[0];
    }
    if (category === 'KONTRAKTOR_MANDOR') {
      return costCodes.find(c => c.code === 'BLD-001') || costCodes[0];
    }
    if (category === 'ALAT_BERAT') {
      return costCodes.find(c => c.code === 'SIT-002') || costCodes[0];
    }
    if (category === 'INFRASTRUKTUR') {
      return costCodes.find(c => c.code === 'INF-001') || costCodes[0];
    }
    if (category === 'OPERASIONAL') {
      return costCodes.find(c => c.code === 'ADM-002') || costCodes[0];
    }
    if (category === 'MARKETING') {
      return costCodes.find(c => c.code === 'MKT-001') || costCodes[0];
    }
    return costCodes.find(c => c.code === 'UNC-999') || costCodes[0];
  };

  const autoCostCode = getAutoCostCode();
  const selectedParty = parties.find(p => p.id === partyId) || parties[0];

  const getBankAccountForPaymentMethod = (method: PaymentMethod): BankAccount | undefined => {
    if (method === 'BELUM_DIBAYAR_HUTANG') return undefined;
    if (method === 'TRANSFER_BCA') return bankAccounts.find(b => b.bankName === 'Bank BCA') || bankAccounts.find(b => b.id === 'BNK-02');
    if (method === 'TRANSFER_MANDIRI') return bankAccounts.find(b => b.bankName === 'Bank Mandiri') || bankAccounts.find(b => b.id === 'BNK-03');
    if (method === 'TRANSFER_BRI') return bankAccounts.find(b => b.bankName === 'Bank BRI') || bankAccounts.find(b => b.id === 'BNK-04');
    if (method === 'PETTY_CASH') return bankAccounts.find(b => b.bankName === 'Imprest Fund') || bankAccounts.find(b => b.id === 'BNK-05');
    return bankAccounts.find(b => b.bankName === 'Kas Tunai') || bankAccounts.find(b => b.id === 'BNK-01');
  };

  const selectedBankAccount = getBankAccountForPaymentMethod(paymentMethod);

  // Auto calculate nominal when qty or unit price change
  const handleQtyOrPriceChange = (newQty: number, newPrice: number) => {
    setQuantity(newQty);
    setUnitPrice(newPrice);
    if (newQty > 0 && newPrice > 0) {
      setNominal(newQty * newPrice);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build multi-level approval steps based on matrix rules
    const approvalSteps: ApprovalStepRecord[] = [];
    if (nominal <= 5000000) {
      approvalSteps.push({
        stepNo: 1,
        roleRequired: 'FINANCE',
        status: 'PENDING',
        notes: 'Verifikasi dokumen kwitansi / invoice'
      });
    } else if (nominal <= 50000000) {
      approvalSteps.push(
        { stepNo: 1, roleRequired: 'FINANCE', status: 'PENDING', notes: 'Pemeriksaan anggaran & faktur' },
        { stepNo: 2, roleRequired: 'PROJECT_MANAGER', status: 'PENDING', notes: 'Pemeriksaan progres fisik/opname' }
      );
    } else {
      approvalSteps.push(
        { stepNo: 1, roleRequired: 'FINANCE', status: 'PENDING', notes: 'Pemeriksaan anggaran & dokumen' },
        { stepNo: 2, roleRequired: 'PROJECT_MANAGER', status: 'PENDING', notes: 'Verifikasi teknis volume' },
        { stepNo: 3, roleRequired: 'DIREKSI', status: 'PENDING', notes: 'Otorisasi pengeluaran besar > Rp 50 Juta' }
      );
    }

    // Determine COA debit / credit
    let debitCode = '1320'; // WIP Properti Pengembangan
    let creditCode = '1120'; // Bank BCA default
    if (paymentMethod === 'TRANSFER_MANDIRI') creditCode = '1130';
    if (paymentMethod === 'TRANSFER_BRI') creditCode = '1140';
    if (paymentMethod === 'KAS_PROYEK') creditCode = '1110';
    if (paymentMethod === 'PETTY_CASH') creditCode = '1150';
    if (paymentMethod === 'BELUM_DIBAYAR_HUTANG') creditCode = '2110'; // Hutang Supplier

    if (type === 'INCOME') {
      debitCode = creditCode; // Uang masuk ke kas/bank
      creditCode = '2420'; // Uang Muka Konsumen PSAK 72
    }

    const newTx: Transaction = {
      id: `TRX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      idempotencyKey: `IDEMP-${Date.now()}`,
      date,
      projectId: project.id,
      projectName: project.name,
      type,
      category,
      subcategory,
      description: description || `${subcategory} untuk ${block ? `Blok ${block}` : ''} ${unitId}`,
      block,
      unitId,
      wbsCode: autoCostCode.wbsCode,
      costCode: autoCostCode.code,
      costCodeName: autoCostCode.name,
      partyId: selectedParty.id,
      partyName: selectedParty.name,
      partyRole: selectedParty.role,
      quantity,
      unitOfMeasure,
      unitPrice,
      subtotal: nominal,
      totalAmount: nominal,
      paymentMethod,
      bankAccountId: selectedBankAccount?.id,
      bankAccountName: selectedBankAccount ? selectedBankAccount.name + ' (' + selectedBankAccount.accountNumber + ')' : undefined,
      isPaid: paymentMethod !== 'BELUM_DIBAYAR_HUTANG',
      paidDate: paymentMethod !== 'BELUM_DIBAYAR_HUTANG' ? date : undefined,
      paidAmount: paymentMethod !== 'BELUM_DIBAYAR_HUTANG' ? nominal : 0,
      outstandingAmount: paymentMethod === 'BELUM_DIBAYAR_HUTANG' ? nominal : 0,
      invoiceNo,
      receiptProofNo,
      proofFileName: proofFileName || undefined,
      proofFileUrl: proofDataUrl || undefined,
      debitAccountCode: debitCode,
      creditAccountCode: creditCode,
      journalPosted: true,
      operatorName: 'Operator Lapangan (Site)',
      createdBy: 'operator_active',
      createdAt: new Date().toISOString(),
      status: 'SUBMITTED',
      currentApprovalLevel: 1,
      approvalSteps
    };

    onSaveTransaction(newTx);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white flex items-center justify-between sticky top-0 z-20">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
              LAPISAN 1: OPERATOR LAPANGAN
            </span>
            <h2 className="text-xl font-bold mt-1 text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              Catat Transaksi: &quot;Apa yang Terjadi?&quot;
            </h2>
            <p className="text-xs text-emerald-100 mt-0.5">
              Cukup catat kejadian riil. Jurnal akuntansi &amp; Cost Code dihitung otomatis di belakang.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
          {/* Section 1: Basic Facts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                1. Tanggal Kejadian
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                2. Proyek
              </label>
              <input
                type="text"
                disabled
                value={project.name}
                className="w-full text-xs bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 font-semibold cursor-not-allowed"
              />
            </div>
          </div>

          {/* Section 2: What kind of activity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                3. Jenis Transaksi
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('EXPENSE')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    type === 'EXPENSE'
                      ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Pengeluaran (Beli/Bayar)
                </button>
                <button
                  type="button"
                  onClick={() => setType('INCOME')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    type === 'INCOME'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Pemasukan (DP/Uang Masuk)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                4. Kategori Keperluan
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TransactionCategory)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-semibold focus:outline-emerald-500"
              >
                <option value="MATERIAL">Material (Semen, Besi, Bata, Pasir)</option>
                <option value="KONTRAKTOR_MANDOR">Upah Borongan Mandor / Tukang</option>
                <option value="ALAT_BERAT">Sewa Alat Berat / Beko</option>
                <option value="INFRASTRUKTUR">Infrastruktur (Jalan, Paving, Saluran)</option>
                <option value="LEGAL_PERIZINAN">Legalitas &amp; Perizinan PBG</option>
                <option value="MARKETING">Marketing &amp; Komisi Closing</option>
                <option value="OPERASIONAL">Operasional Kantor &amp; Kas Kecil</option>
                <option value="UNCLASSIFIED">Pengeluaran Lain (Belum Terurai)</option>
              </select>
            </div>
          </div>

          {/* Subcategory & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                5. Barang / Kegiatan Spesifik
              </label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="Contoh: Semen Gresik PPC 40kg"
                required
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                6. Pihak Rekanan / Penerima / Pengirim
              </label>
              <select
                value={partyId}
                onChange={(e) => setPartyId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-emerald-500"
              >
                {parties.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Spatial Mapping: Blok & Unit */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-700 block">
              7. Lokasi Blok &amp; Unit Proyek
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-500">Pilih Blok:</span>
                <select
                  value={block}
                  onChange={(e) => setBlock(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 mt-0.5"
                >
                  <option value="A">Blok A (Unit A01 - A05)</option>
                  <option value="B">Blok B (Unit B01 - B03)</option>
                  <option value="C">Blok C</option>
                  <option value="UMUM">Fasum / Infrastruktur Umum</option>
                </select>
              </div>
              <div>
                <span className="text-[11px] text-slate-500">Unit Spesifik:</span>
                <input
                  type="text"
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  placeholder="e.g. A01-A05 atau PROJECT-GENERAL"
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 mt-0.5"
                />
              </div>
            </div>
          </div>

          {/* Volume, Qty & Nominal */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Qty / Jumlah
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => handleQtyOrPriceChange(Number(e.target.value), unitPrice)}
                min="1"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Satuan
              </label>
              <input
                type="text"
                value={unitOfMeasure}
                onChange={(e) => setUnitOfMeasure(e.target.value)}
                placeholder="sak, m3, hari, paket"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Harga Satuan (Rp)
              </label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => handleQtyOrPriceChange(quantity, Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-emerald-500"
              />
            </div>
          </div>

          {/* Nominal Display */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-xs text-emerald-800 font-medium">Total Nilai Transaksi:</div>
              <div className="text-2xl font-extrabold text-emerald-900 mt-0.5">
                {formatRupiah(nominal)}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-emerald-700 block font-medium">Batas Otorisasi:</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-200/80 text-emerald-900 inline-block mt-0.5">
                {nominal <= 5000000 ? 'Level 1: Finance' : nominal <= 50000000 ? 'Level 2: PM + Finance' : 'Level 3: Direksi'}
              </span>
            </div>
          </div>

          {/* Payment Method & Proofs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                8. Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-emerald-500"
              >
                <option value="TRANSFER_BCA">Transfer Bank BCA (827-0912-88)</option>
                <option value="TRANSFER_MANDIRI">Transfer Bank Mandiri (141-00-2871)</option>
                <option value="TRANSFER_BRI">Transfer Bank BRI</option>
                <option value="KAS_PROYEK">Kas Tunai Proyek (Direksi Keet)</option>
                <option value="PETTY_CASH">Kas Kecil (Petty Cash)</option>
                <option value="BELUM_DIBAYAR_HUTANG">Belum Dibayar (Masuk Hutang AP)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                9. No Faktur / Bukti / Nota
              </label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="e.g. INV-001 atau Surat Jalan"
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-emerald-500"
              />
            </div>
          </div>

          {/* Actual browser file attachment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              10. Upload Bukti Fisik / Foto / PDF
            </label>
            <label htmlFor="operator-proof-file" className="border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center hover:border-emerald-500 transition-colors bg-slate-50/50 cursor-pointer block">
              <input id="operator-proof-file" type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) { alert('Bukti terlalu besar. Maksimal 2 MB.'); e.currentTarget.value = ''; return; }
                setIsUploading(true);
                const reader = new FileReader();
                reader.onload = () => { setProofFileName(file.name); setProofDataUrl(typeof reader.result === 'string' ? reader.result : ''); setIsUploading(false); };
                reader.onerror = () => { setIsUploading(false); alert('Bukti gagal dibaca browser.'); };
                reader.readAsDataURL(file);
              }} />
              <UploadCloud className="w-7 h-7 text-slate-400 mx-auto mb-1" />
              <div className="text-xs text-slate-700 font-semibold">{isUploading ? 'Membaca bukti...' : (proofFileName || 'Klik untuk pilih foto struk / faktur')}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, PDF • Maks. 2MB</div>
            </label>
          </div>

          {/* BACKEND AUTO-PREVIEW (Demonstrating Dual Identity: Project + Accounting) */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 border border-slate-700">
            <div className="flex items-center justify-between text-xs text-indigo-300 font-bold border-b border-slate-800 pb-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                SISTEM AKUNTANSI &amp; KONTROL (OTOMATIS DI BELAKANG)
              </span>
              <span className="text-[10px] text-slate-400">Zero Operator Effort</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div>
                <span className="text-slate-400 block text-[11px]">Cost Code Proyek:</span>
                <span className="font-semibold text-emerald-400">{autoCostCode.code} - {autoCostCode.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">WBS Proyek:</span>
                <span className="font-semibold text-cyan-300">WBS {autoCostCode.wbsCode}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Akun Debet (Jurnal):</span>
                <span className="font-mono text-amber-300">1320 (KDPP Properti Pengembangan)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Akun Kredit (Jurnal):</span>
                <span className="font-mono text-amber-300">
                  {paymentMethod === 'BELUM_DIBAYAR_HUTANG' ? '2110 (Hutang Supplier)' : '1120 (Bank BCA)'}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all cursor-pointer active:scale-95"
            >
              <span>SIMPAN TRANSAKSI</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
