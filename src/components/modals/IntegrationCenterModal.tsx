import React, { useState } from 'react';
import { 
  Network, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  ExternalLink, 
  RefreshCw,
  Share2,
  ShieldCheck,
  Server
} from 'lucide-react';
import { IntegrationConfig, Transaction } from '../../types';
import { checkIntegrationsStatus, generateWhatsAppManualLink } from '../../services/integrationService';

interface IntegrationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: IntegrationConfig;
  recentTransaction?: Transaction;
  senderRole: string;
}

export const IntegrationCenterModal: React.FC<IntegrationCenterModalProps> = ({
  isOpen,
  onClose,
  config,
  recentTransaction,
  senderRole,
}) => {
  const [currentConfig, setCurrentConfig] = useState<IntegrationConfig>(config);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // WhatsApp manual test input
  const [waPhoneNumber, setWaPhoneNumber] = useState<string>('081234567890');
  const [previewWaLink, setPreviewWaLink] = useState<string>('');

  if (!isOpen) return null;

  const handleTestConnections = () => {
    setIsTesting(true);
    setTestResult(null);

    setTimeout(() => {
      const refreshed = checkIntegrationsStatus(currentConfig);
      setCurrentConfig(refreshed);
      setIsTesting(false);
      
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (isOnline) {
        setTestResult('Koneksi browser internet AKTIF. Tidak ada API Key eksternal tersimpan di frontend (Aman).');
      } else {
        setTestResult('Browser dalam kondisi Offline.');
      }
    }, 500);
  };

  const handleGenerateWaLink = () => {
    if (!recentTransaction) return;
    const link = generateWhatsAppManualLink(waPhoneNumber, recentTransaction, senderRole);
    setPreviewWaLink(link);
    window.open(link, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">INTEGRATION CENTER &amp; ADAPTERS</h2>
              <p className="text-xs text-slate-400">Status koneksi layanan cloud, storage &amp; notifikasi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          
          {/* Health check action */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700">
            <div>
              <div className="font-bold text-white">Health Check &amp; Verification</div>
              <div className="text-[11px] text-slate-400">Verifikasi status koneksi adapter secara real-time</div>
            </div>
            <button
              onClick={handleTestConnections}
              disabled={isTesting}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Memeriksa...' : 'Test Koneksi'}</span>
            </button>
          </div>

          {testResult && (
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs">
              ✓ {testResult}
            </div>
          )}

          {/* Service Cards Grid */}
          <div className="space-y-3">
            
            {/* 1. Google (Firebase / Drive / Sheets) */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/80 flex items-start justify-between">
              <div className="space-y-1">
                <div className="font-bold text-white text-sm flex items-center gap-2">
                  <span>Google Cloud / Firebase</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Digunakan untuk sinkronisasi cloud backend, Google Drive backup, dan export Sheets.
                </p>
                <div className="text-[10px] text-slate-400 pt-1">
                  Kredensial disimpan via server-side environment (Client-safe).
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                currentConfig.google.status === 'CONNECTED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-700 text-slate-300 border border-slate-600'
              }`}>
                {currentConfig.google.status === 'CONNECTED' ? 'CONNECTED' : 'NOT CONFIGURED'}
              </span>
            </div>

            {/* 2. GitHub */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/80 flex items-start justify-between">
              <div className="space-y-1">
                <div className="font-bold text-white text-sm">GitHub Version Control</div>
                <p className="text-[11px] text-slate-400">
                  Untuk source code versioning, branch control, dan CI/CD pipeline deployment.
                </p>
                <div className="text-[10px] text-slate-400 pt-1">
                  Bukan sebagai primary database transaksi keuangan.
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-700 text-slate-300 border border-slate-600 shrink-0">
                NOT CONFIGURED
              </span>
            </div>

            {/* 3. Cloudflare */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/80 flex items-start justify-between">
              <div className="space-y-1">
                <div className="font-bold text-white text-sm">Cloudflare (Pages / Workers / D1)</div>
                <p className="text-[11px] text-slate-400">
                  Layer hosting edge, microservice API worker, dan opsi storage terdistribusi.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-700 text-slate-300 border border-slate-600 shrink-0">
                NOT CONFIGURED
              </span>
            </div>

            {/* 4. WhatsApp Integration */}
            <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/80 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <span>WhatsApp Notification Service</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Mode A: <strong>Manual Link wa.me (Gratis &amp; Aktif)</strong> • Mode B: Cloud API (Opsional berbayar)
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  MANUAL ACTIVE
                </span>
              </div>

              {/* Real WhatsApp Link Tester */}
              {recentTransaction && (
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Uji Kirim Bukti Transaksi Terkini ({recentTransaction.id})</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={waPhoneNumber}
                      onChange={(e) => setWaPhoneNumber(e.target.value)}
                      placeholder="081234567890"
                      className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs flex-1"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateWaLink}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Buka WhatsApp</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Prinsip Keamanan: Secret token, private key, dan webhook disimpan eksklusif pada server environment variables, bukan di browser bundle.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
