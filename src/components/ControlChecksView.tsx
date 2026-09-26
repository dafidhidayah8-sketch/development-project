import React, { useState } from 'react';
import { ControlCheckItem, Transaction, AuditLog } from '../types';
import { formatRupiah, formatCompactRupiah, formatDateTimeIndo } from '../utils/formatters';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ArrowRight, 
  History, 
  FileSearch,
  Sparkles
} from 'lucide-react';

interface ControlChecksViewProps {
  controlChecks: ControlCheckItem[];
  auditLogs: AuditLog[];
}

export const ControlChecksView: React.FC<ControlChecksViewProps> = ({
  controlChecks,
  auditLogs,
}) => {
  const [activeTab, setActiveTab] = useState<'CHECKS' | 'AUDIT_LOGS'>('CHECKS');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              SISTEM KONTROL INTERNAL &amp; REKONSILIASI PROJECT AKTIF
            </span>
            <h2 className="text-xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-amber-600" />
              Project Control Checks, Ambiguity &amp; Audit Trail
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Mendeteksi kondisi aktual project aktif seperti klasifikasi biaya yang belum lengkap, pembayaran tanpa rekening sumber, selisih bank, over-budget, dan duplikasi transaksi agar kontrol biaya tetap dapat ditelusuri.
            </p>
          </div>

          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab('CHECKS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'CHECKS' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Control Checks &amp; Solusi
            </button>
            <button
              onClick={() => setActiveTab('AUDIT_LOGS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'AUDIT_LOGS' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Jejak Audit Trail (Log)
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'CHECKS' && (
        <div className="space-y-4">
          {controlChecks.map((item) => {
            const isCritical = item.status === 'CRITICAL_BLOCK';
            const isWarning = item.status === 'WARNING';

            return (
              <div 
                key={item.code}
                className={`p-5 rounded-2xl border shadow-sm transition-all bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCritical ? 'border-rose-200 hover:border-rose-400' : isWarning ? 'border-amber-200 hover:border-amber-400' : 'border-emerald-200'
                }`}
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-xs px-2 py-0.5 bg-slate-100 rounded">
                      {item.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isCritical ? 'bg-rose-100 text-rose-800' : isWarning ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {item.status}
                    </span>
                    {item.impactAmount > 0 && (
                      <span className="text-xs font-bold text-slate-700">
                        Nilai Terdampak: {formatRupiah(item.impactAmount)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                  <div className="text-xs font-medium text-indigo-900 bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100 mt-2">
                    <strong>Rekomendasi Manajemen: </strong>{item.actionRequired}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'AUDIT_LOGS' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Jejak Audit Sistem
            </span>
            <span className="text-xs text-slate-500">Mencatat Siapa, Apa, Kapan, Nilai, dan Keputusan</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Waktu &amp; Tanggal</th>
                  <th className="py-3 px-4">Pengguna &amp; Peran</th>
                  <th className="py-3 px-4">Aksi Audit</th>
                  <th className="py-3 px-4">No Record / Referensi</th>
                  <th className="py-3 px-4">Uraian Kejadian &amp; Alasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-900">
                      {log.userName} <span className="text-indigo-600 font-bold">({log.userRole})</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.action === 'APPROVE' ? 'bg-emerald-100 text-emerald-800' :
                        log.action === 'CREATE' ? 'bg-blue-100 text-blue-800' :
                        log.action === 'CORRECTION' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-indigo-700">
                      {log.recordId}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {log.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
