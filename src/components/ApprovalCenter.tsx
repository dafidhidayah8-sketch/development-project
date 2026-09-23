import React, { useState } from 'react';
import { 
  Transaction, 
  ApprovalMatrixRule, 
  UserRole,
  ApprovalStepRecord 
} from '../types';
import { 
  formatRupiah, 
  formatCompactRupiah, 
  formatDateIndo, 
  formatDateTimeIndo 
} from '../utils/formatters';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  FileText, 
  User, 
  Layers,
  ArrowRight,
  Filter
} from 'lucide-react';

interface ApprovalCenterProps {
  transactions: Transaction[];
  approvalRules: ApprovalMatrixRule[];
  activeRole: UserRole;
  onApproveTransaction: (txId: string, stepNo: number, notes: string) => void;
  onRejectTransaction: (txId: string, stepNo: number, notes: string) => void;
}

export const ApprovalCenter: React.FC<ApprovalCenterProps> = ({
  transactions,
  approvalRules,
  activeRole,
  onApproveTransaction,
  onRejectTransaction
}) => {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [approvalNotes, setApprovalNotes] = useState<string>('');

  // Pending transactions needing approval
  const pendingTransactions = transactions.filter(t => 
    t.status === 'SUBMITTED' || t.status === 'VERIFIED'
  );

  const handleOpenActionModal = (tx: Transaction, type: 'APPROVE' | 'REJECT') => {
    setSelectedTx(tx);
    setActionType(type);
    setApprovalNotes(type === 'APPROVE' ? 'Disetujui, dokumen dan spesifikasi telah sesuai.' : 'Ditolak, dokumen atau opname belum lengkap.');
  };

  const handleConfirmAction = () => {
    if (!selectedTx || !actionType) return;
    const currentStep = selectedTx.approvalSteps.find(s => s.status === 'PENDING');
    if (!currentStep) return;
    const stepNo = currentStep.stepNo;
    const authorized = activeRole === currentStep.roleRequired || activeRole === 'ADMIN' || activeRole === 'DIREKSI';
    if (!authorized) {
      setApprovalNotes('Role aktif tidak berwenang untuk langkah approval ini.');
      return;
    }

    if (actionType === 'APPROVE') {
      onApproveTransaction(selectedTx.id, stepNo, approvalNotes);
    } else {
      onRejectTransaction(selectedTx.id, stepNo, approvalNotes);
    }

    setSelectedTx(null);
    setActionType(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              SISTEM GOVERNANCE &amp; INTERNAL CONTROL PROYEK
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              Pusat Otorisasi &amp; Matriks Approval Bertingkat
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Mencegah pencairan dana tanpa dasar hukum dan tanpa otorisasi berjenjang. Setiap rupiah diawasi sesuai 
              batas kewenangan (Finance, Project Manager, dan Direksi).
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-500 block">Peran Aktif Saat Ini:</span>
            <span className="font-bold text-indigo-700 text-sm">{activeRole}</span>
          </div>
        </div>

        {/* Approval Matrix Rules Table */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Matriks Persetujuan Transaksi Keuangan (Approval Matrix)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {approvalRules.slice(0, 3).map((rule, idx) => (
              <div key={rule.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                    <span>Tier {idx + 1}: {rule.maxAmount > 100000000 ? '> Rp 50 Jt' : rule.maxAmount <= 5000000 ? '<= Rp 5 Jt' : 'Rp 5 Jt - 50 Jt'}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-800 font-semibold">
                      {rule.transactionType}
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] mb-2">{rule.description}</p>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-semibold text-slate-500">Wewenang:</span>
                  {rule.requiredRoles.map((r, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white border border-slate-300 text-slate-700">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Approvals List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">
              Antrean Menunggu Persetujuan ({pendingTransactions.length} Transaksi)
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Audit trail mencatat otomatis nama pemeriksa, jabatan, dan tanggal aksi
          </span>
        </div>

        {pendingTransactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-700">Tidak ada antrean approval yang tertunda.</p>
            <p className="text-xs text-slate-400 mt-0.5">Semua transaksi saat ini telah selesai disetujui atau diposting.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingTransactions.map((tx) => {
              const currentPendingStep = tx.approvalSteps.find(s => s.status === 'PENDING');
              const isEligibleToApprove = currentPendingStep 
                ? activeRole === 'DIREKSI' || activeRole === 'ADMIN' || activeRole === currentPendingStep.roleRequired
                : false;

              return (
                <div 
                  key={tx.id} 
                  className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all bg-white shadow-xs space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">{tx.id}</span>
                        <span className="text-xs text-slate-400">• {formatDateIndo(tx.date)}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          {tx.status}
                        </span>
                        {tx.needsReviewReason && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> BUTUH REVIEW KHUSUS
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mt-1">{tx.subcategory} - {tx.description}</h4>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Pihak: <strong>{tx.partyName}</strong> ({tx.partyRole}) • Unit: <strong>{tx.unitId || tx.block || 'Kawasan'}</strong> • Cost Code: <strong>{tx.costCode}</strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-500 font-medium">Nominal Transaksi:</div>
                      <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                        {formatRupiah(tx.totalAmount)}
                      </div>
                      <div className="text-[11px] text-slate-400">{tx.paymentMethod}</div>
                    </div>
                  </div>

                  {/* Warning / Audit Flag Notice */}
                  {tx.needsReviewReason && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                      <strong>Catatan Pengendalian: </strong>{tx.needsReviewReason}
                    </div>
                  )}

                  {/* Multi-Step Pipeline Visualizer */}
                  <div>
                    <span className="text-xs font-bold text-slate-600 block mb-2">Jalur Otorisasi Bertingkat:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {tx.approvalSteps.map((step) => {
                        const isDone = step.status === 'APPROVED';
                        const isPending = step.status === 'PENDING';
                        return (
                          <div 
                            key={step.stepNo}
                            className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                              isDone ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' :
                              isPending ? 'bg-amber-50/80 border-amber-300 text-amber-950' :
                              'bg-slate-50 border-slate-200 text-slate-600'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold">Langkah {step.stepNo}: {step.roleRequired}</span>
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : isPending ? (
                                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-600">
                              {step.approverName ? (
                                <>
                                  <div className="font-semibold text-slate-900">{step.approverName}</div>
                                  <div className="text-[10px] text-slate-400">{formatDateTimeIndo(step.actionDate || '')}</div>
                                </>
                              ) : (
                                <span className="italic text-slate-400">Menunggu persetujuan {step.roleRequired}</span>
                              )}
                            </div>
                            {step.notes && (
                              <div className="mt-1 pt-1 border-t border-slate-200/60 text-[10px] text-slate-500">
                                &quot;{step.notes}&quot;
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions for Authorized Role */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-500">
                      Operator penginput: <strong>{tx.operatorName}</strong> ({formatDateTimeIndo(tx.createdAt)})
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenActionModal(tx, 'REJECT')}
                        className="px-3.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                      >
                        Tolak Transaksi
                      </button>
                      <button
                        onClick={() => handleOpenActionModal(tx, 'APPROVE')}
                        className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        Setujui (Approve)
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {selectedTx && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${actionType === 'APPROVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {actionType === 'APPROVE' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {actionType === 'APPROVE' ? 'Konfirmasi Persetujuan' : 'Konfirmasi Penolakan'}
                </h3>
                <p className="text-xs text-slate-500">{selectedTx.id} - {formatRupiah(selectedTx.totalAmount)}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Otorisasi / Alasan
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-800 focus:outline-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-md cursor-pointer ${
                  actionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {actionType === 'APPROVE' ? 'Ya, Berikan Persetujuan' : 'Ya, Tolak Transaksi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
