import React from 'react';
import { X, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, HardHat, Calendar } from 'lucide-react';
import { Project } from '../../types';
import { formatCompactRupiah, formatRupiah } from '../../utils/formatters';

interface WBSProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onNavigateToWBSCost?: () => void;
}

export const WBSProgressModal: React.FC<WBSProgressModalProps> = ({
  isOpen,
  onClose,
  project,
  onNavigateToWBSCost
}) => {
  if (!isOpen) return null;

  const planned = project.plannedProgress; // 62%
  const actual = project.actualProgress;   // 57.5%
  const variance = actual - planned;       // -4.5%

  // 5 Operational Construction WBS Packages (as requested in Issue 9)
  const wbsStages = [
    {
      wbsCode: '01-03',
      name: 'Land Development & Pematangan Lahan',
      budget: 1950000000,
      actual: 1880000000,
      plannedProgress: 100,
      actualProgress: 100,
      variance: 0,
      status: 'SELESAI (100%)',
      notes: 'Pembersihan lahan, cut & fill Blok A dan Blok B selesai 100%.'
    },
    {
      wbsCode: '04',
      name: 'Infrastructure, Saluran & Jalan Kawasan',
      budget: 800000000,
      actual: 550000000,
      plannedProgress: 78,
      actualProgress: 72,
      variance: -6,
      status: 'AT RISK (-6%)',
      notes: 'Pemasangan paving block tertunda 3 hari akibat curah hujan tinggi.'
    },
    {
      wbsCode: '05-A',
      name: 'House Construction (Struktur Beton Blok A)',
      budget: 2800000000,
      actual: 1250000000,
      plannedProgress: 52,
      actualProgress: 48,
      variance: -4,
      status: 'AT RISK (-4%)',
      notes: 'Unit A01-A05 sloof & kolom praktis selesai, proses pasang bata.'
    },
    {
      wbsCode: '05-B',
      name: 'Utility, Sanitasi & MEP Lingkungan',
      budget: 750000000,
      actual: 480000000,
      plannedProgress: 60,
      actualProgress: 55,
      variance: -5,
      status: 'AT RISK (-5%)',
      notes: 'Jaringan pipa air bersih PDAM terpasang, sambungan PLN on progress.'
    },
    {
      wbsCode: '06',
      name: 'Finishing, Pengecatan & Fasilitas Gate',
      budget: 850000000,
      actual: 260000000,
      plannedProgress: 38,
      actualProgress: 32,
      variance: -6,
      status: 'AT RISK (-6%)',
      notes: 'Pemasangan keramik teras & kusen aluminium unit contoh.'
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 rounded-xl border border-blue-400/30">
              <TrendingUp className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-300 block">
                Level 2 &amp; Level 3 • Kontrol Fisik &amp; Kurva S
              </span>
              <h3 className="text-lg font-bold text-white">
                Rincian Kurva S &amp; Progress Fisik per WBS: {project.name}
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

        {/* 4 Summary Cards */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3.5 bg-white rounded-xl border border-slate-200">
            <div className="text-xs text-slate-500 font-medium">Progress Planned</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{planned}%</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Target Baseline Kurva S</div>
          </div>

          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200">
            <div className="text-xs text-blue-800 font-medium">Progress Actual</div>
            <div className="text-2xl font-black text-blue-700 mt-1">{actual}%</div>
            <div className="text-[11px] text-blue-600 mt-0.5">Opname Fisik Lapangan</div>
          </div>

          <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200">
            <div className="text-xs text-amber-800 font-medium">Variance (Deviasi)</div>
            <div className="text-2xl font-black text-amber-700 mt-1">{variance.toFixed(1)}%</div>
            <div className="text-[11px] text-amber-600 mt-0.5">Keterlambatan Waktu</div>
          </div>

          <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200">
            <div className="text-xs text-rose-800 font-medium">Status Risiko</div>
            <div className="text-lg font-black text-rose-700 mt-1.5 uppercase">AT RISK</div>
            <div className="text-[11px] text-rose-600 mt-0.5">Perlu mitigasi percepatan</div>
          </div>
        </div>

        {/* Detailed Table of 5 WBS Stages */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Evaluasi Progress &amp; Penyerapan Biaya per Tahapan WBS
            </h4>
            <span className="text-xs text-slate-500">Standar Pengendalian Project Manager</span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">WBS &amp; Tahapan</th>
                  <th className="py-2.5 px-3 text-right">Budget (RAB)</th>
                  <th className="py-2.5 px-3 text-right">Actual Cost</th>
                  <th className="py-2.5 px-3 text-center">Plan %</th>
                  <th className="py-2.5 px-3 text-center">Actual %</th>
                  <th className="py-2.5 px-3 text-center">Variance</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {wbsStages.map((stage) => {
                  const isNegative = stage.variance < 0;
                  return (
                    <tr key={stage.wbsCode} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{stage.name}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{stage.notes}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-700">
                        {formatCompactRupiah(stage.budget)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatCompactRupiah(stage.actual)}
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-slate-600">
                        {stage.plannedProgress}%
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-blue-700">
                        {stage.actualProgress}%
                      </td>
                      <td className={`py-3 px-3 text-center font-bold ${isNegative ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {stage.variance > 0 ? `+${stage.variance}%` : `${stage.variance}%`}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          stage.actualProgress === 100 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {stage.status}
                        </span>
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
            <HardHat className="w-4 h-4 text-blue-600" />
            <span>Opname fisik diinput mingguan oleh Site Engineer &amp; diverifikasi Project Manager.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            {onNavigateToWBSCost && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToWBSCost();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <span>Buka Cost Code &amp; WBS Ledger</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
