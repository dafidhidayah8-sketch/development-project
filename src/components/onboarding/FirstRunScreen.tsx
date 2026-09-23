import React from 'react';
import { 
  Building2, 
  PlusCircle, 
  ArrowRight, 
  PlayCircle, 
  ShieldCheck, 
  Layers, 
  Database,
  Coins
} from 'lucide-react';

interface FirstRunScreenProps {
  onStartSetup: () => void;
  onStartMigration: () => void;
  onLoadDemo: () => void;
}

export const FirstRunScreen: React.FC<FirstRunScreenProps> = ({
  onStartSetup,
  onStartMigration,
  onLoadDemo,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100 font-sans p-4 sm:p-8">
      {/* Top Brand */}
      <div className="max-w-4xl mx-auto w-full pt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider uppercase text-indigo-400">
              SISTEM KONTROL PROYEK &amp; AKUNTANSI DEVELOPER
            </h1>
            <p className="text-xs text-slate-400">Real Estate Financial &amp; Construction Governance Engine</p>
          </div>
        </div>
      </div>

      {/* Main Focus Card */}
      <div className="max-w-xl mx-auto w-full my-auto py-8">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
          
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 mx-auto flex items-center justify-center mb-6 shadow-inner text-indigo-400">
            <Database className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
            BELUM ADA PROJECT
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-md mx-auto">
            Sistem akuntansi dan kontrol biaya berjalan pada basis data bersih. 
            Mulai dengan membuat project baru atau masukkan data migrasi project yang sedang berlangsung.
          </p>

          <div className="space-y-3.5">
            {/* Primary Action: Create Project */}
            <button
              onClick={onStartSetup}
              className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>+ BUAT PROJECT PERTAMA</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            {/* Secondary Action: Migration */}
            <button
              onClick={onStartMigration}
              className="w-full py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>MIGRASI PROJECT BERJALAN</span>
            </button>

            {/* Tertiary Action: Load Demo */}
            <div className="pt-4 border-t border-slate-800/80">
              <button
                onClick={onLoadDemo}
                className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors py-1 px-3 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Atau Muat Data Simulasi / Demo (Graha Asri)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 text-xs text-slate-400">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Pemisahan Modal &amp; Kas</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>Audit Trail &amp; Outbox</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/60">
            <Database className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Persistensi Browser Aman</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto w-full text-center pb-2 text-[11px] text-slate-400">
        Single Source of Truth • Real Calculation • Anti-Mockup Engine
      </div>
    </div>
  );
};
