import React, { useState } from 'react';
import { POContractTracking } from '../types';
import { formatRupiah, formatCompactRupiah, formatDateIndo } from '../utils/formatters';
import { 
  Briefcase, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Layers, 
  ArrowUpRight,
  ShieldCheck,
  Plus,
  Percent,
  Search,
  Filter
} from 'lucide-react';

interface POContractTrackingViewProps {
  contracts: POContractTracking[];
  onUpdateOpname: (contractId: string, newOpnamePercent: number) => void;
  onPayContractTermin: (contractId: string, amount: number) => void;
}

export const POContractTrackingView: React.FC<POContractTrackingViewProps> = ({
  contracts,
  onUpdateOpname,
  onPayContractTermin
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedWbs, setSelectedWbs] = useState<string>('ALL');
  const [activeModalContract, setActiveModalContract] = useState<POContractTracking | null>(null);
  const [modalAction, setModalAction] = useState<'OPNAME' | 'PAY' | null>(null);
  const [inputVal, setInputVal] = useState<string>('');

  // 4 Grand Totals: Budget vs Committed vs Actual Paid vs Outstanding
  const grandTotalBudget = contracts.reduce((acc, c) => acc + c.budgetRABItem, 0);
  const grandTotalCommitted = contracts.reduce((acc, c) => acc + c.totalContractBudget, 0);
  const grandTotalCompletedOpname = contracts.reduce((acc, c) => acc + c.verifiedOpnameAmount, 0);
  const grandTotalInvoiced = contracts.reduce((acc, c) => acc + c.invoicedAmount, 0);
  const grandTotalPaid = contracts.reduce((acc, c) => acc + c.paidAmount, 0);
  const grandTotalOutstandingCommitment = contracts.reduce((acc, c) => acc + c.outstandingCommitment, 0);
  const grandTotalOutstandingPayable = contracts.reduce((acc, c) => acc + c.outstandingPayable, 0);

  const filteredContracts = contracts.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.contractNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.costCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchWbs = selectedWbs === 'ALL' || c.wbsCode === selectedWbs;
    return matchSearch && matchWbs;
  });

  const handleExecuteModal = () => {
    if (!activeModalContract || !inputVal) return;
    const num = parseFloat(inputVal);
    if (isNaN(num) || num <= 0) return;

    if (modalAction === 'OPNAME') {
      onUpdateOpname(activeModalContract.id, Math.min(100, num));
    } else if (modalAction === 'PAY') {
      onPayContractTermin(activeModalContract.id, num);
    }
    setActiveModalContract(null);
    setModalAction(null);
    setInputVal('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              PENGENDALIAN KOMITMEN BIAYA &amp; SPK KONTRAKTOR
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-indigo-600" />
              Tracking Purchase Order (PO) &amp; Kontrak Rekanan
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Memantau rantai biaya konstruksi: dari <strong>Alokasi Anggaran (Budget RAB)</strong>, 
              <strong> Nilai Komitmen Kontrak (SPK/PO)</strong>, <strong>Progress Opname Fisik Selesai</strong>, 
              <strong> Nilai Tagihan (Invoiced)</strong>, hingga <strong>Realisasi Kas (Actual Paid)</strong> dan 
              <strong> Sisa Komitmen (Outstanding Commitment)</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Filter WBS:</span>
            <select
              value={selectedWbs}
              onChange={(e) => setSelectedWbs(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-700"
            >
              <option value="ALL">Semua WBS</option>
              <option value="01">01 - Pembebasan Lahan (LAND)</option>
              <option value="02">02 - Perizinan &amp; Legal (LEG)</option>
              <option value="03">03 - Site Development (SIT)</option>
              <option value="04">04 - Infrastruktur (INF)</option>
              <option value="05">05 - Konstruksi Unit (BLD)</option>
              <option value="06">06 - Fasum &amp; Fasos (FAS)</option>
              <option value="07">07 - Marketing &amp; Sales (MKT)</option>
              <option value="08">08 - Overhead Holding (ADM)</option>
            </select>
          </div>
        </div>

        {/* 4 Pillars Dashboard: Budget vs Committed vs Actual Paid vs Outstanding */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">1. Alokasi Budget RAB</span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">RAB</span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-2">
              {formatCompactRupiah(grandTotalBudget)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Pagu biaya yang direncanakan</p>
          </div>

          <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">2. Komitmen SPK (PO)</span>
              <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded">Committed</span>
            </div>
            <div className="text-xl font-extrabold text-amber-900 mt-2">
              {formatCompactRupiah(grandTotalCommitted)}
            </div>
            <div className="text-[11px] text-amber-700 mt-1">
              Opname Fisik: <strong>{formatCompactRupiah(grandTotalCompletedOpname)}</strong>
            </div>
          </div>

          <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">3. Kas Terbayar</span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded">Actual Paid</span>
            </div>
            <div className="text-xl font-extrabold text-emerald-900 mt-2">
              {formatCompactRupiah(grandTotalPaid)}
            </div>
            <div className="text-[11px] text-emerald-700 mt-1">
              {grandTotalCommitted ? Math.round((grandTotalPaid / grandTotalCommitted) * 100) : 0}% dari total kontrak
            </div>
          </div>

          <div className="bg-rose-50/70 rounded-2xl p-4 border border-rose-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wide">4. Sisa Komitmen</span>
              <span className="text-[10px] font-bold text-rose-800 bg-rose-200 px-2 py-0.5 rounded">Outstanding</span>
            </div>
            <div className="text-xl font-extrabold text-rose-900 mt-2">
              {formatCompactRupiah(grandTotalOutstandingCommitment)}
            </div>
            <div className="text-[11px] text-rose-700 mt-1">
              Hutang Tagihan (AP): <strong>{formatCompactRupiah(grandTotalOutstandingPayable)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Contracts & PO List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nomor kontrak, vendor, atau uraian pekerjaan..."
              className="w-full text-xs pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 focus:outline-indigo-500 bg-white"
            />
          </div>

          <span className="text-xs text-slate-500">
            Menampilkan {filteredContracts.length} kontrak rekanan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">No Kontrak &amp; Vendor</th>
                <th className="py-3 px-4">Pekerjaan &amp; WBS/Cost Code</th>
                <th className="py-3 px-4 text-right">Nilai Kontrak (Committed)</th>
                <th className="py-3 px-4 text-center">Opname Fisik (%)</th>
                <th className="py-3 px-4 text-right">Nilai Pekerjaan Selesai</th>
                <th className="py-3 px-4 text-right">Tagihan (Invoiced)</th>
                <th className="py-3 px-4 text-right">Dibayar (Actual Paid)</th>
                <th className="py-3 px-4 text-right">Sisa Komitmen</th>
                <th className="py-3 px-4 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContracts.map((c) => {
                const hasPendingInvoice = c.outstandingPayable > 0;
                return (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{c.contractNo}</div>
                      <div className="text-[11px] font-semibold text-indigo-700">{c.vendorName}</div>
                      <span className="text-[10px] text-slate-400">{c.vendorRole}</span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-800 line-clamp-1">{c.title}</div>
                      <div className="text-[11px] text-slate-500">
                        WBS {c.wbsCode} • <span className="font-mono font-bold text-indigo-700">{c.costCode}</span>
                      </div>
                      {c.notes && (
                        <div className="text-[10px] text-amber-700 line-clamp-1 mt-0.5 italic">
                          {c.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-slate-900">
                      {formatRupiah(c.totalContractBudget)}
                      <div className="text-[10px] text-slate-400 font-normal">
                        RAB: {formatCompactRupiah(c.budgetRABItem)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 font-bold text-slate-800">
                        <span>{c.verifiedOpnamePercent}%</span>
                      </div>
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full mx-auto mt-1 overflow-hidden">
                        <div 
                          style={{ width: `${c.verifiedOpnamePercent}%` }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-semibold text-slate-700">
                      {formatRupiah(c.verifiedOpnameAmount)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="font-bold text-amber-800">{formatRupiah(c.invoicedAmount)}</span>
                      {hasPendingInvoice && (
                        <div className="text-[10px] text-rose-600 font-semibold">
                          Belum bayar: {formatCompactRupiah(c.outstandingPayable)}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-emerald-700">
                      {formatRupiah(c.paidAmount)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-slate-900">
                      {formatRupiah(c.outstandingCommitment)}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setActiveModalContract(c);
                            setModalAction('OPNAME');
                            setInputVal(c.verifiedOpnamePercent.toString());
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                          title="Perbarui progres opname fisik"
                        >
                          + Opname
                        </button>
                        <button
                          onClick={() => {
                            setActiveModalContract(c);
                            setModalAction('PAY');
                            setInputVal(c.outstandingPayable > 0 ? c.outstandingPayable.toString() : '10000000');
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                          title="Bayar termin tagihan rekanan"
                        >
                          Bayar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Modal for Opname Update or Payment */}
      {activeModalContract && modalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {modalAction === 'OPNAME' ? 'Update Opname Fisik Proyek' : 'Catat Pembayaran Termin Rekanan'}
            </h3>
            <p className="text-xs text-slate-500">
              Kontrak: <strong>{activeModalContract.contractNo}</strong> ({activeModalContract.vendorName})<br />
              Pekerjaan: {activeModalContract.title}
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                {modalAction === 'OPNAME' ? 'Persentase Opname Fisik Baru (%)' : 'Nominal Pembayaran (Rp)'}
              </label>
              <input
                type="number"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={modalAction === 'OPNAME' ? "Contoh: 75" : "Contoh: 25000000"}
                className="w-full text-sm font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-indigo-600"
              />
              {modalAction === 'OPNAME' && (
                <span className="text-[11px] text-slate-400">
                  Opname saat ini: {activeModalContract.verifiedOpnamePercent}%. Nilai pekerjaan selesai akan dihitung otomatis.
                </span>
              )}
              {modalAction === 'PAY' && (
                <span className="text-[11px] text-slate-400">
                  Sisa komitmen: {formatRupiah(activeModalContract.outstandingCommitment)} • Tagihan pending: {formatRupiah(activeModalContract.outstandingPayable)}
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setActiveModalContract(null);
                  setModalAction(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteModal}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
              >
                Simpan &amp; Perbarui
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
