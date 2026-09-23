import React from 'react';
import { X, PieChart, ArrowUpRight, CheckCircle2, ChevronRight } from 'lucide-react';
import { Project } from '../../types';
import { formatCompactRupiah, formatRupiah } from '../../utils/formatters';

interface BudgetControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onNavigateToCostCodes?: () => void;
}

export const BudgetControlModal: React.FC<BudgetControlModalProps> = ({
  isOpen,
  onClose,
  project,
  onNavigateToCostCodes
}) => {
  if (!isOpen) return null;

  // 8 WBS Budget Breakdown
  const wbsBudgets = [
    { code: '01', name: 'Pengadaan Lahan & Pembebasan', budget: 1500000000, committed: 1500000000, actual: 1500000000, pct: 100 },
    { code: '02', name: 'Perizinan, Amdal & Sertifikasi', budget: 350000000, committed: 300000000, actual: 250000000, pct: 71.4 },
    { code: '03', name: 'Pematangan Lahan & Cut/Fill', budget: 450000000, committed: 420000000, actual: 380000000, pct: 84.4 },
    { code: '04', name: 'Infrastruktur Jalan & Drainase', budget: 800000000, committed: 720000000, actual: 550000000, pct: 68.8 },
    { code: '05', name: 'Konstruksi Bangunan Rumah (Struktur)', budget: 2800000000, committed: 1800000000, actual: 1250000000, pct: 44.6 },
    { code: '06', name: 'Fasilitas Kawasan, Gate & Taman', budget: 400000000, committed: 330000000, actual: 230000000, pct: 57.5 },
    { code: '07', name: 'Pemasaran, Promosi & Komisi Agen', budget: 450000000, committed: 270000000, actual: 165000000, pct: 36.7 },
    { code: '08', name: 'Administrasi Umum & Overhead Proyek', budget: 450000000, committed: 380000000, actual: 215000000, pct: 47.8 },
  ];

  const totalBudget = project.budgetRAB;
  const totalActual = project.actualCost;
  const totalCommitted = project.committedCost;
  const remainingBudget = totalBudget - totalActual;
  const pctConsumed = ((totalActual / totalBudget) * 100).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/30 rounded-xl border border-indigo-400/30">
              <PieChart className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-300 block">
                Level 1 • Budget &amp; RAB Control Center
              </span>
              <h3 className="text-lg font-bold text-white">
                Rencana Anggaran Biaya (RAB): {project.name}
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

        {/* Overview Stats */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">Total Pagu RAB (BAC)</div>
            <div className="text-lg font-bold text-slate-900 mt-1">{formatRupiah(totalBudget)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">8 Paket WBS Resmi</div>
          </div>
          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
            <div className="text-xs text-amber-800 font-medium">Komitmen Kontrak (PO/SPK)</div>
            <div className="text-lg font-bold text-amber-700 mt-1">{formatRupiah(totalCommitted)}</div>
            <div className="text-[11px] text-amber-600 mt-0.5">{((totalCommitted / totalBudget) * 100).toFixed(1)}% dari anggaran</div>
          </div>
          <div className="p-3 bg-cyan-50/70 rounded-xl border border-cyan-200">
            <div className="text-xs text-cyan-800 font-medium">Realisasi Aktual (ACWP)</div>
            <div className="text-lg font-bold text-cyan-700 mt-1">{formatRupiah(totalActual)}</div>
            <div className="text-[11px] text-cyan-600 mt-0.5">{pctConsumed}% terserap</div>
          </div>
          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
            <div className="text-xs text-emerald-800 font-medium">Sisa Pagu Tersedia</div>
            <div className="text-lg font-bold text-emerald-700 mt-1">{formatRupiah(remainingBudget)}</div>
            <div className="text-[11px] text-emerald-600 mt-0.5">{(100 - parseFloat(pctConsumed)).toFixed(1)}% belum terpakai</div>
          </div>
        </div>

        {/* WBS Breakdown Table */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Distribusi Alokasi Biaya per Paket Pekerjaan (WBS)
            </h4>
            <span className="text-xs text-slate-500">Mata Uang: Rupiah (IDR)</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Kode &amp; Nama Paket WBS</th>
                  <th className="py-2.5 px-3 text-right">Alokasi RAB</th>
                  <th className="py-2.5 px-3 text-right">Komitmen SPK</th>
                  <th className="py-2.5 px-3 text-right">Realisasi (Actual)</th>
                  <th className="py-2.5 px-3 text-right">Sisa Pagu</th>
                  <th className="py-2.5 px-3 text-center">Progress Serapan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wbsBudgets.map((item) => {
                  const sisa = item.budget - item.actual;
                  return (
                    <tr key={item.code} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-indigo-700 mr-2">WBS {item.code}</span>
                        <span className="font-semibold text-slate-800">{item.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-900">
                        {formatCompactRupiah(item.budget)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-amber-700">
                        {formatCompactRupiah(item.committed)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-cyan-700">
                        {formatCompactRupiah(item.actual)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-emerald-700">
                        {formatCompactRupiah(sisa)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${item.pct > 90 ? 'bg-amber-500' : 'bg-indigo-600'}`} 
                              style={{ width: `${Math.min(item.pct, 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 w-9 text-right">{item.pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Anggaran dikendalikan oleh Approval Matrix Direksi (Aturan APV-R4 &gt; Rp 20 Jt).</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            {onNavigateToCostCodes && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToCostCodes();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span>Lihat Detail Cost Code (WBS)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
