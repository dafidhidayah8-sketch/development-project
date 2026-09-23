import React from 'react';
import { X, Sparkles, TrendingUp, CheckCircle2, ChevronRight, Calculator, ShieldCheck, AlertCircle } from 'lucide-react';
import { Project } from '../../types';
import { formatCompactRupiah, formatRupiah } from '../../utils/formatters';

interface ForecastEACModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const ForecastEACModal: React.FC<ForecastEACModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  if (!isOpen) return null;

  const bac = project.budgetRAB; // Rp 7.2 M
  const actualCost = project.actualCost; // Rp 4.14 M
  const progressPlanned = project.plannedProgress; // 62%
  const progressActual = project.actualProgress; // 57.5%
  
  // Earned Value Management (EVM) metrics
  const bcws = (bac * progressPlanned) / 100; // Rp 4.464 M
  const bcwp = (bac * progressActual) / 100;  // Rp 4.140 M
  const acwp = actualCost;                   // Rp 4.140 M
  
  const cpi = acwp > 0 ? (bcwp / acwp) : 1.0; // 1.0x (cost efficient)
  const spi = bcws > 0 ? (bcwp / bcws) : 1.0; // 0.93x (slight lag in schedule)
  
  const forecastEAC = project.forecastEAC; // Rp 6.9 M
  const costVariance = bac - forecastEAC;  // Rp 300 Jt saving
  const etc = forecastEAC - acwp;          // Estimate to complete

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600/30 rounded-xl border border-purple-400/30">
              <Calculator className="w-5 h-5 text-purple-300" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-purple-300 block">
                Level 1 • Earned Value Management (EVM)
              </span>
              <h3 className="text-lg font-bold text-white">
                Analisa Forecast Biaya Akhir Proyek (EAC / Estimate At Completion)
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

        {/* 4 Metric Cards */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-white rounded-xl border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">Budget Asli (BAC)</div>
            <div className="text-base font-bold text-slate-900 mt-1">{formatCompactRupiah(bac)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Pagu Kontrak Awal</div>
          </div>

          <div className="p-3.5 bg-purple-50/70 rounded-xl border border-purple-200">
            <div className="text-xs text-purple-800 font-medium">Proyeksi Akhir (EAC)</div>
            <div className="text-base font-bold text-purple-700 mt-1">{formatCompactRupiah(forecastEAC)}</div>
            <div className="text-[11px] text-purple-600 mt-0.5">Biaya rampung total</div>
          </div>

          <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
            <div className="text-xs text-emerald-800 font-medium">Proyeksi Efisiensi (VAC)</div>
            <div className="text-base font-bold text-emerald-700 mt-1">+{formatCompactRupiah(costVariance)}</div>
            <div className="text-[11px] text-emerald-600 mt-0.5">Hemat 4.2% dari pagu</div>
          </div>

          <div className="p-3.5 bg-cyan-50/70 rounded-xl border border-cyan-200">
            <div className="text-xs text-cyan-800 font-medium">Estimate to Complete (ETC)</div>
            <div className="text-base font-bold text-cyan-700 mt-1">{formatCompactRupiah(etc)}</div>
            <div className="text-[11px] text-cyan-600 mt-0.5">Kas tersisa yang dibutuhkan</div>
          </div>
        </div>

        {/* Formula & Method explanation */}
        <div className="p-6 space-y-4 text-xs">
          <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 space-y-2 text-indigo-950">
            <div className="flex items-center gap-2 font-bold text-indigo-900 text-sm">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Metodologi Standar Industri Pengembang Properti (EVM Formula):</span>
            </div>
            <div className="font-mono bg-white p-2.5 rounded-lg border border-indigo-200 text-indigo-800 text-[11px]">
              EAC = Actual Cost (ACWP) + [ (Budget BAC - Earned Value BCWP) / CPI ]
            </div>
            <p className="text-[11px] text-indigo-900 leading-relaxed">
              Dengan nilai <strong>CPI 1.04x</strong> (Realisasi lebih hemat dibandingkan target volume fisik terpasang), proyek diproyeksikan 
              selesai dengan total biaya <strong>Rp 6,90 Miliar</strong>, memberikan penghematan marjin bruto sebesar <strong>Rp 300 Juta</strong> bagi pengembang.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800">Cost Performance Index (CPI)</span>
                <span className="px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800">1.04x</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Nilai &gt; 1.00 menandakan efisiensi biaya. Kontraktor dan supplier material bekerja sesuai pagu satuan tanpa pembengkakan harga.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-800">Schedule Performance Index (SPI)</span>
                <span className="px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800">0.93x</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Nilai &lt; 1.00 menandakan keterlambatan durasi pekerjaan (-4.5% dari kurva S rencana). Direkomendasikan percepatan tenaga kerja finishing.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Target Serah Terima Kunci (BAST): <strong>15 Desember 2026</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
