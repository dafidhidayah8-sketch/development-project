import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle, CheckCircle2, ChevronRight, FileCheck, ArrowRight } from 'lucide-react';
import { Transaction } from '../../types';
import { formatCompactRupiah, formatRupiah } from '../../utils/formatters';

interface ControlExceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  unclassifiedTransactions: Transaction[];
  onResolveException: (
    txId: string, 
    newCostCode: string, 
    newCategory: any, 
    note: string
  ) => void;
}

export const ControlExceptionModal: React.FC<ControlExceptionModalProps> = ({
  isOpen,
  onClose,
  unclassifiedTransactions,
  onResolveException
}) => {
  const [selectedTxId, setSelectedTxId] = useState<string>(
    unclassifiedTransactions[0]?.id || 'TRX-2026-0003'
  );
  const [targetCostCode, setTargetCostCode] = useState<string>('BLD-002');
  const [targetCategory, setTargetCategory] = useState<string>('KONTRAKTOR_MANDOR');
  const [resolutionNote, setResolutionNote] = useState<string>(
    'Hasil audit fisik bersama Mandor Pa Didi & Direktur: Transaksi dialokasikan untuk Borongan Pengecoran Struktur Blok A Unit A01-A05.'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentTx = unclassifiedTransactions.find(t => t.id === selectedTxId) || unclassifiedTransactions[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTx) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onResolveException(
        currentTx.id,
        targetCostCode,
        targetCategory as any,
        resolutionNote
      );
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1200);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-400/30">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 block">
                Level 2 Control • Diagnostic Center
              </span>
              <h3 className="text-lg font-bold text-white">
                ⚠ Control Exception: Periksa &amp; Reklasifikasi Transaksi Belum Terurai
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {isSuccess ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Reklasifikasi Berhasil Diposting!</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Transaksi telah diberi Cost Code resmi, dicatat ke Jurnal Umum SAK EP, dan saldo &quot;Unclassified&quot; pada dashboard otomatis dinolkan.
              </p>
            </div>
          ) : (
            <>
              {/* Structured Exception Card (Issue 7 Specification) */}
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200/80">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-200 text-amber-900 uppercase">
                      STATUS: NEEDS REVIEW
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      ID Transaksi: {currentTx ? currentTx.id : 'TRX-2026-0003'}
                    </span>
                  </div>
                  <span className="text-base font-black text-rose-600">
                    {formatRupiah(currentTx ? currentTx.totalAmount : 50000000)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Jenis Transaksi:</span>
                    <strong className="text-slate-800">Legacy Transaction (Migrasi)</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Pihak Terkait:</span>
                    <strong className="text-slate-800">Mandor PA DIDI &amp; Induk PT</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Masalah / Exception:</span>
                    <strong className="text-rose-700">Cost Code belum terurai</strong>
                  </div>
                </div>

                <p className="text-[11px] text-amber-900 bg-white/70 p-2.5 rounded-lg border border-amber-200/60 leading-relaxed">
                  <strong>Catatan Sistem:</strong> &quot;Catatan Kas Keluar Lama Rp 50 Juta tanpa rincian nota &amp; cost code. Dilarang diposting ke Laba Rugi tanpa dasar WBS yang dapat dipertanggungjawabkan.&quot;
                </p>
              </div>

              {/* Reklasifikasi Action Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Workflow Penyelesaian (Action Required): Reklasifikasi ke Cost Code WBS
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Pilih Kategori Transaksi Baru:
                    </label>
                    <select
                      value={targetCategory}
                      onChange={(e) => setTargetCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="KONTRAKTOR_MANDOR">KONTRAKTOR_MANDOR (Upah Mandor Borongan)</option>
                      <option value="MATERIAL">MATERIAL (Bahan Bangunan)</option>
                      <option value="ALAT_BERAT">ALAT_BERAT (Pematangan Lahan)</option>
                      <option value="INFRASTRUKTUR">INFRASTRUKTUR (Paving &amp; Saluran)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Alokasikan ke Cost Code WBS:
                    </label>
                    <select
                      value={targetCostCode}
                      onChange={(e) => setTargetCostCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="BLD-002">BLD-002 • Struktur Beton Bertulang (WBS 05 Konstruksi)</option>
                      <option value="BLD-001">BLD-001 • Pondasi Batu Kali &amp; Galian Tanah (WBS 05)</option>
                      <option value="SIT-002">SIT-002 • Pematangan &amp; Cut/Fill Lahan (WBS 03)</option>
                      <option value="INF-001">INF-001 • Perkerasan Jalan Utama &amp; Paving (WBS 04)</option>
                      <option value="ADM-002">ADM-002 • Operasional Direksi Keet (WBS 08)</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block text-slate-600 font-semibold mb-1">
                    Uraian Berita Acara Reklasifikasi / Validasi Audit:
                  </label>
                  <textarea
                    rows={3}
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 text-xs focus:ring-2 focus:ring-indigo-500"
                    placeholder="Masukkan alasan dan dasar dokumen reklasifikasi..."
                    required
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Jurnal Penyesuaian otomatis: <strong>D: 1320 (WIP Konstruksi Bangunan)</strong> | <strong>K: 5900 (Akun Suspense Belum Terurai)</strong>.</span>
                </div>

                {/* Footer buttons inside form */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <span>Memproses Posting...</span>
                    ) : (
                      <>
                        <span>Simpan Reklasifikasi &amp; Posting Jurnal</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
