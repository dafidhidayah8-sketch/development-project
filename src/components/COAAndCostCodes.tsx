import React, { useState } from 'react';
import { ChartOfAccount, CostCode, WBSNode } from '../types';
import { formatCompactRupiah, formatRupiah } from '../utils/formatters';
import { 
  BookOpen, 
  Layers, 
  Search, 
  ArrowRight, 
  CheckCircle, 
  Info,
  DollarSign,
  TrendingUp,
  Tag
} from 'lucide-react';

interface COAAndCostCodesProps {
  coaList: ChartOfAccount[];
  costCodes: CostCode[];
  wbsNodes: WBSNode[];
}

export const COAAndCostCodes: React.FC<COAAndCostCodesProps> = ({
  coaList,
  costCodes,
  wbsNodes
}) => {
  const [activeTab, setActiveTab] = useState<'COA' | 'COST_CODES' | 'DUAL_IDENTITY'>('COA');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredCOA = coaList.filter(item => {
    const matchSearch = item.code.includes(searchTerm) || item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const filteredCostCodes = costCodes.filter(c => {
    return c.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
           c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           c.wbsCode.includes(searchTerm);
  });

  return (
    <div className="space-y-6">
      {/* Header explanation banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              PRINSIP DUA IDENTITAS: AKUNTANSI &amp; KONTROL PROYEK
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              Chart of Accounts (COA) &amp; Project Cost Codes
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Akun Akuntansi Umum (COA 4-digit) mengatur Laporan Posisi Keuangan &amp; Laba Rugi sesuai standar PSAK 72 / SAK Entitas Privat. 
              Sementara <strong>Cost Code Proyek</strong> memecah biaya konstruksi per WBS, Blok, dan Unit untuk pengendalian real-time RAB.
            </p>
          </div>

          {/* Navigation Pills */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab('COA')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'COA' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. COA Akuntansi
            </button>
            <button
              onClick={() => setActiveTab('COST_CODES')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'COST_CODES' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Cost Code Proyek
            </button>
            <button
              onClick={() => setActiveTab('DUAL_IDENTITY')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'DUAL_IDENTITY' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Rahasia 2 Identitas
            </button>
          </div>
        </div>

        {/* Filter bar */}
        {activeTab !== 'DUAL_IDENTITY' && (
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-5 pt-4 border-t border-slate-100">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={activeTab === 'COA' ? "Cari nomor akun atau nama akun COA..." : "Cari kode biaya (e.g. BLD-001, INF-002)..."}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-indigo-500 text-slate-800"
              />
            </div>

            {activeTab === 'COA' && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-500 whitespace-nowrap">Kategori:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-semibold focus:outline-indigo-500"
                >
                  <option value="ALL">Semua Kategori (1000 - 5000)</option>
                  <option value="ASET">1000 - ASET (Kas, Bank, Persediaan)</option>
                  <option value="LIABILITAS">2000 - LIABILITAS (Hutang &amp; Uang Muka)</option>
                  <option value="EKUITAS">3000 - EKUITAS (Modal &amp; Laba)</option>
                  <option value="PENDAPATAN">4000 - PENDAPATAN (Penjualan Unit)</option>
                  <option value="BIAYA">5000 - BIAYA (Pengembangan Proyek)</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TAB 1: COA AKUNTANSI UMUM */}
      {activeTab === 'COA' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Struktur Chart of Accounts (COA) Developer Perumahan
            </span>
            <span className="text-xs text-slate-500">
              Total {filteredCOA.length} Akun Terdaftar
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Kode Akun</th>
                  <th className="py-3 px-4">Nama Akun &amp; Standar</th>
                  <th className="py-3 px-4">Kategori Akuntansi</th>
                  <th className="py-3 px-4">Saldo Normal</th>
                  <th className="py-3 px-4 text-right">Saldo Saat Ini</th>
                  <th className="py-3 px-4">Keterangan Khusus Developer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCOA.map((item) => (
                  <tr 
                    key={item.code} 
                    className={`hover:bg-slate-50 transition-colors ${item.isHeader ? 'bg-indigo-50/40 font-bold' : ''}`}
                  >
                    <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-900">
                      {item.code}
                    </td>
                    <td className="py-3 px-4">
                      <div className={`text-slate-900 ${item.isHeader ? 'font-bold text-indigo-950' : 'font-medium'}`}>
                        {item.name}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.category === 'ASET' ? 'bg-blue-100 text-blue-800' :
                        item.category === 'LIABILITAS' ? 'bg-amber-100 text-amber-800' :
                        item.category === 'EKUITAS' ? 'bg-purple-100 text-purple-800' :
                        item.category === 'PENDAPATAN' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {item.category} ({item.subCategory})
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-600">
                      {item.normalBalance}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-slate-900">
                      {formatRupiah(item.currentBalance)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs text-[11px] leading-snug">
                      {item.description || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: COST CODES KONSTRUKSI PROYEK */}
      {activeTab === 'COST_CODES' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Katalog Cost Code Proyek Berdasarkan WBS (Work Breakdown Structure)
            </span>
            <span className="text-xs text-slate-500">
              Total {filteredCostCodes.length} Cost Code
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Cost Code</th>
                  <th className="py-3 px-4">Nama Pekerjaan &amp; Uraian</th>
                  <th className="py-3 px-4">WBS Mapping</th>
                  <th className="py-3 px-4">COA Beban</th>
                  <th className="py-3 px-4 text-right">Budget RAB</th>
                  <th className="py-3 px-4 text-right">Komitmen PO</th>
                  <th className="py-3 px-4 text-right">Realisasi (Actual)</th>
                  <th className="py-3 px-4 text-right">Forecast (EAC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCostCodes.map((code) => {
                  const eac = code.actualAmount + code.forecastToComplete;
                  const isUnclassified = code.code === 'UNC-999';
                  return (
                    <tr key={code.code} className={`hover:bg-slate-50 transition-colors ${isUnclassified ? 'bg-amber-50/50' : ''}`}>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {code.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-900">{code.name}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{code.description}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-700">WBS {code.wbsCode}</span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                        {code.coaExpenseCode}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatCompactRupiah(code.budgetAllocated)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-amber-700 whitespace-nowrap">
                        {formatCompactRupiah(code.committedAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-cyan-700 whitespace-nowrap">
                        {formatCompactRupiah(code.actualAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-purple-700 whitespace-nowrap">
                        {formatCompactRupiah(eac)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DUAL IDENTITY EXPLANATION */}
      {activeTab === 'DUAL_IDENTITY' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Mengapa Satu Transaksi Harus Memiliki Dua Identitas?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Jika pembukuan hanya mengandalkan Akun Akuntansi (COA), manajemen hanya tahu bahwa uang keluar untuk 
              &quot;Hutang Supplier&quot; atau &quot;Persediaan&quot;. Manajemen kehilangan data penting:
              <strong> Uang itu untuk unit rumah yang mana? Apakah over-budget terhadap RAB pondasi? Berapa progresnya?</strong>
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sebaliknya, jika hanya mencatat proyek di catatan lapangan Excel, akuntan tidak bisa menyusun 
              Neraca, Laporan Arus Kas, dan kepatuhan pajak PSAK 72.
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-800 block">Struktur Dua Identitas di Sistem:</span>
              <div className="font-mono text-xs text-indigo-900 bg-white p-3 rounded-lg border border-slate-200">
                <div>TRANSAKSI (e.g. Pembelian Semen Rp 7.500.000)</div>
                <div className="ml-4">├── IDENTITAS AKUNTANSI (General Ledger)</div>
                <div className="ml-8">└── D: 1320 (KDPP/WIP) | K: 1120 (Bank BCA)</div>
                <div className="ml-4">└── IDENTITAS PROYEK (Cost Control)</div>
                <div className="ml-8">├── Proyek: Graha Asri Residence</div>
                <div className="ml-8">├── Lokasi: Blok A (Unit A01 - A05)</div>
                <div className="ml-8">├── WBS: 05 (Unit House)</div>
                <div className="ml-8">└── Cost Code: BLD-002 (Struktur Beton Bertulang)</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
              <Info className="w-5 h-5 text-amber-400" />
              Prinsip PSAK 72 &amp; SAK Entitas Privat untuk Developer
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="font-bold text-white block mb-1">1. Uang Masuk Konsumen ≠ Laba Langsung</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Berdasarkan PSAK 72 (menggantikan PSAK 44), penerimaan Booking Fee dan Angsuran DP belum boleh diakui sebagai Pendapatan. Uang masuk dicatat sebagai Liabilitas Kontrak (Akun 2420). Pendapatan baru diakui saat Serah Terima Kunci (BAST) ketika kendali unit diserahkan ke pembeli.
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="font-bold text-white block mb-1">2. Biaya Proyek ≠ Beban Berjalan Langsung</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Uang keluar untuk semen, tukang, paving, dan alat berat tidak langsung memotong laba sebagai Beban (Expense). Uang tersebut dikapitalisasi ke Aset Persediaan Properti Pengembangan (WIP/KDPP Akun 1320), dan baru menjadi Beban Pokok Penjualan (HPP) saat unit diserahterimakan.
                </p>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <span className="font-bold text-white block mb-1">3. Audit Trail Tanpa Hapus Data</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Transaksi yang sudah disetujui (POSTED/CLOSED) tidak boleh dihapus. Koreksi harus menggunakan mekanisme Reversal atau Penyesuaian bertanggal aktif untuk menjaga jejak audit internal dan perbankan.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
