import React, { useState } from 'react';
import { 
  Project, 
  BankAccount, 
  Transaction, 
  ControlCheckItem, 
  UserRole,
  AgingItem
} from '../types';
import { 
  formatRupiah, 
  formatCompactRupiah, 
  formatDateIndo 
} from '../utils/formatters';
import { APARAgingView } from './APARAgingView';
import { CostTrendChart } from './CostTrendChart';
import { BudgetControlModal } from './modals/BudgetControlModal';
import { CashBreakdownModal } from './modals/CashBreakdownModal';
import { ForecastEACModal } from './modals/ForecastEACModal';
import { WBSProgressModal } from './modals/WBSProgressModal';
import { ControlExceptionModal } from './modals/ControlExceptionModal';
import { BankReconciliationModal } from './modals/BankReconciliationModal';
import { 
  Building2, 
  Wallet, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  ShieldAlert, 
  FileText, 
  PlusCircle, 
  ChevronRight,
  Eye,
  Filter,
  DollarSign,
  Layers,
  Sparkles,
  CalendarClock
} from 'lucide-react';

interface ExecutiveDashboardProps {
  project: Project;
  bankAccounts: BankAccount[];
  transactions: Transaction[];
  controlChecks: ControlCheckItem[];
  agingItems?: AgingItem[];
  activeRole: UserRole;
  onOpenOperatorInput: () => void;
  onOpenApprovals: () => void;
  onNavigateToTab: (tab: string) => void;
  onSelectTransactionForReview?: (tx: Transaction) => void;
  onResolveException?: (txId: string, newCostCode: string, newCategory: any, note: string) => void;
  onPostBankReconciliation?: (accountId: string, adjustedBalance: number, causeDescription: string) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  project,
  bankAccounts,
  transactions,
  controlChecks,
  agingItems = [],
  activeRole,
  onOpenOperatorInput,
  onOpenApprovals,
  onNavigateToTab,
  onSelectTransactionForReview,
  onResolveException,
  onPostBankReconciliation
}) => {
  const [selectedBlockFilter, setSelectedBlockFilter] = useState<string>('ALL');

  // Interactive Level 1 & Level 2 Drilldown Modal States
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState<boolean>(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState<boolean>(false);
  const [isForecastModalOpen, setIsForecastModalOpen] = useState<boolean>(false);
  const [isWBSProgressModalOpen, setIsWBSProgressModalOpen] = useState<boolean>(false);
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState<boolean>(false);
  const [isBankReconModalOpen, setIsBankReconModalOpen] = useState<boolean>(false);

  // Calculations
  const totalCash = bankAccounts.reduce((acc, curr) => acc + curr.currentBalance, 0);
  const availableCash = bankAccounts
    .filter(account => !account.name.toLowerCase().includes('escrow') && !account.name.toLowerCase().includes('kpr'))
    .reduce((acc, curr) => acc + curr.currentBalance, 0);
  const minCashBuffer = 100000000; // Rp 100 Juta minimum safety liquidity buffer
  const isLiquidityWarning = totalCash < minCashBuffer;

  // Unclassified / Pending Items
  const unclassifiedTx = transactions.filter(t => t.category === 'UNCLASSIFIED' || t.costCode === 'UNC-999');
  const unclassifiedTotal = unclassifiedTx.reduce((acc, t) => acc + t.totalAmount, 0);

  const pendingApprovals = transactions.filter(t => t.status === 'SUBMITTED' || t.status === 'VERIFIED');
  const pendingApprovalsTotal = pendingApprovals.reduce((acc, t) => acc + t.totalAmount, 0);

  // Dynamic AP (Hutang Usaha) & AR (Piutang Konsumen) from agingItems
  const totalAP = agingItems
    .filter(i => i.type === 'AP')
    .reduce((acc, i) => acc + i.outstandingBalance, 0);
  const apDueSoon = agingItems
    .filter(i => i.type === 'AP' && i.daysPastDue <= 7 && i.daysPastDue >= -7)
    .reduce((acc, i) => acc + i.outstandingBalance, 0);
  const apOverdue = agingItems
    .filter(i => i.type === 'AP' && i.daysPastDue > 0)
    .reduce((acc, i) => acc + i.outstandingBalance, 0);

  const totalAR = agingItems
    .filter(i => i.type === 'AR')
    .reduce((acc, i) => acc + i.outstandingBalance, 0);
  const arDueSoon = agingItems
    .filter(i => i.type === 'AR' && i.daysPastDue <= 7 && i.daysPastDue >= -7)
    .reduce((acc, i) => acc + i.outstandingBalance, 0);
  const arOverdue = agingItems
    .filter(i => i.type === 'AR' && i.daysPastDue > 0)
    .reduce((acc, i) => acc + i.outstandingBalance, 0);

  // Units count
  const unitsSold = project.units.filter(u => u.status === 'SOLD' || u.status === 'HANDED_OVER').length;
  const unitsBooked = project.units.filter(u => u.status === 'BOOKED').length;
  const unitsConstruction = project.units.filter(u => u.status === 'CONSTRUCTION').length;
  const unitsAvailable = project.units.filter(u => u.status === 'AVAILABLE').length;
  const unitsReady = project.units.filter(u => u.status === 'READY').length;

  // Financial Control Metrics
  const budgetRAB = project.budgetRAB;
  const committed = project.committedCost;
  const actualCost = project.actualCost;
  const forecastEAC = project.forecastEAC;
  const costVariance = budgetRAB - forecastEAC; // Positive means saving!
  const progressVariance = project.actualProgress - project.plannedProgress; // e.g. -4.5%

  return (
    <div className="space-y-6">
      {/* Top Banner / Project Headline */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PROYEK AKTIF BERJALAN
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                KODE: {project.code}
              </span>
              <span className="text-xs text-slate-400">
                Target Selesai: {formatDateIndo(project.targetEndDate)}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Building2 className="w-8 h-8 text-indigo-400 shrink-0" />
              {project.name}
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              {project.location} • Luas Lahan: {(project.totalLandArea / 10000).toFixed(1)} Ha • Total: {project.targetUnits} Unit Hunian
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                const el = document.getElementById('recent-transactions-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-white font-semibold rounded-xl text-sm transition-all border border-slate-700/80 shadow-md cursor-pointer active:scale-95"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Lihat Aktivitas Hari Ini</span>
            </button>
            <button
              onClick={onOpenApprovals}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-indigo-900/30 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approval Center
              {pendingApprovals.length > 0 && (
                <span className="bg-amber-400 text-slate-900 text-xs px-2 py-0.5 rounded-full font-bold">
                  {pendingApprovals.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 5 Cost Concept Pillars Bar (Budget vs Commitment vs Cost/Actual vs Cash vs Forecast) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-700/60">
          {/* 1. BUDGET */}
          <button
            type="button"
            onClick={() => setIsBudgetModalOpen(true)}
            className="text-left bg-slate-800/60 hover:bg-slate-800/90 transition-all rounded-xl p-3 border border-slate-700/40 hover:border-indigo-400/60 cursor-pointer group"
            title="Klik untuk membuka Kontrol Budget & RAB per WBS"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 font-medium uppercase tracking-wider">
              <span>1. Budget (RAB)</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
            </div>
            <div className="text-lg font-bold text-white mt-1 group-hover:text-indigo-300 transition-colors">
              {formatCompactRupiah(budgetRAB)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
              <span>Rencana biaya total</span>
              <span className="text-[10px] text-indigo-400 underline font-medium">Rincian</span>
            </div>
          </button>

          {/* 2. COMMITMENT */}
          <button
            type="button"
            onClick={() => onNavigateToTab('po_tracking')}
            className="text-left bg-slate-800/60 hover:bg-slate-800/90 transition-all rounded-xl p-3 border border-slate-700/40 hover:border-amber-400/60 cursor-pointer group"
            title="Klik untuk membuka Tracking Komitmen PO & SPK Rekanan"
          >
            <div className="flex items-center justify-between text-xs text-amber-300 font-medium uppercase tracking-wider">
              <span>2. Commitment</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5" />
            </div>
            <div className="text-lg font-bold text-amber-400 mt-1">{formatCompactRupiah(committed)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
              <span>PO &amp; Kontrak SPK</span>
              <span className="text-[10px] text-amber-400 underline font-medium">Buka PO</span>
            </div>
          </button>

          {/* 3. COST (ACTUAL) */}
          <button
            type="button"
            onClick={() => onNavigateToTab('wbs_cost')}
            className="text-left bg-slate-800/60 hover:bg-slate-800/90 transition-all rounded-xl p-3 border border-slate-700/40 hover:border-cyan-400/60 cursor-pointer group"
            title="Klik untuk membuka Cost Ledger & WBS"
          >
            <div className="flex items-center justify-between text-xs text-cyan-300 font-medium uppercase tracking-wider">
              <span>3. Cost (Actual)</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
            </div>
            <div className="text-lg font-bold text-cyan-400 mt-1">{formatCompactRupiah(actualCost)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
              <span>Biaya terakui WIP</span>
              <span className="text-[10px] text-cyan-400 underline font-medium">Ledger</span>
            </div>
          </button>

          {/* 4. CASH */}
          <button
            type="button"
            onClick={() => setIsCashModalOpen(true)}
            className="text-left bg-slate-800/60 hover:bg-slate-800/90 transition-all rounded-xl p-3 border border-slate-700/40 hover:border-emerald-400/60 cursor-pointer group"
            title="Klik untuk melihat Posisi Kas & Saldo Rekening Bank"
          >
            <div className="flex items-center justify-between text-xs text-emerald-300 font-medium uppercase tracking-wider">
              <span>4. Cash (Kas/Bank)</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-0.5" />
            </div>
            <div className="text-lg font-bold text-emerald-400 mt-1">{formatCompactRupiah(totalCash)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-between">
              <span>5 Rekening Proyek</span>
              <span className="text-[10px] text-emerald-400 underline font-medium">Rincian</span>
            </div>
          </button>

          {/* 5. FORECAST (EAC) */}
          <button
            type="button"
            onClick={() => setIsForecastModalOpen(true)}
            className="text-left bg-slate-800/60 hover:bg-slate-800/90 transition-all rounded-xl p-3 border border-slate-700/40 hover:border-purple-400/60 cursor-pointer group col-span-2 md:col-span-1"
            title="Klik untuk melihat Analisa Earned Value & EAC"
          >
            <div className="flex items-center justify-between text-xs text-purple-300 font-medium uppercase tracking-wider">
              <span>5. Forecast (EAC)</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 transition-transform group-hover:translate-x-0.5" />
            </div>
            <div className="text-lg font-bold text-purple-400 mt-1">{formatCompactRupiah(forecastEAC)}</div>
            <div className="text-[11px] text-emerald-400 mt-0.5 font-medium flex items-center justify-between">
              <span>Hemat {formatCompactRupiah(costVariance)}</span>
              <span className="text-[10px] text-purple-400 underline font-medium">EVM</span>
            </div>
          </button>
        </div>
      </div>

      {/* 4 PRIMARY GRID CARDS REQUESTED (LEVEL 2 CONTROL) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* CARD 1: PROJECT PROGRESS */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kurva S &amp; Progress Fisik</span>
              <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{project.actualProgress}%</span>
              <span className="text-xs text-slate-500">dari rencana {project.plannedProgress}%</span>
            </div>

            {/* Progress Bar with target marker */}
            <div className="mt-3 relative w-full h-3.5 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                style={{ width: `${project.actualProgress}%` }}
              />
              <div 
                className="absolute top-0 bottom-0 w-1 bg-amber-500 shadow-sm"
                style={{ left: `${project.plannedProgress}%` }}
                title={`Target Rencana: ${project.plannedProgress}%`}
              />
            </div>

            {/* Variance indicator & Status (Issue 9) */}
            <div className="mt-2.5 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Progress Planned: <strong>{project.plannedProgress}%</strong></span>
                <span className="text-blue-700 font-semibold">Actual: <strong>{project.actualProgress}%</strong></span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={`inline-flex items-center font-bold ${progressVariance < 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {progressVariance < 0 ? <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
                  Variance: {progressVariance.toFixed(1)}%
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 uppercase">
                  AT RISK
                </span>
              </div>
            </div>

            {/* Units Inventory Breakdown */}
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 rounded-lg p-2">
                <div className="text-xs text-slate-500">Terjual</div>
                <div className="text-sm font-bold text-slate-800">{unitsSold} Unit</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-2">
                <div className="text-xs text-slate-500">Konstruksi</div>
                <div className="text-sm font-bold text-blue-700">{unitsConstruction} Unit</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-2">
                <div className="text-xs text-slate-500">Tersedia</div>
                <div className="text-sm font-bold text-emerald-700">{unitsAvailable} Unit</div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsWBSProgressModalOpen(true)}
            className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-between pt-2 border-t border-slate-100 cursor-pointer"
          >
            <span>Rincian WBS &amp; Opname Lapangan</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* CARD 2: CASH POSITION */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Posisi Kas &amp; Likuiditas</span>
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Wallet className="w-5 h-5" />
              </span>
            </div>

            <div className="mt-4">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TOTAL KAS &amp; BANK</div>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="text-3xl font-extrabold text-slate-900">{formatCompactRupiah(totalCash)}</span>
                <span className="text-[11px] font-bold text-emerald-700">Avail: {formatCompactRupiah(availableCash)}</span>
              </div>
            </div>

            {/* Account List detailed */}
            <div className="mt-3.5 space-y-1.5 text-xs">
              {bankAccounts.length === 0 ? (
                <div className="p-2 text-center text-slate-400 bg-slate-50 rounded-lg text-[11px]">
                  Belum ada rekening kas/bank
                </div>
              ) : (
                bankAccounts.slice(0, 5).map((acc) => {
                  const isEscrow = acc.name.toLowerCase().includes('escrow') || acc.name.toLowerCase().includes('kpr');
                  return (
                    <div 
                      key={acc.id}
                      className={`flex items-center justify-between p-1.5 rounded-lg ${
                        isEscrow ? 'bg-purple-50/70 border border-purple-100' : 'bg-slate-50'
                      }`}
                    >
                      <span className={`font-medium truncate max-w-[130px] ${isEscrow ? 'text-purple-900' : 'text-slate-700'}`}>
                        {acc.name}
                      </span>
                      <div className="text-right">
                        <span className={`font-semibold ${isEscrow ? 'text-purple-900' : 'text-slate-900'}`}>
                          {formatCompactRupiah(acc.currentBalance)}
                        </span>
                        {acc.unreconciledDifference !== 0 && (
                          <span className="ml-1 text-[10px] text-rose-600 font-bold">
                            (Δ {formatCompactRupiah(acc.unreconciledDifference)})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button 
            onClick={() => setIsCashModalOpen(true)}
            className="mt-4 text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center justify-between pt-2 border-t border-slate-100 cursor-pointer"
          >
            <span>Rincian Sumber Saldo &amp; Escrow</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* CARD 3: AP / AR STATUS */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hutang &amp; Piutang (AP / AR)</span>
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <DollarSign className="w-5 h-5" />
              </span>
            </div>

            {/* AP Section (Issue 6) */}
            <div className="mt-4 pb-3 border-b border-slate-100">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">HUTANG USAHA (AP)</span>
                <span className="text-base font-bold text-rose-600">{formatCompactRupiah(totalAP)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600">
                <span>Jatuh tempo ≤ 7 hari: <strong>{formatCompactRupiah(apDueSoon)}</strong></span>
                <span className="text-rose-600 font-bold">Overdue: {formatCompactRupiah(apOverdue)}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Nilai bersumber dari AP Aging aktif.</div>
            </div>

            {/* AR Section (Issue 6) */}
            <div className="mt-3">
              <div className="flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">PIUTANG CUSTOMER (AR)</span>
                <span className="text-base font-bold text-indigo-700">{formatCompactRupiah(totalAR)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600">
                <span>Jatuh tempo: <strong>{formatCompactRupiah(arDueSoon)}</strong></span>
                <span className="text-rose-600 font-bold">Overdue: {formatCompactRupiah(arOverdue)}</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Nilai bersumber dari AR Aging aktif.</div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <button 
              onClick={() => onNavigateToTab('aging')}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-0.5 cursor-pointer"
            >
              <span>AP Aging</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => onNavigateToTab('customer_ar')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
            >
              <span>AR Aging</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CARD 4: CONTROL EXCEPTION (Issue 7 & 8) */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                ⚠ CONTROL EXCEPTION
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${unclassifiedTotal > 0 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>
                {unclassifiedTotal > 0 ? 'NEEDS REVIEW' : 'RESOLVED'}
              </span>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-rose-600">{formatCompactRupiah(unclassifiedTotal)}</span>
                <span className="text-[11px] text-slate-500 font-medium">Belum Terklasifikasi</span>
              </div>
            </div>

            {/* Structured Control Exception (Issue 7) */}
            {unclassifiedTotal > 0 ? (
              <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-xs space-y-1 text-amber-950">
                <div className="flex justify-between items-center text-[11px]">
                  <span>Jenis: <strong>Legacy Transaction</strong></span>
                  <span>Pihak: <strong>Mandor PA DIDI</strong></span>
                </div>
                <div className="text-[11px] text-slate-700">
                  Masalah: <strong className="text-rose-700">Cost Code belum lengkap</strong>
                </div>
                <div className="pt-1.5">
                  <button
                    onClick={() => setIsExceptionModalOpen(true)}
                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs transition-colors shadow-xs cursor-pointer text-center"
                  >
                    Periksa &amp; Reklasifikasi
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Semua transaksi telah diklasifikasi Cost Code.</span>
              </div>
            )}

            {/* Bank Difference Interactive Trigger (Issue 8) */}
            {(() => {
              const bca = bankAccounts.find(b => b.id === 'BNK-02');
              const hasDiff = (bca?.unreconciledDifference || 0) > 0;
              return (
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Selisih Bank BCA:</span>
                  {hasDiff ? (
                    <button
                      onClick={() => setIsBankReconModalOpen(true)}
                      className="font-bold text-rose-600 hover:text-rose-800 underline flex items-center gap-1 cursor-pointer"
                      title="Klik untuk membuka Rekonsiliasi Bank"
                    >
                      <span>{formatRupiah(bca?.unreconciledDifference || 0)}</span>
                      <span className="text-[10px] text-indigo-600 font-normal">[Rekonsiliasi]</span>
                    </button>
                  ) : (
                    <span className="font-bold text-emerald-600">Rp 0 (Cocok)</span>
                  )}
                </div>
              );
            })()}
          </div>

          <button 
            onClick={() => onNavigateToTab('control_checks')}
            className="mt-4 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-between pt-2 border-t border-slate-100 cursor-pointer"
          >
            <span>Lihat Diagnostic &amp; Risk Register</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Recharts Trend Lines: Actual Cost vs Budget (Last 6 Months Burn Rate) */}
      <CostTrendChart transactions={transactions} />

      {/* Embedded AP & AR Aging Schedule Section */}
      {agingItems.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <APARAgingView agingItems={agingItems} isEmbeddedInDashboard={true} />
        </div>
      )}

      {/* Control Check Alerts Accordion (C-001 s/d C-006) */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Control Checks &amp; Risk Register Otomatis</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
              1 Critical Block
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              4 Warning
            </span>
          </div>
          <span className="text-xs text-slate-500">Standar Pengendalian Proyek Terintegrasi PMI &amp; SAK EP</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {controlChecks.map((check) => {
            const isCritical = check.status === 'CRITICAL_BLOCK';
            const isWarning = check.status === 'WARNING';
            return (
              <div 
                key={check.code}
                className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between ${
                  isCritical 
                    ? 'bg-rose-50/80 border-rose-200 text-rose-950' 
                    : isWarning 
                    ? 'bg-amber-50/80 border-amber-200 text-amber-950' 
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-bold tracking-wide">{check.code}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isCritical ? 'bg-rose-200 text-rose-900' : isWarning ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
                    }`}>
                      {check.status}
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-900 mb-1">{check.name}</h4>
                  <p className="text-[11px] text-slate-600 mb-2 leading-relaxed">{check.description}</p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 text-[11px] font-medium text-indigo-900">
                  <span className="font-semibold text-slate-700">Tindakan: </span>{check.actionRequired}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions & Live Audit Stream */}
      <div id="recent-transactions-section" className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 scroll-mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Transaksi Terkini (Dua Lapisan: Operator &amp; Akuntansi)
            </h3>
            <p className="text-xs text-slate-500">
              Input sederhana &quot;Apa yang terjadi&quot; otomatis menghasilkan Cost Code &amp; Jurnal Akuntansi di belakang
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Filter Blok:</span>
            <select
              value={selectedBlockFilter}
              onChange={(e) => setSelectedBlockFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-indigo-500"
            >
              <option value="ALL">Semua Blok &amp; Kawasan</option>
              <option value="A">Blok A (Unit A01 - A05)</option>
              <option value="B">Blok B (Unit B01 - B03)</option>
              <option value="UMUM">Kawasan Umum &amp; Overhead</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">No Transaksi &amp; Tanggal</th>
                <th className="py-3 px-3">Kejadian / Apa Yang Terjadi</th>
                <th className="py-3 px-3">Pihak Rekanan</th>
                <th className="py-3 px-3">Cost Code &amp; WBS</th>
                <th className="py-3 px-3">Akun Jurnal (COA)</th>
                <th className="py-3 px-3 text-right">Nominal</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.filter(t => selectedBlockFilter === 'ALL' || t.block === selectedBlockFilter).length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <div className="font-semibold text-slate-700">Belum ada transaksi pada filter ini</div>
                      <p className="text-[11px] text-slate-400 max-w-sm">
                        Catat transaksi pengeluaran material, upah tukang, atau penerimaan uang muka untuk memulai arus kas proyek.
                      </p>
                      <button
                        onClick={onOpenOperatorInput}
                        className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                      >
                        + Catat Transaksi Baru
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions
                  .filter(t => selectedBlockFilter === 'ALL' || t.block === selectedBlockFilter)
                  .map((tx) => {
                  const isUnclassified = tx.category === 'UNCLASSIFIED';
                  return (
                    <tr key={tx.id} className={`hover:bg-slate-50 transition-colors ${isUnclassified ? 'bg-amber-50/40' : ''}`}>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{tx.id}</div>
                        <div className="text-[11px] text-slate-500">{formatDateIndo(tx.date)}</div>
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-semibold text-slate-800 line-clamp-1">{tx.subcategory}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{tx.description}</div>
                        {tx.unitId && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] bg-slate-200/80 font-medium text-slate-700">
                            Unit: {tx.unitId}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{tx.partyName}</div>
                        <span className="text-[10px] text-indigo-700 font-semibold px-1.5 py-0.5 bg-indigo-50 rounded">
                          {tx.partyRole}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{tx.costCode}</div>
                        <div className="text-[11px] text-slate-500">{tx.costCodeName || `WBS ${tx.wbsCode}`}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-[11px]">
                        <div className="text-slate-700">D: <span className="font-mono font-medium">{tx.debitAccountCode}</span></div>
                        <div className="text-slate-500">K: <span className="font-mono font-medium">{tx.creditAccountCode}</span></div>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className={`font-bold ${tx.type === 'INCOME' ? 'text-emerald-700' : 'text-slate-900'}`}>
                          {tx.type === 'INCOME' ? '+' : '-'}{formatRupiah(tx.totalAmount)}
                        </div>
                        <div className="text-[10px] text-slate-400">{tx.paymentMethod}</div>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                          tx.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                          tx.status === 'VERIFIED' ? 'bg-purple-100 text-purple-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => onSelectTransactionForReview && onSelectTransactionForReview(tx)}
                          className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Level 1, 2, and 3 Drilldown Modals (Functional Workflows) */}
      <BudgetControlModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        project={project}
        onNavigateToCostCodes={() => onNavigateToTab('wbs_cost')}
      />

      <CashBreakdownModal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        bankAccounts={bankAccounts}
        onNavigateToBankTab={() => onNavigateToTab('accounting_bank')}
      />

      <ForecastEACModal
        isOpen={isForecastModalOpen}
        onClose={() => setIsForecastModalOpen(false)}
        project={project}
      />

      <WBSProgressModal
        isOpen={isWBSProgressModalOpen}
        onClose={() => setIsWBSProgressModalOpen(false)}
        project={project}
        onNavigateToWBSCost={() => onNavigateToTab('wbs_cost')}
      />

      <ControlExceptionModal
        isOpen={isExceptionModalOpen}
        onClose={() => setIsExceptionModalOpen(false)}
        unclassifiedTransactions={unclassifiedTx}
        onResolveException={(txId, newCostCode, newCategory, note) => {
          if (onResolveException) {
            onResolveException(txId, newCostCode, newCategory, note);
          }
        }}
      />

      <BankReconciliationModal
        isOpen={isBankReconModalOpen}
        onClose={() => setIsBankReconModalOpen(false)}
        bankAccount={bankAccounts.find(b => b.id === 'BNK-02') || bankAccounts[0]}
        onPostReconciliationAdjustment={(accountId, adjustedBalance, causeDescription) => {
          if (onPostBankReconciliation) {
            onPostBankReconciliation(accountId, adjustedBalance, causeDescription);
          }
        }}
        onNavigateToBankTab={() => onNavigateToTab('accounting_bank')}
      />
    </div>
  );
};
