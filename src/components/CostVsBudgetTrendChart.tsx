import React, { useState } from 'react';
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
  Legend,
  ReferenceLine
} from 'recharts';
import { formatCompactRupiah, formatRupiah } from '../utils/formatters';
import { 
  TrendingUp, 
  Flame, 
  Activity, 
  ShieldCheck, 
  Info, 
  SlidersHorizontal,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface MonthlyBurnData {
  monthKey: string;
  monthLabel: string;
  monthlyBudget: number;
  monthlyActual: number;
  monthlyCommitment: number;
  cumBudget: number;
  cumActual: number;
  cumCommitment: number;
  burnRateVariance: number; // positive means under budget (savings)
  cpi: number; // Cost Performance Index (Budget / Actual)
  activeUnits: number;
  notes: string;
}

const SIX_MONTH_TREND_DATA: MonthlyBurnData[] = [
  {
    monthKey: '2026-04',
    monthLabel: 'Apr 2026',
    monthlyBudget: 780000000,
    monthlyActual: 720000000,
    monthlyCommitment: 850000000,
    cumBudget: 2400000000,
    cumActual: 2250000000,
    cumCommitment: 2850000000,
    burnRateVariance: 60000000,
    cpi: 1.08,
    activeUnits: 8,
    notes: 'Pekerjaan tanah cut & fill dan pondasi Blok A dimulai'
  },
  {
    monthKey: '2026-05',
    monthLabel: 'Mei 2026',
    monthlyBudget: 850000000,
    monthlyActual: 810000000,
    monthlyCommitment: 920000000,
    cumBudget: 3250000000,
    cumActual: 3060000000,
    cumCommitment: 3770000000,
    burnRateVariance: 40000000,
    cpi: 1.05,
    activeUnits: 12,
    notes: 'Pengecoran sloof & kolom praktis Blok A unit A01-A05'
  },
  {
    monthKey: '2026-06',
    monthLabel: 'Jun 2026',
    monthlyBudget: 880000000,
    monthlyActual: 860000000,
    monthlyCommitment: 950000000,
    cumBudget: 4130000000,
    cumActual: 3920000000,
    cumCommitment: 4720000000,
    burnRateVariance: 20000000,
    cpi: 1.02,
    activeUnits: 15,
    notes: 'Pemasangan dinding bata ringan & saluran primer Blok A'
  },
  {
    monthKey: '2026-07',
    monthLabel: 'Jul 2026',
    monthlyBudget: 920000000,
    monthlyActual: 950000000,
    monthlyCommitment: 1020000000,
    cumBudget: 5050000000,
    cumActual: 4870000000,
    cumCommitment: 5740000000,
    burnRateVariance: -30000000,
    cpi: 0.97,
    activeUnits: 18,
    notes: 'Percepatan rangka atap baja ringan sebelum musim hujan'
  },
  {
    monthKey: '2026-08',
    monthLabel: 'Agu 2026',
    monthlyBudget: 960000000,
    monthlyActual: 910000000,
    monthlyCommitment: 990000000,
    cumBudget: 6010000000,
    cumActual: 5780000000,
    cumCommitment: 6730000000,
    burnRateVariance: 50000000,
    cpi: 1.05,
    activeUnits: 20,
    notes: 'Plester aci, instalasi pipa sanitair, dan jalan paving'
  },
  {
    monthKey: '2026-09',
    monthLabel: 'Sep 2026',
    monthlyBudget: 1050000000,
    monthlyActual: 980000000,
    monthlyCommitment: 1100000000,
    cumBudget: 7060000000,
    cumActual: 6760000000,
    cumCommitment: 7830000000,
    burnRateVariance: 70000000,
    cpi: 1.07,
    activeUnits: 22,
    notes: 'Finishing keramik, pengecatan dinding, serah terima BAST B03'
  }
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  viewMode: 'monthly' | 'cumulative';
}

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, viewMode }) => {
  if (active && payload && payload.length) {
    const itemData = SIX_MONTH_TREND_DATA.find(d => d.monthLabel === label);
    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700/80 text-xs space-y-2 min-w-[240px]">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
          <span className="font-bold text-indigo-300 text-sm">{label}</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
            {itemData?.activeUnits} Unit Aktif
          </span>
        </div>

        <div className="space-y-1">
          {payload.map((entry, index) => {
            const isActual = entry.dataKey === 'monthlyActual' || entry.dataKey === 'cumActual';
            const isBudget = entry.dataKey === 'monthlyBudget' || entry.dataKey === 'cumBudget';
            const isCommitment = entry.dataKey === 'monthlyCommitment' || entry.dataKey === 'cumCommitment';

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
                  {formatRupiah(entry.value)}
                </span>
              </div>
            );
          })}
        </div>

        {itemData && (
          <div className="pt-2 border-t border-slate-800/80 text-[11px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Efisiensi (CPI):</span>
              <span className={`font-bold font-mono ${itemData.cpi >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {itemData.cpi.toFixed(2)}x {itemData.cpi >= 1 ? '(Hemat)' : '(Overrun)'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 italic leading-snug">
              &quot;{itemData.notes}&quot;
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const CostVsBudgetTrendChart: React.FC = () => {
  const [viewMode, setViewMode] = useState<'monthly' | 'cumulative'>('monthly');
  const [showCommitment, setShowCommitment] = useState<boolean>(true);

  // Key KPI aggregates over 6 months
  const total6mBudget = SIX_MONTH_TREND_DATA.reduce((acc, d) => acc + d.monthlyBudget, 0);
  const total6mActual = SIX_MONTH_TREND_DATA.reduce((acc, d) => acc + d.monthlyActual, 0);
  const total6mCommitment = SIX_MONTH_TREND_DATA.reduce((acc, d) => acc + d.monthlyCommitment, 0);
  const avgMonthlyBurnRate = Math.round(total6mActual / SIX_MONTH_TREND_DATA.length);
  const netSavings = total6mBudget - total6mActual;
  const overallCpi = (total6mBudget / total6mActual).toFixed(2);

  // Latest month burn comparison
  const latestMonth = SIX_MONTH_TREND_DATA[SIX_MONTH_TREND_DATA.length - 1];
  const isLatestUnderBudget = latestMonth.burnRateVariance >= 0;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase tracking-wide">
              Analisa Burn Rate &amp; Pengendalian Biaya
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              CPI: {overallCpi}x (Cost Efficient)
            </span>
          </div>
          <h3 className="text-base md:text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Tren Realisasi Biaya Aktual vs Anggaran RAB (6 Bulan Terakhir)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualisasi kecepatan penyerapan anggaran proyek (*burn rate*) dan varians biaya konstruksi periode April – September 2026.
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
            title="Tampilkan garis komitmen SPK/PO"
          >
            <span className={`w-2 h-2 rounded-full ${showCommitment ? 'bg-purple-600' : 'bg-slate-300'}`} />
            Komitmen SPK
          </button>
        </div>
      </div>

      {/* 4 Director Quick Indicator Stat Cards */}
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
            4.2% di bawah pagu anggaran
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200/80">
          <div className="flex items-center justify-between text-xs text-indigo-800">
            <span>Bulan Ini (Sep 2026)</span>
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

      {/* Main Recharts Area */}
      <div className="h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={SIX_MONTH_TREND_DATA}
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
          >
            <defs>
              {/* Gradient for Actual Cost Area */}
              <linearGradient id="actualCostGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
              {/* Gradient for Budget Area */}
              <linearGradient id="budgetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
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
            <Tooltip content={<CustomChartTooltip viewMode={viewMode} />} />
            <Legend 
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 600 }}
            />

            {/* Budget RAB Trend Line / Bar */}
            {viewMode === 'monthly' ? (
              <Bar 
                dataKey="monthlyBudget" 
                name="Anggaran RAB Bulanan" 
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

            {/* Actual Cost Area & Line (Highlight Primary) */}
            <Area 
              type="monotone" 
              dataKey={viewMode === 'monthly' ? 'monthlyActual' : 'cumActual'} 
              name={viewMode === 'monthly' ? 'Realisasi Biaya Aktual' : 'Kumulatif Aktual (ACWP)'} 
              stroke="#0284c7" 
              strokeWidth={3} 
              fill="url(#actualCostGradient)"
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
            <span className="font-bold text-slate-800">Interpretasi Burn Rate untuk Direksi:</span>{' '}
            Laju pengeluaran rata-rata <strong>Rp 871,6 Jt/bulan</strong> sejalan dengan target penyelesaian fisik 22 unit di Blok A &amp; B. 
            Indeks CPI stabil di angka <strong>1.04x</strong>, mengindikasikan bahwa setiap Rp 1.000 yang dibelanjakan menghasilkan nilai fisik pekerjaan senilai Rp 1.040 (efisiensi material &amp; negosiasi borongan mandor).
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
