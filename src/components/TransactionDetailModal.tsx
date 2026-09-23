import React from 'react';
import { Transaction, UserRole } from '../types';
import { formatRupiah, formatDateIndo, formatDateTimeIndo } from '../utils/formatters';
import { printTransactionVoucher } from '../services/printService';
import { generateWhatsAppManualLink } from '../services/integrationService';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Building2, 
  AlertTriangle,
  ArrowRight,
  Printer,
  Share2
} from 'lucide-react';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  activeRole: UserRole;
  onApprove?: (txId: string, stepNo: number, notes: string) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  activeRole,
  onApprove
}) => {
  if (!transaction) return null;

  const currentPendingStep = transaction.approvalSteps.find(s => s.status === 'PENDING');
  const canApprove = currentPendingStep && (activeRole === 'DIREKSI' || activeRole === 'ADMIN' || activeRole === currentPendingStep.roleRequired);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-20">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-indigo-400">{transaction.id}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                transaction.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                transaction.status === 'APPROVED' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {transaction.status}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">{transaction.subcategory}</h3>
            <p className="text-xs text-slate-400">{formatDateIndo(transaction.date)} • {transaction.projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 flex-1 text-xs">
          {/* Warning Flag if any */}
          {transaction.needsReviewReason && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Peringatan Audit &amp; Kontrol Proyek:</span>
                <p className="mt-0.5 leading-relaxed text-[11px]">{transaction.needsReviewReason}</p>
              </div>
            </div>
          )}

          {/* Dual Identity Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Project Identity */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-bold text-indigo-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-indigo-600" />
                1. Identitas Proyek &amp; Lapangan
              </span>
              <div className="space-y-1 text-slate-700">
                <div><span className="text-slate-400">Blok / Unit:</span> <strong>{transaction.block || '-'} / {transaction.unitId || 'Kawasan'}</strong></div>
                <div><span className="text-slate-400">WBS Code:</span> <strong>WBS {transaction.wbsCode}</strong></div>
                <div><span className="text-slate-400">Cost Code:</span> <strong className="text-indigo-700">{transaction.costCode}</strong> ({transaction.costCodeName})</div>
                <div><span className="text-slate-400">Pihak:</span> <strong>{transaction.partyName}</strong> ({transaction.partyRole})</div>
                <div><span className="text-slate-400">Uraian:</span> {transaction.description}</div>
              </div>
            </div>

            {/* Accounting Identity */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-bold text-emerald-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <FileText className="w-4 h-4 text-emerald-600" />
                2. Identitas Akuntansi (Jurnal)
              </span>
              <div className="space-y-1 text-slate-700">
                <div><span className="text-slate-400">Akun Debet:</span> <strong className="font-mono text-emerald-800">{transaction.debitAccountCode}</strong></div>
                <div><span className="text-slate-400">Akun Kredit:</span> <strong className="font-mono text-rose-800">{transaction.creditAccountCode}</strong></div>
                <div><span className="text-slate-400">Metode Bayar:</span> <strong>{transaction.paymentMethod}</strong></div>
                <div><span className="text-slate-400">Status Pembayaran:</span> <strong>{transaction.isPaid ? 'Sudah Dibayar (Lunas)' : 'Belum Dibayar (Hutang AP)'}</strong></div>
                <div><span className="text-slate-400">Status Jurnal:</span> <strong className="text-emerald-700">Terposting Otomatis</strong></div>
              </div>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="p-4 bg-slate-100/70 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-500 font-medium">Nominal Total:</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {formatRupiah(transaction.totalAmount)}
              </div>
            </div>
            {transaction.quantity && (
              <div className="text-right text-slate-600">
                <div>Qty: <strong>{transaction.quantity} {transaction.unitOfMeasure}</strong></div>
                <div>Harga Satuan: <strong>{formatRupiah(transaction.unitPrice || 0)}</strong></div>
              </div>
            )}
          </div>

          {/* Multi-Step Approval Flow */}
          <div className="space-y-3">
            <span className="font-bold text-slate-800 uppercase tracking-wider block">
              Jejak Persetujuan &amp; Otorisasi Bertingkat
            </span>
            <div className="space-y-2">
              {transaction.approvalSteps.map((step) => {
                const isApproved = step.status === 'APPROVED';
                const isPending = step.status === 'PENDING';
                return (
                  <div 
                    key={step.stepNo}
                    className={`p-3 rounded-xl border flex items-center justify-between ${
                      isApproved ? 'bg-emerald-50 border-emerald-200' :
                      isPending ? 'bg-amber-50 border-amber-200' :
                      'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">Langkah {step.stepNo}: {step.roleRequired}</span>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                          isApproved ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                        }`}>
                          {step.status}
                        </span>
                      </div>
                      {step.approverName && (
                        <div className="text-slate-600 mt-0.5 text-[11px]">
                          Disetujui oleh <strong>{step.approverName}</strong> • {formatDateTimeIndo(step.actionDate || '')}
                        </div>
                      )}
                      {step.notes && (
                        <div className="text-slate-500 italic mt-0.5 text-[11px]">&quot;{step.notes}&quot;</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => printTransactionVoucher(transaction)}
              className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Cetak Bukti Voucher Transaksi / Kwitansi"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>Cetak Bukti</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const link = generateWhatsAppManualLink('', transaction, activeRole);
                window.open(link, '_blank');
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Kirim Ringkasan Transaksi via WhatsApp"
            >
              <Share2 className="w-4 h-4 text-emerald-700" />
              <span>Kirim WhatsApp</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Tutup
            </button>
            {canApprove && onApprove && (
              <button
                onClick={() => {
                  if (currentPendingStep) {
                    onApprove(transaction.id, currentPendingStep.stepNo, 'Disetujui via dialog detail transaksi');
                    onClose();
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Setujui Sekarang ({activeRole})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
