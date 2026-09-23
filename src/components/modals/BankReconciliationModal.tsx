import React, { useState } from 'react';
import { X, RefreshCw, AlertTriangle, CheckCircle2, ChevronRight, FileSpreadsheet, ArrowRight, ArrowDownRight } from 'lucide-react';
import { BankAccount } from '../../types';
import { formatCompactRupiah, formatRupiah } from '../../utils/formatters';

interface BankReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankAccount: BankAccount;
  onPostReconciliationAdjustment: (
    accountId: string,
    adjustedBalance: number,
    causeDescription: string
  ) => void;
  onNavigateToBankTab?: () => void;
}

export const BankReconciliationModal: React.FC<BankReconciliationModalProps> = ({
  isOpen,
  onClose,
  bankAccount,
  onPostReconciliationAdjustment,
  onNavigateToBankTab
}) => {
  const [selectedCause, setSelectedCause] = useState<string>(
    'BUNGA_DAN_ADMIN'
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const bookBalance = bankAccount.currentBalance;
  const bankStatementBalance = bankAccount.statementBalance;
  const diff = Math.abs(bookBalance - bankStatementBalance);

  const handleReconcile = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      let causeText = 'Penyesuaian setelah verifikasi rekening koran';
      if (selectedCause === 'SETORAN_KLIRING') {
        causeText = 'Setoran kliring / deposit in transit yang telah diverifikasi';
      } else if (selectedCause === 'CEK_BEREDAR') {
        causeText = 'Cek/giro outstanding yang telah diverifikasi';
      }

      onPostReconciliationAdjustment(
        bankAccount.id,
        bankStatementBalance,
        causeText
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
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 rounded-xl border border-indigo-400/30">
              <RefreshCw className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 block">
                Level 2 Control • Bank Reconciliation Workflow
              </span>
              <h3 className="text-lg font-bold text-white">
                Rekonsiliasi Bank: {bankAccount.name}
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {isSuccess ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Rekonsiliasi Selesai &amp; Selisih Dinolkan!</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Setelah penyesuaian disetujui, saldo buku disejajarkan dengan saldo rekening koran terverifikasi (Rp {formatRupiah(bankStatementBalance)}).
              </p>
            </div>
          ) : (
            <>
              {/* Saldo Grid as requested in Issue 8 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-medium block">Saldo Menurut Buku (GL)</span>
                  <span className="text-base font-bold text-slate-900 mt-1 block">
                    {formatRupiah(bookBalance)}
                  </span>
                  <span className="text-[10px] text-slate-400">Catatan Kasir</span>
                </div>

                <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200 text-center">
                  <span className="text-[11px] text-indigo-800 font-medium block">Saldo Rekening Koran</span>
                  <span className="text-base font-bold text-indigo-700 mt-1 block">
                    {formatRupiah(bankStatementBalance)}
                  </span>
                  <span className="text-[10px] text-indigo-500">Mutasi e-Banking</span>
                </div>

                <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200 text-center">
                  <span className="text-[11px] text-rose-800 font-medium block">Selisih (Variance)</span>
                  <span className="text-base font-black text-rose-600 mt-1 block">
                    {formatRupiah(diff)}
                  </span>
                  <span className="text-[10px] text-rose-500 font-bold uppercase">STATUS: OPEN</span>
                </div>
              </div>

              {/* Penyebab & Formulir Rekonsiliasi */}
              <div className="space-y-4">
                <div className="text-xs">
                  <label className="block text-slate-700 font-bold mb-1.5 uppercase tracking-wide">
                    Identifikasi Penyebab Selisih (Root Cause):
                  </label>
                  <select
                    value={selectedCause}
                    onChange={(e) => setSelectedCause(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 font-semibold text-xs focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="BUNGA_DAN_ADMIN">
                      Penyesuaian saldo setelah verifikasi rekening koran
                    </option>
                    <option value="SETORAN_KLIRING">
                      Setoran Titipan Konsumen dalam Kliring (Deposit in Transit)
                    </option>
                    <option value="CEK_BEREDAR">
                      Cek Giro Vendor Belum Dicairkan (Outstanding Checks)
                    </option>
                  </select>
                </div>

                {/* Proposed Adjusting Journal Entry */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>Draft Jurnal Penyesuaian Otomatis:</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Balance 100%
                    </span>
                  </div>
                  <div className="font-mono text-[11px] space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="flex justify-between text-slate-800">
                      <span>(D) 1120 Bank BCA Operasional</span>
                      <span className="font-bold">Rp 2.000.000</span>
                    </div>
                    <div className="flex justify-between text-slate-600 pl-4">
                      <span>(K) 7100 Pendapatan Bunga Giro</span>
                      <span>Rp 2.150.000</span>
                    </div>
                    <div className="flex justify-between text-slate-600 pl-4">
                      <span>(D) 6200 Beban Administrasi Bank</span>
                      <span>Rp 150.000</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 italic">
                    Memposting jurnal ini akan menyelaraskan saldo sistem menjadi Rp {formatRupiah(currentBalance)} dan menutup selisih rekonsiliasi.
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {onNavigateToBankTab && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToBankTab();
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Lihat Seluruh Mutasi Buku Bank</span>
                  </button>
                )}

                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleReconcile}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <span>Memposting Penyesuaian...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Posting Jurnal &amp; Rekonsiliasi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
