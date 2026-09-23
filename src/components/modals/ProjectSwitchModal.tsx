import React from 'react';
import { Building2, Plus, Check, X, ShieldAlert, Sparkles } from 'lucide-react';
import { Project } from '../../types';

interface ProjectSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onAddNewProject: () => void;
  onLoadDemoProject: () => void;
}

export const ProjectSwitchModal: React.FC<ProjectSwitchModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onAddNewProject,
  onLoadDemoProject,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-100">
        
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">PILIH PROJECT AKTIF</h2>
              <p className="text-xs text-slate-400">Beralih database kontrol dan akuntansi proyek</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3">
          <div className="text-xs text-slate-400 pb-1">
            Data transaksi, kas, WBS, hutang, dan laporan terisolasi penuh per project.
          </div>

          <div className="space-y-2">
            {projects.map(p => {
              const isActive = p.id === activeProjectId;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectProject(p.id);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isActive 
                      ? 'bg-indigo-600/10 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30' 
                      : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{p.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {p.code}
                      </span>
                      {p.isDemo ? (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Demo / Simulasi
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Produksi
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {p.developerCompany || 'PT Developer'} • {p.location} • {p.targetUnits} Unit
                    </div>
                  </div>

                  {isActive && (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-2">
          <button
            onClick={() => {
              onLoadDemoProject();
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-amber-400 hover:bg-amber-400/10 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Muat Data Demo Graha Asri</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onAddNewProject();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Buat Project Baru</span>
          </button>
        </div>

      </div>
    </div>
  );
};
