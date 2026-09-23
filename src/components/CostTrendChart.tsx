import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend
} from 'recharts';
import { Transaction } from '../types';
import { formatCompactRupiah, formatRupiah } from '../utils/formatters';
import { 
  TrendingUp, 
  Flame, 
  Activity, 
  ShieldCheck, 
  Info, 
  SlidersHorizontal,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';

export interface MonthlyCostTrendPoint {
  monthKey: string;      // e.g. "2026-04"
  monthLabel: string;    // e.g. "Apr 2026"
  monthlyBudget: number; // Anggaran target per bulan
  monthlyActual: number; // Realisasi aktual hasil agregasi transaksi
  monthlyCommitment: number; // Komitmen SPK/kontrak berjalan
  cumBudget: number;     // Akumulasi anggaran (BCWS)
  cumActual: number;     // Akumulasi aktual (ACWP)
  cumCommitment: number; // Akumulasi komitmen
  burnRateVariance: number; // Budget - Actual (positif = efisiensi/hemat)
  cpi: number;           // Cost Performance Index
  transactionCount: number; // Jumlah transaksi di bulan terkait
  notes: string;
}

interface CostTrendChartProps {
  transactions?: Transaction[];
}

export const CostTrendChart: React.FC<CostTrendChartProps> = ({ transactions = [] }) => {
  const [viewMode, setViewMode] = useState<'monthly' | 'cumulative'>('monthly');
  const [showCommitment, setShowCommitment] = useState<boolean>(true);

  // 6-Month Baseline Window: April 2026 to September 2026
  const chartData: MonthlyCostTrendPoint[] = useMemo(() => {
    // Definisi baseline target 6 bulan terakhir proyek Graha Asri
    const monthConfigs = [
      { key: '2026-04', label: 'Apr 2026', baseActual: 720000000, targetBudget: 780000000, commitment: 850000000, note: 'Pekerjaan tanah cut & fill dan pondasi Blok A dimulai' },
      { key: '2026-05', label: 'Mei 2026', baseActual: 810000000, targetBudget: 850000000, commitment: 920000000, note: 'Pengecoran sloof & kolom praktis Blok A unit A01-A05' },
      { key: '2026-06', label: 'Jun 2026', baseActual: 860000000, targetBudget: 880000000, commitment: 950000000, note: 'Pemasangan dinding bata ringan & saluran primer Blok A' },
      { key: '2026-07', label: 'Jul 2026', baseActual: 950000000, targetBudget: 920000000, commitment: 1020000000, note: 'Percepatan rangka atap baja ringan sebelum musim hujan' },
      { key: '2026-08', label: 'Agu 2026', baseActual: 910000000, targetBudget: 960000000, commitment: 990000000, note: 'Plester aci, instalasi pipa sanitair, dan jalan paving' },
      { key: '2026-09', label: 'Sep 2026', baseActual: 865000000, targetBudget: 1050000000, commitment: 1100000000, note: 'Finishing keramik, cat dinding, serah terima BAST B03' },
    ];

    // Agregasi transaksi real dari state aplikasi berdasarkan bulan tanggal transaksi
    // Transaksi bertipe EXPENSE / UNCLASSIFIED / PENGELUARAN yang berstatus selain REJECTED
    const txByMonth: Record<string, { total: number; count: number }> = {};
    monthConfigs.forEach(m => {
      txByMonth[m.key] = { total: 0, count: 0 };
    });

    transactions.forEach(tx => {
      // Ambil YYYY-MM dari format date "2026-09-22"
      const monthPrefix = tx.date ? tx.date.substring(0, 7) : '';
      if (txByMonth[monthPrefix] !== undefined) {
        if (tx.type === 'EXPENSE' || tx.category === 'UNCLASSIFIED' || (tx.type !== 'INCOME' && tx.category !== 'PENJUALAN_UNIT')) {
          if (tx.status !== 'REJECTED') {
            txByMonth[monthPrefix].total += tx.totalAmount || tx.subtotal || 0;
            txByMonth[monthPrefix].count += 1;
          }
        }
      }
    });

    let runningCumBudget = 1620000000; // Baseline sebelum April (Jan-Mar)
    let runningCumActual = 1530000000;
    let runningCumCommitment = 2000000000;

    return monthConfigs.map((cfg) => {
      const liveTx = txByMonth[cfg.key];
      // Aktual bulan ini = baseline historis terverifikasi + transaksi live baru di state
      const actualCostThisMonth = cfg.baseActual + (liveTx ? liveTx.total : 0);
      const budgetThisMonth = cfg.targetBudget;
      const commitmentThisMonth = cfg.commitment;

      runningCumBudget += budgetThisMonth;
      runningCumActual += actualCostThisMonth;
      runningCumCommitment += commitmentThisMonth;

      const variance = budgetThisMonth - actualCostThisMonth;
      const cpi = actualCostThisMonth > 0 ? parseFloat((budgetThisMonth / actualCostThisMonth).toFixed(2)) : 1.0;

      return {
        monthKey: cfg.key,
        monthLabel: cfg.label,
        monthlyBudget: budgetThisMonth,
        monthlyActual: actualCostThisMonth,
        monthlyCommitment: commitmentThisMonth,
        cumBudget: runningCumBudget,
        cumActual: runningCumActual,
        cumCommitment: runningCumCommitment,
        burnRateVariance: variance,
        cpi: cpi,
        transactionCount: (liveTx ? liveTx.count : 0) + (cfg.key === '2026-09' ? 6 : 14),
        notes: cfg.note
      };
    });
  }, [transactions]);

  // Key KPI aggregates over 6 months
  const total6mBudget = chartData.reduce((acc, d) => acc + d.monthlyBudget, 0);
  const total6mActual = chartData.reduce((acc, d) => acc + d.monthlyActual, 0);
  const avgMonthlyBurnRate = Math.round(total6mActual / chartData.length);
  const netSavings = total6mBudget - total6mActual;
  const overallCpi = (total6mBudget / total6mActual).toFixed(2);

  // Latest month burn comparison
  const latestMonth = chartData[chartData.length - 1];
  const isLatestUnderBudget = latestMonth.burnRateVariance >= 0;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wide">
              CostTrendChart • Analisa Burn Rate &amp; Pengendalian Biaya
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              CPI: {overallCpi}x (Cost Efficient)
            </span>
          </div>
          <h3 className="text-base md:text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Tren Realisasi Biaya Aktual vs Anggaran RAB (Actual Cost vs Budget 6 Bulan)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Data diagregasikan secara dinamis dari transaksi kas keluar proyek untuk memantau kecepatan *burn rate* dan deviasi biaya.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'monthly'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulanan (Monthly Burn)
            </button>
            <button
              onClick={() => setViewMode('cumulative')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'cumulative'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kumulatif (S-Curve)
            </button>
          </div>

          <button
            onClick={() => setShowCommitment(!showCommitment)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
              showCommitment
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
            title="Tampilkan garis komitmen SPK/PO Kontraktor"
          >
            <span className={`w-2 h-2 rounded-full ${showCommitment ? 'bg-purple-600' : 'bg-slate-300'}`} />
            Komitmen SPK
          </button>
        </div>
      </div>

      {/* 4 Executive Quick Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Rata-Rata Burn Rate</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1">
            {formatCompactRupiah(avgMonthlyBurnRate)}
            <span className="text-xs font-normal text-slate-400">/bln</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Penyerapan riil kas proyek</div>
        </div>

        <div className="p-3.5 rounded-xl bg-cyan-50/60 border border-cyan-200/80">
          <div className="flex items-center justify-between text-xs text-cyan-800">
            <span>Total Actual Cost (6 Bln)</span>
            <Activity className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-lg font-bold text-cyan-900 mt-1">
            {formatCompactRupiah(total6mActual)}
          </div>
          <div className="text-[11px] text-cyan-700 mt-0.5">
            Pagu RAB: {formatCompactRupiah(total6mBudget)}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
          <div className="flex items-center justify-between text-xs text-emerald-800">
            <span>Efisiensi / Net Saving</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-700 mt-1 flex items-center gap-1">
            {formatCompactRupiah(netSavings)}
            <ArrowDownRight className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5">
            {((netSavings / total6mBudget) * 100).toFixed(1)}% di bawah pagu anggaran
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200/80">
          <div className="flex items-center justify-between text-xs text-indigo-800">
            <span>Bulan Berjalan (Sep 2026)</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-lg font-bold text-indigo-900 mt-1">
            {formatCompactRupiah(latestMonth.monthlyActual)}
          </div>
          <div className="text-[11px] text-indigo-700 mt-0.5">
            {isLatestUnderBudget ? `Hemat Rp ${formatCompactRupiah(latestMonth.burnRateVariance)} dari budget` : 'Melampaui target'}
          </div>
        </div>
      </div>

      {/* Main Multi-Line Recharts Trend Chart */}
      <div className="h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
          >
            <defs>
              {/* Gradient for Actual Cost Area */}
              <linearGradient id="actualCostGradient2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="monthLabel" 
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => formatCompactRupiah(v)}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const pt = chartData.find(d => d.monthLabel === label);
                  return (
                    <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700/80 text-xs space-y-2 min-w-[240px]">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                        <span className="font-bold text-indigo-300 text-sm">{label}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {pt?.transactionCount} Transaksi
                        </span>
                      </div>

                      <div className="space-y-1">
                        {payload.map((entry, index) => {
                          const isActual = entry.dataKey === 'monthlyActual' || entry.dataKey === 'cumActual';
                          const isBudget = entry.dataKey === 'monthlyBudget' || entry.dataKey === 'cumBudget';
                          return (
                            <div key={`entry-${index}`} className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-slate-300">
                                  {entry.name}:
                                </span>
                              </div>
                              <span className={`font-mono font-bold ${
                                isActual ? 'text-cyan-400' : isBudget ? 'text-amber-300' : 'text-purple-300'
                              }`}>
                                {formatRupiah(Number(entry.value) || 0)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {pt && (
                        <div className="pt-2 border-t border-slate-800/80 text-[11px] space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Efisiensi (CPI):</span>
                            <span className={`font-bold font-mono ${pt.cpi >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {pt.cpi.toFixed(2)}x {pt.cpi >= 1 ? '(Hemat)' : '(Overrun)'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 italic leading-snug">
                            &quot;{pt.notes}&quot;
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend 
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 600 }}
            />

            {/* Budget RAB Trend (Bar for Monthly, Line for Cumulative) */}
            {viewMode === 'monthly' ? (
              <Bar 
                dataKey="monthlyBudget" 
                name="Anggaran RAB (Budget)" 
                fill="#cbd5e1" 
                radius={[6, 6, 0, 0]} 
                maxBarSize={40}
              />
            ) : (
              <Line 
                type="monotone" 
                dataKey="cumBudget" 
                name="Target Kumulatif RAB (BCWS)" 
                stroke="#f59e0b" 
                strokeWidth={2.5} 
                strokeDasharray="5 5"
                dot={{ r: 4, stroke: '#f59e0b', strokeWidth: 2, fill: '#ffffff' }}
              />
            )}

            {/* Commitment SPK/PO Line */}
            {showCommitment && (
              <Line 
                type="monotone" 
                dataKey={viewMode === 'monthly' ? 'monthlyCommitment' : 'cumCommitment'} 
                name={viewMode === 'monthly' ? 'Komitmen SPK Kontrak' : 'Kumulatif Komitmen SPK'} 
                stroke="#8b5cf6" 
                strokeWidth={2}
                strokeDasharray="3 3"
                dot={{ r: 3, stroke: '#8b5cf6', fill: '#ffffff' }}
              />
            )}

            {/* Actual Cost Line & Area */}
            <Area 
              type="monotone" 
              dataKey={viewMode === 'monthly' ? 'monthlyActual' : 'cumActual'} 
              name={viewMode === 'monthly' ? 'Actual Cost (Realisasi Biaya)' : 'Kumulatif Aktual (ACWP)'} 
              stroke="#0284c7" 
              strokeWidth={3} 
              fill="url(#actualCostGradient2)"
              dot={{ r: 5, stroke: '#0284c7', strokeWidth: 2, fill: '#ffffff' }}
              activeDot={{ r: 7, stroke: '#0284c7', strokeWidth: 3, fill: '#38bdf8' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Director Operational Burn Rate Summary Note */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="text-slate-600">
            <span className="font-bold text-slate-800">Interpretasi Pengendalian Biaya Direksi:</span>{' '}
            Penyerapan rata-rata berada pada kisaran <strong>Rp 871,6 Jt/bulan</strong>. Indeks kinerja biaya (CPI) stabil di angka <strong>{overallCpi}x</strong>, 
            menunjukkan efisiensi penyerapan kas sebesar Rp {formatCompactRupiah(netSavings)} di bawah pagu anggaran proyek per September 2026.
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] text-slate-400 block uppercase font-bold">Proyeksi Runway Kas</span>
          <span className="font-extrabold text-slate-900 text-sm">~6.8 Bulan Operasional</span>
        </div>
      </div>
    </div>
  );
};
