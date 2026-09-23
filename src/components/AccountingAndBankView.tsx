import React, { useState } from 'react';
import { Transaction, BankAccount, ChartOfAccount, AgingItem } from '../types';
import { formatRupiah, formatCompactRupiah, formatDateIndo } from '../utils/formatters';
import { buildTrialBalance, getTrialBalanceTotals } from '../services/accountingEngine';
import { 
  BookOpen, 
  Wallet, 
  FileCheck2, 
  AlertTriangle, 
  ArrowRightLeft, 
  DollarSign, 
  Calendar,
  CheckCircle2,
  RefreshCw,
  Coins
} from 'lucide-react';

interface AccountingAndBankViewProps {
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  coaList: ChartOfAccount[];
  agingItems?: AgingItem[];
  onOpenBankReconciliation?: (accountId: string) => void;
}

export const AccountingAndBankView: React.FC<AccountingAndBankViewProps> = ({
  transactions,
  bankAccounts,
  coaList,
  agingItems = [],
  onOpenBankReconciliation
}) => {
  const totalAP = agingItems.filter(i => i.type === 'AP').reduce((sum, i) => sum + i.outstandingBalance, 0);
  const totalAR = agingItems.filter(i => i.type === 'AR').reduce((sum, i) => sum + i.outstandingBalance, 0);
  const pettyCash = bankAccounts.find(b => b.id === 'BNK-05');
  const [activeSubTab, setActiveSubTab] = useState<'JOURNAL' | 'TRIAL_BALANCE' | 'BANK_RECON' | 'AP_AR' | 'PETTY_CASH'>('JOURNAL');
  const trialBalance = buildTrialBalance(transactions, coaList);
  const trialBalanceTotals = getTrialBalanceTotals(trialBalance);

  const getAccountName = (code: string) => {
    const acc = coaList.find(c => c.code === code);
    return acc ? `${code} - ${acc.name}` : code;
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            Lapis Akuntansi, Rekonsiliasi Bank &amp; Kas
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dihasilkan otomatis dari transaksi operasional tanpa membebani operator lapangan
          </p>
        </div>

        <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('JOURNAL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === 'JOURNAL' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Jurnal Umum Otomatis
          </button>
          <button
            onClick={() => setActiveSubTab('TRIAL_BALANCE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === 'TRIAL_BALANCE' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Trial Balance
          </button>
          <button
            onClick={() => setActiveSubTab('BANK_RECON')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === 'BANK_RECON' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rekonsiliasi Bank &amp; Saldo
          </button>
          <button
            onClick={() => setActiveSubTab('AP_AR')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === 'AP_AR' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hutang &amp; Piutang (AP / AR)
          </button>
          <button
            onClick={() => setActiveSubTab('PETTY_CASH')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeSubTab === 'PETTY_CASH' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kas Kecil (Petty Cash)
          </button>
        </div>
      </div>

      {/* 1A. TRIAL BALANCE */}
      {activeSubTab === 'TRIAL_BALANCE' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Trial Balance / Neraca Saldo
              </span>
              <span className="text-[11px] text-slate-500">
                Saldo dihitung langsung dari jurnal transaksi yang berstatus POSTED.
              </span>
            </div>
            <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              Math.abs(trialBalanceTotals.difference) < 0.01
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}>
              Selisih Debit-Kredit: {formatRupiah(trialBalanceTotals.difference)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Kode</th>
                  <th className="py-3 px-4">Nama Akun</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4 text-right">Debit</th>
                  <th className="py-3 px-4 text-right">Kredit</th>
                  <th className="py-3 px-4 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trialBalance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      Belum ada jurnal POSTED untuk dibentuk menjadi neraca saldo.
                    </td>
                  </tr>
                ) : (
                  trialBalance.map(row => (
                    <tr key={row.accountCode} className="hover:bg-slate-50">
                      <td className="py-2.5 px-4 font-mono font-bold text-indigo-700">{row.accountCode}</td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">{row.accountName}</td>
                      <td className="py-2.5 px-4 text-slate-500">{row.category}</td>
                      <td className="py-2.5 px-4 text-right font-mono">{formatRupiah(row.debit)}</td>
                      <td className="py-2.5 px-4 text-right font-mono">{formatRupiah(row.credit)}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold">{formatRupiah(row.balance)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr className="font-bold">
                  <td colSpan={3} className="py-3 px-4">TOTAL</td>
                  <td className="py-3 px-4 text-right font-mono">{formatRupiah(trialBalanceTotals.debit)}</td>
                  <td className="py-3 px-4 text-right font-mono">{formatRupiah(trialBalanceTotals.credit)}</td>
                  <td className="py-3 px-4 text-right font-mono">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 1. GENERAL JOURNAL (JURNAL UMUM) */}
      {activeSubTab === 'JOURNAL' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Buku Jurnal Umum (General Journal) - Proyek Graha Asri
              </span>
              <span className="text-[11px] text-slate-500">
                Setiap transaksi otomatis mendebet aset proyek (KDPP/WIP) dan mengkredit kas/hutang
              </span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 font-semibold">
              Kepatuhan SAK EP / PSAK 72
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tanggal &amp; No Ref</th>
                  <th className="py-3 px-4">Keterangan / Uraian Jurnal</th>
                  <th className="py-3 px-4">Kode &amp; Nama Akun COA</th>
                  <th className="py-3 px-4 text-right">Debet (Rp)</th>
                  <th className="py-3 px-4 text-right">Kredit (Rp)</th>
                  <th className="py-3 px-4 text-center">Status Jurnal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => {
                  const journalLines = tx.journalLines && tx.journalLines.length > 0
                    ? tx.journalLines
                    : [
                        { accountCode: tx.debitAccountCode, debit: tx.totalAmount, credit: 0 },
                        { accountCode: tx.creditAccountCode, debit: 0, credit: tx.totalAmount },
                      ];

                  return (
                    <React.Fragment key={tx.id}>
                      {journalLines.map((line, index) => (
                        <tr
                          key={`${tx.id}-${line.accountCode}-${index}`}
                          className="hover:bg-slate-50 border-b border-slate-100"
                        >
                          {index === 0 && (
                            <>
                              <td
                                className="py-2.5 px-4 font-mono font-medium text-slate-800"
                                rowSpan={journalLines.length}
                              >
                                <div>{formatDateIndo(tx.date)}</div>
                                <div className="text-[11px] text-indigo-700">{tx.id}</div>
                              </td>
                              <td
                                className="py-2.5 px-4 font-medium text-slate-900"
                                rowSpan={journalLines.length}
                              >
                                <div>{tx.subcategory}</div>
                                <div className="text-[11px] text-slate-500">{tx.description}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Cost Code: {tx.costCode} • Party: {tx.partyName}
                                </div>
                              </td>
                            </>
                          )}

                          <td
                            className={`py-2.5 px-4 font-mono font-medium ${
                              index > 0 ? 'text-slate-600 pl-8' : 'text-slate-800'
                            }`}
                          >
                            {index > 0 ? '└── ' : ''}
                            {getAccountName(line.accountCode)}
                          </td>

                          <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                            {line.debit > 0 ? formatRupiah(line.debit) : '-'}
                          </td>

                          <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                            {line.credit > 0 ? formatRupiah(line.credit) : '-'}
                          </td>

                          {index === 0 && (
                            <td
                              className="py-2.5 px-4 text-center"
                              rowSpan={journalLines.length}
                            >
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  tx.journalPosted
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {tx.journalPosted ? 'POSTED' : 'MENUNGGU OTORISASI'}
                              </span>
                            </td>
                          )}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. BANK RECONCILIATION */}
      {activeSubTab === 'BANK_RECON' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bankAccounts.map((b) => {
              const hasDiff = b.unreconciledDifference !== 0;
              return (
                <div 
                  key={b.id} 
                  className={`p-5 rounded-2xl border shadow-sm ${
                    hasDiff ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">{b.bankName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      hasDiff ? 'bg-amber-200 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {hasDiff ? 'SELISIH TERDETEKSI' : 'REKONSILIASI COCOK'}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{b.name}</h3>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{b.accountNumber}</div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Saldo Menurut Sistem:</span>
                      <span className="font-bold text-slate-900">{formatRupiah(b.currentBalance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Saldo Rekening Koran:</span>
                      <span className="font-bold text-slate-900">{formatRupiah(b.statementBalance)}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-1 border-t border-slate-200/50">
                      <span className={hasDiff ? 'text-amber-800' : 'text-slate-700'}>Selisih (Variance):</span>
                      <span className={hasDiff ? 'text-rose-600' : 'text-emerald-600'}>
                        {formatRupiah(b.unreconciledDifference)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {(() => {
            const bca = bankAccounts.find(b => b.id === 'BNK-02');
            const diff = bca?.unreconciledDifference || 0;
            if (!bca || diff === 0) return null;
            return (
              <div className="p-6 bg-amber-50/90 rounded-2xl border border-amber-200 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>Selisih Rekonsiliasi {bca.name}</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Selisih berasal dari perbandingan saldo sistem dan rekening koran yang tersimpan pada master rekening.
                  Nilai saat ini: <strong>{formatRupiah(diff)}</strong>.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  {onOpenBankReconciliation && (
                    <button
                      onClick={() => onOpenBankReconciliation(bca.id)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                    >
                      Buka Rekonsiliasi
                    </button>
                  )}
                  <span className="text-xs text-amber-800 font-medium">Menunggu verifikasi mutasi rekening.</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 3. AP & AR STATUS */}
      {activeSubTab === 'AP_AR' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AP (Account Payable) */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Daftar Hutang Usaha (AP - Accounts Payable)</h3>
                <span className="text-xs text-slate-500">Kewajiban kepada Supplier &amp; Kontraktor yang belum dibayar</span>
              </div>
              <span className="text-lg font-extrabold text-rose-600">{formatCompactRupiah(totalAP)}</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">CV Graha Material Abadi (Supplier Semen &amp; Bata)</div>
                  <div className="text-[11px] text-slate-500">Invoice: INV-2026-041 • Jatuh Tempo: 30-09-2026</div>
                </div>
                <div className="text-right font-bold text-slate-900">
                  <div>Rp 215.000.000</div>
                  <span className="text-[10px] text-amber-700 font-semibold">Jatuh Tempo 7 Hari</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">PA DIDI (Mandor Borongan Struktur Unit A01-A03)</div>
                  <div className="text-[11px] text-slate-500">Klaim: KLAIM-DIDI-01 • Status: Dokumen SPK Pending</div>
                </div>
                <div className="text-right font-bold text-rose-600">
                  <div>Rp 17.500.000</div>
                  <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold">BUTUH SPK</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Hutang Retensi Konstruksi (5%) Mandor Sunaris &amp; Balony</div>
                  <div className="text-[11px] text-slate-500">Masa Pemeliharaan s/d Desember 2026</div>
                </div>
                <div className="text-right font-bold text-slate-700">
                  <div>Rp 75.000.000</div>
                  <span className="text-[10px] text-slate-400">Jaminan Retensi</span>
                </div>
              </div>
            </div>
          </div>

          {/* AR (Account Receivable) */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Piutang Penjualan Unit (AR - Accounts Receivable)</h3>
                <span className="text-xs text-slate-500">Jadwal penagihan DP &amp; akad kredit KPR konsumen</span>
              </div>
              <span className="text-lg font-extrabold text-indigo-700">{formatCompactRupiah(totalAR)}</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Unit A01 - Ny. Siti Rahmawati (Tipe 36/60)</div>
                  <div className="text-[11px] text-slate-500">Harga: Rp 385 Jt • DP Terbayar: Rp 115.5 Jt</div>
                </div>
                <div className="text-right font-bold text-indigo-900">
                  <div>Rp 269.500.000</div>
                  <span className="text-[10px] text-emerald-700 font-semibold">Menunggu Akad KPR</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Unit A02 - Bpk. Hendra Wijaya (Tipe 36/60)</div>
                  <div className="text-[11px] text-slate-500">Harga: Rp 385 Jt • DP Terbayar: Rp 77 Jt</div>
                </div>
                <div className="text-right font-bold text-indigo-900">
                  <div>Rp 308.000.000</div>
                  <span className="text-[10px] text-amber-700 font-semibold">Cicilan DP 3/6</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">Unit A03 - Bpk. Agus Santoso (Tipe 36/60)</div>
                  <div className="text-[11px] text-slate-500">Harga: Rp 395 Jt • Booking Fee: Rp 10 Jt</div>
                </div>
                <div className="text-right font-bold text-indigo-900">
                  <div>Rp 385.000.000</div>
                  <span className="text-[10px] text-slate-500">Jadwal DP 1: 05-10-2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. PETTY CASH (KAS KECIL) */}
      {activeSubTab === 'PETTY_CASH' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">Sistem Imprest Kas Kecil</span>
              <h3 className="text-lg font-bold text-slate-900">Kas Kecil Lapangan (Petty Cash Proyek)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Saldo kas kecil bersumber dari rekening BNK-05 di master Kas &amp; Bank.
              </p>
            </div>
                        <span className="text-xs font-semibold text-slate-500">
              Saldo sistem: {formatRupiah(pettyCash?.currentBalance || 0)} • Selisih: {formatRupiah(pettyCash?.unreconciledDifference || 0)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">Plafon Awal</span>
              <span className="text-base font-bold text-slate-900">{formatRupiah(pettyCash?.statementBalance || 0)}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">Biaya Terpakai</span>
              <span className="text-base font-bold text-rose-600">{formatRupiah(Math.max(0, (pettyCash?.statementBalance || 0) - (pettyCash?.currentBalance || 0)))}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">Sisa Saldo Kas Fisik</span>
              <span className="text-base font-bold text-emerald-700">{formatRupiah(pettyCash?.currentBalance || 0)}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">Status Rekening</span>
              <span className="text-base font-bold text-slate-800">{pettyCash ? 'Aktif' : 'Belum tersedia'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
