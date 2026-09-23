import React, { useState, useMemo } from 'react';
import { 
  NotificationAlert, 
  NotificationSeverity, 
  NotificationType, 
  NotificationAuditStatus,
  UserRole 
} from '../types';
import { formatCompactRupiah, formatRupiah, formatDateIndo } from '../utils/formatters';
import { 
  Bell, 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  UserCheck, 
  Filter, 
  Search, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  FileText, 
  Check, 
  X, 
  Download, 
  RefreshCw, 
  ArrowUpDown,
  Sparkles,
  History,
  MessageSquare,
  Building2,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface NotificationHistoryViewProps {
  alerts: NotificationAlert[];
  activeRole: UserRole;
  onUpdateAlertStatus: (alertId: string, newStatus: NotificationAuditStatus, note: string, responderName: string) => void;
  onToggleRead: (alertId: string) => void;
  onMarkAllAsRead: () => void;
  onSelectTransaction?: (txId: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const NotificationHistoryView: React.FC<NotificationHistoryViewProps> = ({
  alerts,
  activeRole,
  onUpdateAlertStatus,
  onToggleRead,
  onMarkAllAsRead,
  onSelectTransaction,
  onNavigateToTab
}) => {
  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedAuditStatus, setSelectedAuditStatus] = useState<string>('ALL');
  const [datePreset, setDatePreset] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Response Tracking Modal / Drawer
  const [activeResponseAlert, setActiveResponseAlert] = useState<NotificationAlert | null>(null);
  const [responseStatusInput, setResponseStatusInput] = useState<NotificationAuditStatus>('RESOLVED');
  const [responseNoteInput, setResponseNoteInput] = useState<string>('');

  // Sorting
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Filter Logic
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      // 1. Search filter
      const term = searchTerm.toLowerCase();
      const matchSearch = 
        alert.title.toLowerCase().includes(term) ||
        alert.message.toLowerCase().includes(term) ||
        alert.id.toLowerCase().includes(term) ||
        (alert.txId && alert.txId.toLowerCase().includes(term)) ||
        (alert.unitId && alert.unitId.toLowerCase().includes(term)) ||
        (alert.category && alert.category.toLowerCase().includes(term));

      if (!matchSearch) return false;

      // 2. Severity filter
      const alertSeverity = alert.severity || alert.priority;
      if (selectedSeverity !== 'ALL' && alertSeverity !== selectedSeverity) {
        return false;
      }

      // 3. Type filter
      if (selectedType !== 'ALL' && alert.type !== selectedType) {
        return false;
      }

      // 4. Audit Status filter
      const status = alert.auditStatus || 'PENDING';
      if (selectedAuditStatus !== 'ALL' && status !== selectedAuditStatus) {
        return false;
      }

      // 5. Date filter
      const alertDate = alert.date || alert.timestamp.substring(0, 10);
      if (datePreset === 'TODAY') {
        if (alertDate !== '2026-09-23') return false;
      } else if (datePreset === 'LAST_7_DAYS') {
        if (alertDate < '2026-09-16') return false;
      } else if (datePreset === 'SEP_2026') {
        if (!alertDate.startsWith('2026-09')) return false;
      } else if (datePreset === 'AUG_2026') {
        if (!alertDate.startsWith('2026-08')) return false;
      } else if (datePreset === 'CUSTOM') {
        if (startDate && alertDate < startDate) return false;
        if (endDate && alertDate > endDate) return false;
      }

      return true;
    }).sort((a, b) => {
      const dateA = a.date || a.timestamp;
      const dateB = b.date || b.timestamp;
      return sortOrder === 'desc' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
    });
  }, [alerts, searchTerm, selectedSeverity, selectedType, selectedAuditStatus, datePreset, startDate, endDate, sortOrder]);

  // Pagination calculation
  const totalItems = filteredAlerts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedAlerts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAlerts.slice(startIndex, startIndex + pageSize);
  }, [filteredAlerts, currentPage, pageSize]);

  // Handle page change safely
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Reset page when filter changes
  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    setter(value);
    setCurrentPage(1);
  };

  // Open Response Modal
  const handleOpenResponseModal = (alert: NotificationAlert) => {
    setActiveResponseAlert(alert);
    setResponseStatusInput(alert.auditStatus === 'RESOLVED' ? 'RESOLVED' : 'RESOLVED');
    setResponseNoteInput(alert.responseNote || '');
  };

  const handleSaveResponse = () => {
    if (!activeResponseAlert) return;
    const responder = `${activeRole} User (${activeRole === 'DIREKSI' ? 'Ir. Hartono' : activeRole === 'PROJECT_MANAGER' ? 'Budi Santoso' : 'Siti Rahayu'})`;
    onUpdateAlertStatus(activeResponseAlert.id, responseStatusInput, responseNoteInput, responder);
    setActiveResponseAlert(null);
  };

  // Summary Metrics
  const totalCount = alerts.length;
  const criticalCount = alerts.filter(a => (a.severity || a.priority) === 'CRITICAL').length;
  const highCount = alerts.filter(a => (a.severity || a.priority) === 'HIGH').length;
  const pendingActionCount = alerts.filter(a => !a.auditStatus || a.auditStatus === 'PENDING' || a.auditStatus === 'IN_PROGRESS').length;
  const resolvedCount = alerts.filter(a => a.auditStatus === 'RESOLVED').length;

  const getSeverityBadge = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase">Critical</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 uppercase">High</span>;
      case 'MEDIUM':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase">Medium</span>;
      case 'LOW':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">Low</span>;
    }
  };

  const getAuditStatusBadge = (status?: NotificationAuditStatus) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Selesai (Resolved)
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Clock className="w-3 h-3" />
            Sedang Diproses
          </span>
        );
      case 'ACKNOWLEDGED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
            <UserCheck className="w-3 h-3" />
            Diakui (Acknowledged)
          </span>
        );
      case 'DISMISSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Diabaikan
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
            <AlertCircle className="w-3 h-3" />
            Menunggu Tindakan
          </span>
        );
    }
  };

  const getTypeLabel = (type: NotificationType) => {
    switch (type) {
      case 'PENDING_APPROVAL':
        return { label: 'Otorisasi Transaksi', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'CONTROL_WARNING':
        return { label: 'Peringatan Kontrol', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'AP_OVERDUE':
        return { label: 'Hutang Usaha (AP)', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'AR_OVERDUE':
        return { label: 'Piutang Konsumen (AR)', color: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'BAST_READY':
        return { label: 'BAST PSAK 72', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'RECONCILIATION_FLAG':
        return { label: 'Rekonsiliasi Bank', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
      case 'BUDGET_OVERRUN':
        return { label: 'Peringatan Budget', color: 'bg-red-50 text-red-700 border-red-200' };
      case 'OPNAME_VERIFICATION':
        return { label: 'Opname Lapangan', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: type, color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['ID', 'Tanggal', 'Tingkat Bahaya', 'Tipe', 'Judul', 'Pesan', 'Status Audit', 'Responded By', 'Catatan'];
    const rows = filteredAlerts.map(a => [
      a.id,
      a.date || a.timestamp,
      a.severity || a.priority,
      a.type,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.message.replace(/"/g, '""')}"`,
      a.auditStatus || 'PENDING',
      a.respondedBy || '-',
      `"${(a.responseNote || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Notification_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AUDIT TRAIL &amp; COMPLIANCE LOG
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                TOTAL: {totalCount} NOTIFIKASI
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <History className="w-7 h-7 text-indigo-400" />
              Notification History &amp; Audit Response Tracking
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Arsip riwayat lengkap seluruh peringatan sistem, approval yang tertunda, deteksi anomali biaya, dan 
              tindak lanjut audit dari manajemen (Direksi, PM, &amp; Finance) untuk kepatuhan tata kelola proyek properti.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              title="Unduh log riwayat audit dalam format CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Ekspor CSV
            </button>
            <button
              onClick={onMarkAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Tandai Semua Dibaca
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/60">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
            <span className="text-xs text-slate-400 font-medium">1. Total Arsip Notifikasi</span>
            <div className="text-xl font-bold text-white mt-1">{totalCount} Item</div>
            <span className="text-[10px] text-slate-400">Seluruh modul operasional</span>
          </div>

          <div className="bg-rose-950/40 rounded-xl p-3 border border-rose-800/40">
            <span className="text-xs text-rose-300 font-medium">2. Isu Tingkat Kritis / Tinggi</span>
            <div className="text-xl font-bold text-rose-400 mt-1">{criticalCount + highCount} Item</div>
            <span className="text-[10px] text-rose-300">{criticalCount} Kritis • {highCount} Tinggi</span>
          </div>

          <div className="bg-amber-950/40 rounded-xl p-3 border border-amber-800/40">
            <span className="text-xs text-amber-300 font-medium">3. Menunggu Tindak Lanjut</span>
            <div className="text-xl font-bold text-amber-400 mt-1">{pendingActionCount} Item</div>
            <span className="text-[10px] text-amber-300">Memerlukan review respon</span>
          </div>

          <div className="bg-emerald-950/40 rounded-xl p-3 border border-emerald-800/40">
            <span className="text-xs text-emerald-300 font-medium">4. Selesai Ditindaklanjuti</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">{resolvedCount} Item</div>
            <span className="text-[10px] text-emerald-300">Teredukasi &amp; terekam audit</span>
          </div>
        </div>
      </div>

      {/* Filter & Control Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
              placeholder="Cari kata kunci, judul, No. Transaksi, atau Unit..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-indigo-500 bg-white"
            />
          </div>

          {/* Severity & Type Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Severity Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">Tingkat (Severity):</span>
              <select
                value={selectedSeverity}
                onChange={(e) => handleFilterChange(setSelectedSeverity, e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
              >
                <option value="ALL">Semua Tingkat</option>
                <option value="CRITICAL">Critical (Kritis)</option>
                <option value="HIGH">High (Tinggi)</option>
                <option value="MEDIUM">Medium (Sedang)</option>
                <option value="LOW">Low (Rendah)</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">Tipe:</span>
              <select
                value={selectedType}
                onChange={(e) => handleFilterChange(setSelectedType, e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
              >
                <option value="ALL">Semua Tipe</option>
                <option value="PENDING_APPROVAL">Otorisasi Transaksi</option>
                <option value="CONTROL_WARNING">Peringatan Kontrol</option>
                <option value="AP_OVERDUE">Hutang Usaha (AP)</option>
                <option value="AR_OVERDUE">Piutang Konsumen (AR)</option>
                <option value="BAST_READY">BAST PSAK 72</option>
                <option value="BUDGET_OVERRUN">Peringatan Budget</option>
                <option value="RECONCILIATION_FLAG">Rekonsiliasi Bank</option>
                <option value="OPNAME_VERIFICATION">Opname Lapangan</option>
              </select>
            </div>

            {/* Date Range Dropdown Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">Rentang Tanggal (Date Range):</span>
              <select
                value={datePreset}
                onChange={(e) => handleFilterChange(setDatePreset, e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
              >
                <option value="ALL">Semua Periode</option>
                <option value="TODAY">Hari Ini (23 Sep 2026)</option>
                <option value="LAST_7_DAYS">7 Hari Terakhir</option>
                <option value="SEP_2026">September 2026</option>
                <option value="AUG_2026">Agustus 2026</option>
                <option value="CUSTOM">Rentang Kustom (Custom Range)...</option>
              </select>
            </div>

            {/* Audit Status Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-medium">Status Audit:</span>
              <select
                value={selectedAuditStatus}
                onChange={(e) => handleFilterChange(setSelectedAuditStatus, e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700"
              >
                <option value="ALL">Semua Status</option>
                <option value="PENDING">Menunggu Tindakan</option>
                <option value="IN_PROGRESS">Sedang Diproses</option>
                <option value="RESOLVED">Selesai (Resolved)</option>
                <option value="ACKNOWLEDGED">Diakui (Acknowledged)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              Filter Tanggal:
            </span>
            {[
              { id: 'ALL', label: 'Semua Periode' },
              { id: 'TODAY', label: 'Hari Ini (23 Sep)' },
              { id: 'LAST_7_DAYS', label: '7 Hari Terakhir' },
              { id: 'SEP_2026', label: 'September 2026' },
              { id: 'AUG_2026', label: 'Agustus 2026' },
              { id: 'CUSTOM', label: 'Rentang Kustom' }
            ].map(preset => (
              <button
                key={preset.id}
                onClick={() => handleFilterChange(setDatePreset, preset.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  datePreset === preset.id
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers when CUSTOM is chosen */}
          {datePreset === 'CUSTOM' && (
            <div className="flex items-center gap-2 animate-in fade-in">
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleFilterChange(setStartDate, e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1"
                placeholder="Dari Tanggal"
              />
              <span className="text-slate-400">s/d</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleFilterChange(setEndDate, e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1"
                placeholder="Sampai Tanggal"
              />
            </div>
          )}

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
            className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium cursor-pointer ml-auto"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Urutkan: {sortOrder === 'desc' ? 'Terbaru Dahulu' : 'Terlama Dahulu'}</span>
          </button>
        </div>
      </div>

      {/* Main Paginated Notifications Table / Card List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600" />
            <span>Daftar Riwayat Notifikasi</span>
            <span className="text-slate-500 font-normal">
              (Ditemukan {totalItems} entri sesuai filter)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Tampilkan:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-700"
            >
              <option value={5}>5 per hal</option>
              <option value={10}>10 per hal</option>
              <option value={15}>15 per hal</option>
              <option value={25}>25 per hal</option>
            </select>
          </div>
        </div>

        {paginatedAlerts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Bell className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Tidak ada notifikasi yang sesuai dengan kriteria filter.</p>
            <p className="text-xs text-slate-400">Silakan sesuaikan filter tingkat keparahan, tipe, atau rentang tanggal.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginatedAlerts.map((alert) => {
              const severity = alert.severity || alert.priority;
              const typeMeta = getTypeLabel(alert.type);
              const isResolved = alert.auditStatus === 'RESOLVED';

              return (
                <div 
                  key={alert.id}
                  className={`p-4 hover:bg-slate-50/80 transition-colors ${
                    !alert.read ? 'bg-indigo-50/20' : ''
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Left: Metadata & Content */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {getSeverityBadge(severity)}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${typeMeta.color}`}>
                          {typeMeta.label}
                        </span>
                        {getAuditStatusBadge(alert.auditStatus)}
                        <span className="text-[11px] text-slate-400 font-mono">
                          ID: {alert.id}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatDateIndo(alert.date || alert.timestamp.substring(0, 10))} • {alert.timestamp.includes(':') ? alert.timestamp.split(' ')[1] : alert.timestamp}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        {alert.title}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
                        {alert.message}
                      </p>

                      {/* Associated References & Chips */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                        {alert.amount && (
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            Nominal: {formatRupiah(alert.amount)}
                          </span>
                        )}
                        {alert.txId && (
                          <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            Ref Transaksi: {alert.txId}
                          </span>
                        )}
                        {alert.unitId && (
                          <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            Unit: {alert.unitId}
                          </span>
                        )}
                        {alert.poContractId && (
                          <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            Kontrak: {alert.poContractId}
                          </span>
                        )}
                        <span className="text-slate-400">
                          Target: {alert.targetRoles.join(', ')}
                        </span>
                      </div>

                      {/* Audit Response Trail info if present */}
                      {alert.responseNote && (
                        <div className="mt-2 p-2.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                              Tindak Lanjut Audit ({alert.respondedBy || 'Manajemen'}):
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              {alert.respondedAt || 'Tercatat'}
                            </span>
                          </div>
                          <p className="text-slate-700 text-[11px] italic">
                            &quot;{alert.responseNote}&quot;
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-2 shrink-0 pt-2 lg:pt-0">
                      {/* Response Action Button */}
                      <button
                        onClick={() => handleOpenResponseModal(alert)}
                        className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        {alert.auditStatus === 'RESOLVED' ? 'Ubah Catatan' : 'Tindak Lanjuti'}
                      </button>

                      {/* Direct Navigation to Transaction or Tab */}
                      {alert.txId && onSelectTransaction && (
                        <button
                          onClick={() => onSelectTransaction(alert.txId!)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                          title="Buka rincian voucher & otorisasi transaksi"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Lihat Bukti
                        </button>
                      )}

                      {/* Toggle Read */}
                      <button
                        onClick={() => onToggleRead(alert.id)}
                        className={`text-[11px] font-medium transition-colors cursor-pointer px-2 py-1 rounded ${
                          alert.read ? 'text-slate-400 hover:text-slate-600' : 'text-emerald-700 font-bold'
                        }`}
                      >
                        {alert.read ? 'Tandai Belum Dibaca' : '✓ Tandai Dibaca'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-600">
            Menampilkan <strong>{Math.min(totalItems, (currentPage - 1) * pageSize + 1)}</strong> –{' '}
            <strong>{Math.min(totalItems, currentPage * pageSize)}</strong> dari{' '}
            <strong>{totalItems}</strong> notifikasi tercatat
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-1.5 rounded-lg border flex items-center gap-1 transition-colors ${
                currentPage === 1
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                  : 'border-slate-300 text-slate-700 hover:bg-white cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Sebelumnya</span>
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                // Show pages around current page
                if (totalPages > 5 && Math.abs(p - currentPage) > 2 && p !== 1 && p !== totalPages) {
                  if (Math.abs(p - currentPage) === 3) {
                    return <span key={p} className="px-1 text-slate-400">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-8 h-8 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                      currentPage === p
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-1.5 rounded-lg border flex items-center gap-1 transition-colors ${
                currentPage === totalPages
                  ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                  : 'border-slate-300 text-slate-700 hover:bg-white cursor-pointer'
              }`}
            >
              <span className="hidden sm:inline">Berikutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Response Tracking Modal Dialog */}
      {activeResponseAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Tindak Lanjut &amp; Respons Audit
                </h3>
              </div>
              <button
                onClick={() => setActiveResponseAlert(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">{activeResponseAlert.title}</div>
                <div className="text-slate-600">{activeResponseAlert.message}</div>
                <div className="text-[11px] text-slate-400 pt-1 font-mono">
                  ID: {activeResponseAlert.id} • Tanggal: {activeResponseAlert.date || activeResponseAlert.timestamp}
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1 pt-2">
                <label className="font-bold text-slate-700">Status Tindak Lanjut:</label>
                <select
                  value={responseStatusInput}
                  onChange={(e) => setResponseStatusInput(e.target.value as NotificationAuditStatus)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-indigo-500"
                >
                  <option value="RESOLVED">Selesai (Resolved) - Masalah Telah Diatasi</option>
                  <option value="IN_PROGRESS">Sedang Diproses (In Progress) - Investigasi Lapangan</option>
                  <option value="ACKNOWLEDGED">Diakui (Acknowledged) - Menunggu Verifikasi Dokumen</option>
                  <option value="DISMISSED">Diabaikan (Dismissed) - Bukan Masalah Operasional</option>
                </select>
              </div>

              {/* Response Note Textarea */}
              <div className="space-y-1 pt-2">
                <label className="font-bold text-slate-700">Catatan Tanggapan / Keterangan Audit:</label>
                <textarea
                  rows={3}
                  value={responseNoteInput}
                  onChange={(e) => setResponseNoteInput(e.target.value)}
                  placeholder="Masukkan uraian tindakan mitigasi yang diambil, nomor disposisi, atau hasil investigasi lapangan..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white focus:outline-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-400">
                Pencatat: <strong>{activeRole}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveResponseAlert(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveResponse}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer shadow-md"
                >
                  Simpan Respons Audit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
