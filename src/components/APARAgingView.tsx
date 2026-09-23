import React, { useState } from 'react';
import { AgingItem, AgingSummary } from '../types';
import { formatRupiah, formatCompactRupiah, formatDateIndo } from '../utils/formatters';
import { 
  CalendarClock, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  Filter, 
  CheckCircle2, 
  Info,
  ChevronRight,
  TrendingDown,
  Building2
} from 'lucide-react';

interface APARAgingViewProps {
  agingItems: AgingItem[];
  isEmbeddedInDashboard?: boolean;
  onSelectEntity?: (item: AgingItem) => void;
}

export const APARAgingView: React.FC<APARAgingViewProps> = ({
  agingItems,
  isEmbeddedInDashboard = false,
  onSelectEntity
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'AP' | 'AR'>('ALL');
  const [filterBucket, setFilterBucket] = useState<string>('ALL');

  // Filtered by type
  const apItems = agingItems.filter(i => i.type === 'AP');
  const arItems = agingItems.filter(i => i.type === 'AR');

  const calculateSummary = (items: AgingItem[]): AgingSummary => {
    return items.reduce((acc, curr) => {
      acc.total += curr.outstandingBalance;
      if (curr.agingBucket === 'CURRENT') acc.current += curr.outstandingBalance;
      else if (curr.agingBucket === 'DAYS_1_30') acc.days1to30 += curr.outstandingBalance;
      else if (curr.agingBucket === 'DAYS_31_60') acc.days31to60 += curr.outstandingBalance;
      else if (curr.agingBucket === 'DAYS_61_90') acc.days61to90 += curr.outstandingBalance;
      else if (curr.agingBucket === 'OVER_90') acc.over90 += curr.outstandingBalance;
      return acc;
    }, { current: 0, days1to30: 0, days31to60: 0, days61to90: 0, over90: 0, total: 0 });
  };

  const apSummary = calculateSummary(apItems);
  const arSummary = calculateSummary(arItems);

  // Items to display in table
  const displayedItems = agingItems.filter(item => {
    const matchType = activeTab === 'ALL' || item.type === activeTab;
    const matchBucket = filterBucket === 'ALL' || item.agingBucket === filterBucket;
    return matchType && matchBucket;
  });

  return (
    <div className={`space-y-6 ${isEmbeddedInDashboard ? 'mt-6' : ''}`}>
      {/* Header bar if standalone */}
      {!isEmbeddedInDashboard ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                PENGENDALIAN LIKUIDITAS &amp; JATUH TEMPO
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                <CalendarClock className="w-6 h-6 text-indigo-600" />
                Accounts Payable &amp; Receivable Aging Schedule
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                Memetakan umur jatuh tempo tagihan hutang supplier (AP) dan piutang konsumen (AR) ke dalam 5 kelompok umur 
                (Current, 1-30, 31-60, 61-90, dan &gt;90 hari) untuk melindungi arus kas developer dari defisit.
              </p>
            </div>

            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'ALL' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Aging
              </button>
              <button
                onClick={() => setActiveTab('AP')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'AP' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Hutang Usaha (AP)
              </button>
              <button
                onClick={() => setActiveTab('AR')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'AR' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Piutang Konsumen (AR)
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Analisis Umur Jatuh Tempo (AP &amp; AR Aging Schedule)
            </h3>
          </div>
          <div className="flex p-0.5 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                activeTab === 'ALL' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setActiveTab('AP')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                activeTab === 'AP' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              AP (Hutang)
            </button>
            <button
              onClick={() => setActiveTab('AR')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                activeTab === 'AR' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500'
              }`}
            >
              AR (Piutang)
            </button>
          </div>
        </div>
      )}

      {/* Two Comparison Aging Breakdown Cards (AP vs AR) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* AP Aging Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <ArrowDownRight className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Hutang Usaha (AP Aging)</h4>
                <p className="text-[11px] text-slate-500">Kewajiban kepada Vendor Material &amp; Mandor Borongan</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium block">Total Hutang:</span>
              <span className="text-lg font-extrabold text-rose-600">{formatRupiah(apSummary.total)}</span>
            </div>
          </div>

          {/* Aging Buckets Progress Bar */}
          <div className="mt-4">
            <div className="h-3 w-full bg-slate-100 rounded-full flex overflow-hidden">
              <div 
                style={{ width: `${apSummary.total ? (apSummary.current / apSummary.total) * 100 : 0}%` }}
                className="bg-emerald-500" 
                title={`Current: ${formatCompactRupiah(apSummary.current)}`}
              />
              <div 
                style={{ width: `${apSummary.total ? (apSummary.days1to30 / apSummary.total) * 100 : 0}%` }}
                className="bg-amber-400" 
                title={`1-30 Hari: ${formatCompactRupiah(apSummary.days1to30)}`}
              />
              <div 
                style={{ width: `${apSummary.total ? (apSummary.days31to60 / apSummary.total) * 100 : 0}%` }}
                className="bg-orange-500" 
                title={`31-60 Hari: ${formatCompactRupiah(apSummary.days31to60)}`}
              />
              <div 
                style={{ width: `${apSummary.total ? (apSummary.days61to90 / apSummary.total) * 100 : 0}%` }}
                className="bg-rose-500" 
                title={`61-90 Hari: ${formatCompactRupiah(apSummary.days61to90)}`}
              />
              <div 
                style={{ width: `${apSummary.total ? (apSummary.over90 / apSummary.total) * 100 : 0}%` }}
                className="bg-purple-700" 
                title={`>90 Hari: ${formatCompactRupiah(apSummary.over90)}`}
              />
            </div>
          </div>

          {/* Detailed 5 Buckets Matrix */}
          <div className="grid grid-cols-5 gap-1.5 mt-3 text-center">
            <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <div className="text-[10px] text-emerald-800 font-bold uppercase">Current (0 hr)</div>
              <div className="text-xs font-extrabold text-emerald-700 mt-0.5">{formatCompactRupiah(apSummary.current)}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{apSummary.total ? Math.round((apSummary.current / apSummary.total) * 100) : 0}%</div>
            </div>
            <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100">
              <div className="text-[10px] text-amber-800 font-bold uppercase">1 - 30 Hari</div>
              <div className="text-xs font-extrabold text-amber-700 mt-0.5">{formatCompactRupiah(apSummary.days1to30)}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{apSummary.total ? Math.round((apSummary.days1to30 / apSummary.total) * 100) : 0}%</div>
            </div>
            <div className="p-2 rounded-xl bg-orange-50/70 border border-orange-100">
              <div className="text-[10px] text-orange-800 font-bold uppercase">31 - 60 Hari</div>
              <div className="text-xs font-extrabold text-orange-700 mt-0.5">{formatCompactRupiah(apSummary.days31to60)}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{apSummary.total ? Math.round((apSummary.days31to60 / apSummary.total) * 100) : 0}%</div>
            </div>
            <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-100">
              <div className="text-[10px] text-rose-800 font-bold uppercase">61 - 90 Hari</div>
              <div className="text-xs font-extrabold text-rose-700 mt-0.5">{formatCompactRupiah(apSummary.days61to90)}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{apSummary.total ? Math.round((apSummary.days61to90 / apSummary.total) * 100) : 0}%</div>
            </div>
            <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-100">
              <div className="text-[10px] text-purple-800 font-bold uppercase">&gt; 90 Hari</div>
              <div className="text-xs font-extrabold text-purple-700 mt-0.5">{formatCompactRupiah(apSummary.over90)}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{apSummary.total ? Math.round((apSummary.over90 / apSummary.total) * 100) : 0}%</div>
            </div>
          </div>
        </div>

        {/* AR Aging Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <ArrowUpRight className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Piutang Konsumen (AR Aging)</h4>
                <p className="text-[11px] text-slate-500">KPR Bank Menunggu Akad &amp; Cicilan Uang Muka (DP)</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-medium block">Total Piutang:</span>
              <span className="text-lg font-extrabold text-indigo-700">{formatRupiah(arSummary.total)}</span>
            </div>
          </div>

          {/* Aging Buckets Progress Bar */}
          <div className="mt-4">
            <div className="h-3 w-full bg-slate-100 rounded-full flex overflow-hidden">
              <div 
                style={{ width: `${arSummary.total ? (arSummary.current / arSummary.total) * 100 : 0}%` }}
                className="bg-emerald-500" 
                title={`Current: ${formatCompactRupiah(arSummary.current)}`}
              />
              <div 
                style={{ width: `${arSummary.total ? (arSummary.days1to30 / arSummary.total) * 100 : 0}%` }}
                className="bg-amber-400" 
                title={`1-30 Hari: ${formatCompactRupiah(arSummary.days1to30)}`}
              />
              <div 
                style={{ width: `${arSummary.total ? (arSummary.days31to60 / arSummary.total) * 100 : 0}%` }}
                className="bg-orange-500" 
                title={`31-60 Hari: ${formatCompactRupiah(arSummary.days31to60)}`}
              />
              <div 
                style={{ width: `${arSummary.total ? (arSummary.days61to90 / arSummary.total) * 100 : 0}%` }}
                className="bg-rose-500" 
                title={`61-90 Hari: ${formatCompactRupiah(arSummary.days61to90)}`}
              />
              <div 
                style={{ width: `${arSummary.total ? (arSummary.over90 / arSummary.total) * 100 : 0}%` }}
                className="bg-purple-700" 
                title={`>90 Hari: ${formatCompactRupiah(arSummary.over90)}`}
              />
            </div>
          </div>

          {/* Detailed 5 Buckets Matrix */}
          <div className="grid grid-cols-5 gap-1.5 mt-3 text-center">
            <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <div className="text-[10px] text-emerald-800 font-bold uppercase">Current (0 hr)</div>
              <div className="text-xs font-extrabold text-emerald-700 mt-0.5">{formatCompactRupiah(arSummary.current)}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{arSummary.total ? Math.round((arSummary.current / arSummary.total) * 100) : 0}%</div>
            </div>
            <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100">
              <div className="text-[10px] text-amber-800 font-bold uppercase">1 - 30 Hari</div>
              <div className="text-xs font-extrabold text-amber-700 mt-0.5">{formatCompactRupiah(arSummary.days1to30)}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{arSummary.total ? Math.round((arSummary.days1to30 / arSummary.total) * 100) : 0}%</div>
            </div>
            <div className="p-2 rounded-xl bg-orange-50/70 border border-orange-100">
              <div className="text-[10px] text-orange-800 font-bold uppercase">31 - 60 Hari</div>
              <div className="text-xs font-extrabold text-orange-700 mt-0.5">{formatCompactRupiah(arSummary.days31to60)}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{arSummary.total ? Math.round((arSummary.days31to60 / arSummary.total) * 100) : 0}%</div>
            </div>
            <div className="p-2 rounded-xl bg-rose-50/70 border border-rose-100">
              <div className="text-[10px] text-rose-800 font-bold uppercase">61 - 90 Hari</div>
              <div className="text-xs font-extrabold text-rose-700 mt-0.5">{formatCompactRupiah(arSummary.days61to90)}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{arSummary.total ? Math.round((arSummary.days61to90 / arSummary.total) * 100) : 0}%</div>
            </div>
            <div className="p-2 rounded-xl bg-purple-50/70 border border-purple-100">
              <div className="text-[10px] text-purple-800 font-bold uppercase">&gt; 90 Hari</div>
              <div className="text-xs font-extrabold text-purple-700 mt-0.5">{formatCompactRupiah(arSummary.over90)}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">{arSummary.total ? Math.round((arSummary.over90 / arSummary.total) * 100) : 0}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Aging Schedule Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Daftar Tagihan Berdasarkan Umur Piutang &amp; Hutang
            </h4>
            <span className="text-[11px] text-slate-500">
              Total {displayedItems.length} transaksi / tagihan teridentifikasi
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Filter Umur:</span>
            <select
              value={filterBucket}
              onChange={(e) => setFilterBucket(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-medium text-slate-700"
            >
              <option value="ALL">Semua Umur</option>
              <option value="CURRENT">Current (Belum Jatuh Tempo)</option>
              <option value="DAYS_1_30">1 - 30 Hari</option>
              <option value="DAYS_31_60">31 - 60 Hari</option>
              <option value="DAYS_61_90">61 - 90 Hari</option>
              <option value="OVER_90">&gt; 90 Hari</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Tipe</th>
                <th className="py-3 px-4">Entitas / Konsumen / Vendor</th>
                <th className="py-3 px-4">No Referensi / Unit</th>
                <th className="py-3 px-4">Kategori Tagihan</th>
                <th className="py-3 px-4">Jatuh Tempo</th>
                <th className="py-3 px-4 text-center">Umur (Hari)</th>
                <th className="py-3 px-4 text-center">Bucket Aging</th>
                <th className="py-3 px-4 text-right">Sisa Tagihan</th>
                <th className="py-3 px-4 text-center">Tingkat Risiko</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedItems.map((item) => {
                const isOverdue = item.daysPastDue > 0;
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.type === 'AP' ? 'bg-rose-100 text-rose-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {item.type === 'AP' ? 'HUTANG (AP)' : 'PIUTANG (AR)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.entityName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {item.referenceNo}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {item.category}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                      {formatDateIndo(item.dueDate)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {isOverdue ? (
                        <span className="font-bold text-rose-600">+{item.daysPastDue} hari</span>
                      ) : (
                        <span className="font-medium text-emerald-600">{item.daysPastDue} hari</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.agingBucket === 'CURRENT' ? 'bg-emerald-100 text-emerald-800' :
                        item.agingBucket === 'DAYS_1_30' ? 'bg-amber-100 text-amber-800' :
                        item.agingBucket === 'DAYS_31_60' ? 'bg-orange-100 text-orange-800' :
                        item.agingBucket === 'DAYS_61_90' ? 'bg-rose-100 text-rose-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {item.agingBucket.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-slate-900">
                      {formatRupiah(item.outstandingBalance)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.riskLevel === 'CRITICAL' ? 'bg-rose-500 text-white' :
                        item.riskLevel === 'HIGH' ? 'bg-rose-100 text-rose-800' :
                        item.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.riskLevel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
