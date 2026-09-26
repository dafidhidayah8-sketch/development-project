import React, { useState } from 'react';
import { NotificationAlert, UserRole } from '../types';
import { formatCompactRupiah } from '../utils/formatters';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  X, 
  ShieldAlert, 
  Send,
  UserCheck
} from 'lucide-react';

interface NotificationAlertCenterProps {
  alerts: NotificationAlert[];
  currentRole: UserRole;
  onSelectAlert: (alert: NotificationAlert) => void;
  onMarkAllAsRead: () => void;
  onViewAllHistory?: () => void;
}

export const NotificationAlertCenter: React.FC<NotificationAlertCenterProps> = ({
  alerts,
  currentRole,
  onSelectAlert,
  onMarkAllAsRead,
  onViewAllHistory
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [filterRole, setFilterRole] = useState<string>('ALL');

  // Filter alerts based on role or selection
  const roleAlerts = alerts.filter(a => {
    if (filterRole === 'ALL') return true;
    return a.targetRoles.includes(filterRole as UserRole);
  });

  const unreadCount = alerts.filter(a => !a.read).length;

  return (
    <div className="relative">
      {/* Bell Button with Pulse Indicator */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        title="Pusat Notifikasi & Alert Otorisasi PM/Direksi"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[10px] font-bold text-white items-center justify-center">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Alert &amp; Notifikasi Cepat</h4>
                <p className="text-[10px] text-slate-300">
                  {unreadCount} notifikasi menunggu review ({currentRole})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={onMarkAllAsRead}
                className="text-[10px] text-indigo-300 hover:text-white px-2 py-1 rounded bg-slate-800 transition-colors cursor-pointer"
                title="Tandai semua telah dibaca"
              >
                Tandai Dibaca
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Role Filter Tabs */}
          <div className="flex border-b border-slate-100 bg-slate-50 text-[11px] p-1 gap-1">
            <button
              onClick={() => setFilterRole('ALL')}
              className={`flex-1 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterRole === 'ALL' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500'
              }`}
            >
              Semua ({alerts.length})
            </button>
            <button
              onClick={() => setFilterRole('DIREKSI')}
              className={`flex-1 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterRole === 'DIREKSI' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500'
              }`}
            >
              Direksi
            </button>
            <button
              onClick={() => setFilterRole('PROJECT_MANAGER')}
              className={`flex-1 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterRole === 'PROJECT_MANAGER' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500'
              }`}
            >
              PM
            </button>
            <button
              onClick={() => setFilterRole('FINANCE')}
              className={`flex-1 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterRole === 'FINANCE' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500'
              }`}
            >
              Finance
            </button>
          </div>

          {/* Notification List Scrollable */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {roleAlerts.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Tidak ada notifikasi aktif untuk peran ini.
              </div>
            ) : (
              roleAlerts.map((alert) => {
                const isPending = alert.type === 'PENDING_APPROVAL';
                const isWarning = alert.type === 'CONTROL_WARNING';
                const isOverdue = alert.type === 'AP_OVERDUE' || alert.type === 'AR_OVERDUE';

                return (
                  <div
                    key={alert.id}
                    onClick={() => {
                      onSelectAlert(alert);
                      setIsOpen(false);
                    }}
                    className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${
                      !alert.read ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    <span className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
                      isPending ? 'bg-indigo-100 text-indigo-700' :
                      isWarning ? 'bg-amber-100 text-amber-700' :
                      isOverdue ? 'bg-rose-100 text-rose-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {isPending ? <UserCheck className="w-4 h-4" /> :
                       isWarning ? <AlertTriangle className="w-4 h-4" /> :
                       isOverdue ? <Clock className="w-4 h-4" /> :
                       <CheckCircle className="w-4 h-4" />}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {alert.title}
                        </span>
                        {!alert.read && (
                          <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 mt-0.5 leading-snug line-clamp-2">
                        {alert.message}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/60 text-[10px]">
                        <span className="text-slate-400 font-medium">{alert.timestamp}</span>
                        {alert.amount && (
                          <span className="font-bold text-indigo-700">
                            {formatCompactRupiah(alert.amount)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer to View Full Notification History */}
          {onViewAllHistory && (
            <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onViewAllHistory();
                }}
                className="w-full py-1.5 px-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50/80 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Buka Tab &apos;Notification History&apos; &amp; Audit Log</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
