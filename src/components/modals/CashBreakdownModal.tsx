import React from 'react';
import { X, Wallet, ShieldAlert, CheckCircle2, ChevronRight, Lock, Unlock, ArrowUpRight } from 'lucide-react';
import { BankAccount } from '../../types';
import { formatCompactRupiah, formatRupiah } from '../../utils/formatters';

interface CashBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankAccounts: BankAccount[];
  onOpenReconciliation?: () => void;
  onNavigateToBankTab?: () => void;
}

export const CashBreakdownModal: React.FC<CashBreakdownModalProps> = ({
  isOpen,
  onClose,
  bankAccounts,
  onOpenReconciliation,
  onNavigateToBankTab
}) => {
  if (!isOpen) return null;

  const totalCash = bankAccounts.reduce((sum, b) => sum + b.currentBalance, 0);

  // Categorize accounts: Available Cash vs Restricted Cash
  // Escrow Mandiri (BNK-03) is restricted for KPR disbursement
  const restrictedAccounts = bankAccounts.filter(b => b.id === 'BNK-03' || b.name.toLowerCase().includes('escrow'));
  const availableAccounts = bankAccounts.filter(b => b.id !== 'BNK-03' && !b.name.toLowerCase().includes('escrow'));

  const totalRestricted = restrictedAccounts.reduce((sum, b) => sum + b.currentBalance, 0);
  const totalAvailable = totalCash - totalRestricted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600/30 rounded-xl border border-emerald-400/30">
              <Wallet className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 block">
                Level 1 &amp; Level 2 • Posisi Likuiditas &amp; Kas Proyek
              </span>
              <h3 className="text-lg font-bold text-white">
                Rincian Saldo Kas &amp; Rekening Bank (Cash Management)
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

        {/* 3 Overview Metric Cards */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">TOTAL KAS &amp; BANK</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{formatRupiah(totalCash)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">5 Rekening Aktif Proyek</div>
          </div>

          <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-emerald-800 font-medium">
              <span>AVAILABLE CASH</span>
              <Unlock className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{formatRupiah(totalAvailable)}</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Dana bebas operasional &amp; payroll</div>
          </div>

          <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-200 shadow-xs">
            <div className="flex items-center justify-between text-xs text-purple-800 font-medium">
              <span>RESTRICTED CASH (ESCROW)</span>
              <Lock className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-700 mt-1">{formatRupiah(totalRestricted)}</div>
            <div className="text-[11px] text-purple-700 mt-0.5">Titipan Bank KPR Konsumen</div>
          </div>
        </div>

        {/* Accounts Breakdown List */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Daftar Rekening Bank &amp; Kas Operasional
            </h4>
            <span className="text-xs text-slate-500">Update Terakhir: 23 September 2026</span>
          </div>

          <div className="space-y-2.5">
            {bankAccounts.map((acc) => {
              const isEscrow = acc.id === 'BNK-03';
              const hasDiff = acc.unreconciledDifference !== 0;

              return (
                <div 
                  key={acc.id}
                  className="p-3.5 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isEscrow ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                      {isEscrow ? <Lock className="w-4 h-4" /> : <Wallet className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">{acc.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600">
                          {acc.accountNumber}
                        </span>
                        {isEscrow && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                            Restricted
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {acc.bankName} • Rekonsiliasi terakhir: {acc.lastReconciledDate}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex items-center justify-between sm:justify-end gap-4">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{formatRupiah(acc.currentBalance)}</div>
                      {hasDiff ? (
                        <div className="text-[11px] font-bold text-rose-600 flex items-center justify-end gap-1">
                          <span>Selisih: {formatRupiah(acc.unreconciledDifference)}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] font-medium text-emerald-600 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Cocok dengan Rekening Koran</span>
                        </div>
                      )}
                    </div>

                    {hasDiff && onOpenReconciliation && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenReconciliation();
                        }}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Rekonsiliasi
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Safety Cash Buffer Proyek: <strong className="text-slate-800">Rp 100.000.000</strong> (Status: AMAN)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            {onNavigateToBankTab && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToBankTab();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span>Buka Tab Akuntansi &amp; Bank</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
