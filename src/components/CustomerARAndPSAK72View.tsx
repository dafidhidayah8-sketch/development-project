import React, { useState } from 'react';
import { CustomerARRecord } from '../types';
import { formatRupiah, formatCompactRupiah, formatDateIndo } from '../utils/formatters';
import { 
  FileCheck2, 
  Building2, 
  DollarSign, 
  CalendarClock, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight, 
  Layers, 
  Sparkles,
  BookOpen,
  KeyRound,
  ShieldCheck,
  CreditCard,
  Plus
} from 'lucide-react';

interface CustomerARAndPSAK72ViewProps {
  records: CustomerARRecord[];
  onProcessBAST: (unitId: string) => void;
  onRecordCustomerPayment: (customerRecordId: string, scheduleId: string, amount: number) => void;
}

export const CustomerARAndPSAK72View: React.FC<CustomerARAndPSAK72ViewProps> = ({
  records,
  onProcessBAST,
  onRecordCustomerPayment
}) => {
  const [selectedRecord, setSelectedRecord] = useState<CustomerARRecord | null>(records[0] || null);
  const [filterBlock, setFilterBlock] = useState<string>('ALL');
  const [showBASTSuccessModal, setShowBASTSuccessModal] = useState<boolean>(false);

  // Overall AR & PSAK 72 Metrics
  const totalSellingPrice = records.reduce((acc, r) => acc + r.sellingPrice, 0);
  const totalCashCollected = records.reduce((acc, r) => acc + r.totalPaid, 0);
  const totalOutstandingAR = records.reduce((acc, r) => acc + r.totalOutstandingAR, 0);
  const totalContractLiability = records.reduce((acc, r) => acc + r.psak72.contractLiabilityBalance, 0);
  const totalRecognizedRevenue = records.reduce((acc, r) => acc + r.psak72.recognizedRevenue, 0);

  const filteredRecords = records.filter(r => {
    return filterBlock === 'ALL' || r.block === filterBlock;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: PSAK 72 Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PSAK 72 (PENDAPATAN DARI KONTRAK PELANGGAN)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                SAK ENTITAS PRIVAT (1 JAN 2025)
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <FileCheck2 className="w-7 h-7 text-emerald-400" />
              Manajemen Piutang Konsumen (AR) &amp; Pengakuan Pendapatan PSAK 72
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Standar mewajibkan pemisahan tegas antara <strong>Uang Muka Pelanggan (Liabilitas Kontrak Akun 2420)</strong> dan{' '}
              <strong>Pendapatan Diakui (Akun 4110)</strong>. Pembayaran uang muka/termin dari konsumen{' '}
              <span className="text-amber-300 font-bold underline">TIDAK BOLEH</span> diakui sebagai keuntungan sebelum fisik dan kendali
              unit diserahkan melalui <strong>Berita Acara Serah Terima (BAST - Point in Time)</strong>.
            </p>
          </div>

          <div className="bg-slate-800/70 p-4 rounded-xl border border-slate-700/60 text-right min-w-[200px]">
            <span className="text-xs text-slate-400 uppercase font-semibold">Total Pendapatan Diakui</span>
            <div className="text-2xl font-extrabold text-emerald-400 mt-0.5">
              {formatCompactRupiah(totalRecognizedRevenue)}
            </div>
            <div className="text-[11px] text-amber-300 mt-1">
              Uang Muka (Liabilitas): {formatCompactRupiah(totalContractLiability)}
            </div>
          </div>
        </div>

        {/* 4 Financial Indicator Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <span className="text-xs text-slate-400 font-medium">1. Nilai Kontrak PPJB</span>
            <div className="text-lg font-bold text-white mt-1">{formatCompactRupiah(totalSellingPrice)}</div>
            <span className="text-[10px] text-slate-400">{records.length} unit terikat kontrak</span>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <span className="text-xs text-slate-400 font-medium">2. Kas Diterima (Bank/Tunai)</span>
            <div className="text-lg font-bold text-cyan-400 mt-1">{formatCompactRupiah(totalCashCollected)}</div>
            <span className="text-[10px] text-emerald-400">Kas nyata developer</span>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <span className="text-xs text-slate-400 font-medium">3. Sisa Piutang (AR Outstanding)</span>
            <div className="text-lg font-bold text-amber-400 mt-1">{formatCompactRupiah(totalOutstandingAR)}</div>
            <span className="text-[10px] text-amber-300">Menunggu akad KPR &amp; DP</span>
          </div>

          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
            <span className="text-xs text-slate-400 font-medium">4. Liabilitas Kontrak (Akun 2420)</span>
            <div className="text-lg font-bold text-rose-300 mt-1">{formatCompactRupiah(totalContractLiability)}</div>
            <span className="text-[10px] text-slate-400">Uang muka sebelum BAST</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left List of Sold Units, Right Detail PSAK 72 & Schedules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (5 Cols): Customer Unit List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                Daftar Kontrak Penjualan Unit
              </h3>
              <select
                value={filterBlock}
                onChange={(e) => setFilterBlock(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-medium text-slate-700"
              >
                <option value="ALL">Semua Blok</option>
                <option value="A">Blok A</option>
                <option value="B">Blok B</option>
                <option value="C">Blok C</option>
              </select>
            </div>

            <div className="divide-y divide-slate-100 mt-2 space-y-2">
              {filteredRecords.map((rec) => {
                const isSelected = selectedRecord?.id === rec.id;
                const isBastReady = rec.psak72.handoverStatus === 'READY_FOR_BAST';
                const isBastDone = rec.psak72.handoverStatus === 'BAST_COMPLETED';

                return (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedRecord(rec)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-300 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs px-2 py-0.5 bg-slate-900 text-white rounded">
                            {rec.unitNo}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{rec.customerName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {rec.unitType} • {rec.paymentScheme === 'KPR' ? `KPR (${rec.partnerBank || 'Bank'})` : rec.paymentScheme}
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isBastDone ? 'bg-emerald-100 text-emerald-800' :
                        isBastReady ? 'bg-purple-100 text-purple-800 animate-pulse' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {isBastDone ? '✓ BAST SELESAI' : isBastReady ? '★ SIAP BAST' : 'PROSES KONSTRUKSI'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Harga Jual</span>
                        <span className="font-bold text-slate-800">{formatCompactRupiah(rec.sellingPrice)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Kas Masuk</span>
                        <span className="font-bold text-emerald-600">{formatCompactRupiah(rec.totalPaid)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Sisa Piutang</span>
                        <span className="font-bold text-rose-600">{formatCompactRupiah(rec.totalOutstandingAR)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Selected Unit Schedule & PSAK 72 Assessment */}
        {selectedRecord && (
          <div className="lg:col-span-7 space-y-5">
            {/* Unit Header Card */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded">
                      Unit {selectedRecord.unitNo} (Blok {selectedRecord.block})
                    </span>
                    <span className="text-xs text-slate-500 font-medium">PPJB: {selectedRecord.contractNo}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {selectedRecord.customerName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Telepon: {selectedRecord.customerPhone} • {selectedRecord.unitType} • Harga Kontrak: {formatRupiah(selectedRecord.sellingPrice)}
                  </p>
                </div>

                {/* BAST Trigger Action */}
                {selectedRecord.psak72.handoverStatus === 'READY_FOR_BAST' && (
                  <button
                    onClick={() => {
                      onProcessBAST(selectedRecord.unitId);
                      setShowBASTSuccessModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <KeyRound className="w-4 h-4" />
                    Proses BAST &amp; Akui Revenue PSAK 72
                  </button>
                )}
                {selectedRecord.psak72.handoverStatus === 'BAST_COMPLETED' && (
                  <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    BAST Selesai ({selectedRecord.psak72.bastNo})
                  </div>
                )}
              </div>

              {/* 5-Step Model PSAK 72 Checklist for This Unit */}
              <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    Evaluasi 5-Langkah Pengakuan Pendapatan (PSAK 72)
                  </span>
                  <span className="text-[11px] font-bold text-slate-600">
                    Metode: Point-in-Time (Saat BAST)
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Langkah 1: Identifikasi Kontrak Pelanggan</strong>
                      <p className="text-[11px] text-slate-500">
                        Kontrak PPJB sah nomor {selectedRecord.contractNo} tertanggal {formatDateIndo(selectedRecord.contractDate)}.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Langkah 2: Identifikasi Kewajiban Pelaksanaan (Performance Obligation)</strong>
                      <p className="text-[11px] text-slate-500">{selectedRecord.psak72.step2PerformanceObligation}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Langkah 3 &amp; 4: Penetapan &amp; Alokasi Harga Transaksi</strong>
                      <p className="text-[11px] text-slate-500">
                        Harga transaksi bersih {formatRupiah(selectedRecord.sellingPrice)} dialokasikan penuh ke unit rumah dan kavling.
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-start gap-2 p-2.5 rounded-lg border ${
                    selectedRecord.psak72.handoverStatus === 'BAST_COMPLETED'
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-amber-50 border-amber-200'
                  }`}>
                    {selectedRecord.psak72.handoverStatus === 'BAST_COMPLETED' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <strong className={selectedRecord.psak72.handoverStatus === 'BAST_COMPLETED' ? 'text-emerald-900' : 'text-amber-900'}>
                        Langkah 5: Waktu Pengakuan Pendapatan (Point in Time saat BAST)
                      </strong>
                      <p className="text-[11px] text-slate-600 mt-0.5">{selectedRecord.psak72.notes}</p>
                    </div>
                  </div>
                </div>

                {/* Accounting Impact Comparison */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200">
                    <span className="text-[10px] text-amber-800 font-bold uppercase block">
                      Akun 2420 - Liabilitas Kontrak (Uang Muka)
                    </span>
                    <span className="text-base font-extrabold text-amber-900 mt-1 block">
                      {formatRupiah(selectedRecord.psak72.contractLiabilityBalance)}
                    </span>
                    <span className="text-[10px] text-amber-700">
                      Uang konsumen masuk neraca kewajiban sebelum serah terima.
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase block">
                      Akun 4110 - Pendapatan Penjualan Rumah
                    </span>
                    <span className="text-base font-extrabold text-emerald-900 mt-1 block">
                      {formatRupiah(selectedRecord.psak72.recognizedRevenue)}
                    </span>
                    <span className="text-[10px] text-emerald-700">
                      Hanya sah diakui di Laba Rugi setelah BAST fisik diterbitkan.
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Schedule (Jadwal Termin Angsuran & DP) */}
              <div className="mt-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CalendarClock className="w-4 h-4 text-indigo-600" />
                    Jadwal Angsuran &amp; Pembayaran Termin Konsumen
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Terbayar {selectedRecord.schedules.filter(s => s.status === 'PAID').length} dari {selectedRecord.schedules.length} termin
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedRecord.schedules.map((sch) => {
                    const isPaid = sch.status === 'PAID';
                    const isOverdue = sch.status === 'OVERDUE';

                    return (
                      <div
                        key={sch.id}
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          isPaid ? 'bg-emerald-50/50 border-emerald-200' :
                          isOverdue ? 'bg-rose-50/50 border-rose-200' :
                          'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">Termin {sch.terminNo}: {sch.title}</span>
                            <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                              isPaid ? 'bg-emerald-200 text-emerald-900' :
                              isOverdue ? 'bg-rose-200 text-rose-900 animate-pulse' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {isPaid ? 'LUNAS' : isOverdue ? 'JATUH TEMPO (OVERDUE)' : 'BELUM JATUH TEMPO'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Jatuh Tempo: <strong>{formatDateIndo(sch.dueDate)}</strong>
                            {isPaid && sch.paidDate && ` • Dibayar: ${formatDateIndo(sch.paidDate)}`}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <span className="font-bold text-slate-900 text-sm">
                            {formatRupiah(sch.amount)}
                          </span>

                          {!isPaid && (
                            <button
                              onClick={() => onRecordCustomerPayment(selectedRecord.id, sch.id, sch.amount)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors shadow-xs cursor-pointer"
                            >
                              Catat Bayar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BAST Success Modal Notification */}
      {showBASTSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              BAST Berhasil Diproses &amp; Pendapatan Sah Diakui!
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sesuai standar <strong>PSAK 72</strong>, unit telah diserahterimakan ke konsumen. Sistem secara otomatis membuat jurnal akuntansi:
            </p>
            <div className="bg-slate-50 p-3 rounded-xl text-left font-mono text-[11px] text-slate-800 border border-slate-200 space-y-1">
              <div>[D] 2420 Liabilitas Kontrak: Rp 535.000.000</div>
              <div>[K] 4110 Pendapatan Penjualan: Rp 535.000.000</div>
              <div className="pt-1 border-t border-slate-200 text-slate-600">
                [D] 5100 Beban Pokok HPP: Rp 310.000.000<br />
                [K] 1320 Persediaan KDPP: Rp 310.000.000
              </div>
            </div>
            <button
              onClick={() => setShowBASTSuccessModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Tutup &amp; Lihat Laporan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
