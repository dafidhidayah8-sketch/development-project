import React, { useState } from 'react';
import { Coins, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { BankAccount, InitialCapitalEntry } from '../../types';
import { formatRupiah } from '../../utils/formatters';

interface InitialCapitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  bankAccounts: BankAccount[];
  onSubmitCapital: (entry: InitialCapitalEntry) => void;
}

export const InitialCapitalModal: React.FC<InitialCapitalModalProps> = ({
  isOpen,
  onClose,
  projectId,
  bankAccounts,
  onSubmitCapital,
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sourceName, setSourceName] = useState<string>('');
  const [sourceType, setSourceType] = useState<InitialCapitalEntry['sourceType']>('MODAL_PEMILIK');
  const [amount, setAmount] = useState<number>(100000000);
  const [destinationAccountId, setDestinationAccountId] = useState<string>(bankAccounts[0]?.id || '');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceName.trim()) {
      setErrorMsg('Nama penyetor modal wajib diisi.');
      return;
    }
    if (amount <= 0) {
      setErrorMsg('Nominal modal harus lebih besar dari 0.');
      return;
    }
    if (!destinationAccountId) {
      setErrorMsg('Pilih rekening tujuan penerima dana.');
      return;
    }

    const newEntry: InitialCapitalEntry = {
      id: `CAP-${Date.now().toString().slice(-4)}`,
      projectId,
      date,
      sourceName,
      sourceType,
      amount: Number(amount) || 0,
      destinationAccountId,
      referenceNo: referenceNo || `CAP-REF-${Date.now().toString().slice(-4)}`,
      notes,
      createdAt: new Date().toISOString(),
    };

    onSubmitCapital(newEntry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">SETOR MODAL / DANA AWAL</h2>
              <p className="text-xs text-slate-400">Injeksi ekuitas atau pendanaan proyek</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Tanggal Penyetoran *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Jenis Sumber Dana *</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
            >
              <option value="MODAL_PEMILIK">Modal Pemilik / Disetor</option>
              <option value="INVESTOR">Penyertaan Investor</option>
              <option value="PINJAMAN">Pinjaman Konstruksi</option>
              <option value="DANA_INTERNAL">Dana Internal Holding</option>
              <option value="LAINNYA">Lain-lain</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Nama Penyetor / Sumber Dana *</label>
            <input
              type="text"
              value={sourceName}
              onChange={(e) => setSourceName(e.target.value)}
              placeholder="Contoh: Bpk. Hendra (Founder)"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Nominal Dana (Rp) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="100000000"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-emerald-400 font-bold"
            />
            <div className="text-[11px] text-slate-400 mt-1">
              Terbaca: <strong>{formatRupiah(amount)}</strong>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Masuk ke Rekening Tujuan *</label>
            <select
              value={destinationAccountId}
              onChange={(e) => setDestinationAccountId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
            >
              {bankAccounts.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.bankName} - {b.accountNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">No. Referensi / Bukti Transfer</label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="Contoh: SETOR-02-BCA"
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Keterangan Tambahan</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Alokasi penggunaan modal..."
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Penyetoran</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
