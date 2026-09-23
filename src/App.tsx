import React, { useState, useEffect } from 'react';
import { 
  Project, 
  Transaction, 
  ChartOfAccount, 
  CostCode, 
  WBSNode, 
  Party, 
  BankAccount, 
  ApprovalMatrixRule, 
  ControlCheckItem, 
  AuditLog, 
  UserRole, 
  AgingItem, 
  CustomerARRecord, 
  POContractTracking, 
  NotificationAlert, 
  NotificationAuditStatus,
  InitialCapitalEntry,
  SyncOutboxItem
} from './types';
import { 
  INITIAL_COA, 
  INITIAL_APPROVAL_RULES, 
  INITIAL_CONTROL_CHECKS 
} from './data/initialData';
import { 
  AppState, 
  loadAppState, 
  saveAppState, 
  clearAppState, 
  getDemoAppState 
} from './services/storageService';
import { createAuditRecord } from './services/auditService';
import { enqueueSync, processSyncQueue } from './services/syncService';
import { exportTransactionsToCSV } from './services/exportService';

// UI Views & Modals
import { FirstRunScreen } from './components/onboarding/FirstRunScreen';
import { ProjectSetupWizard } from './components/onboarding/ProjectSetupWizard';
import { MigrationCenterModal } from './components/onboarding/MigrationCenterModal';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { OperatorInputModal } from './components/OperatorInputModal';
import { COAAndCostCodes } from './components/COAAndCostCodes';
import { ApprovalCenter } from './components/ApprovalCenter';
import { AccountingAndBankView } from './components/AccountingAndBankView';
import { ControlChecksView } from './components/ControlChecksView';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { APARAgingView } from './components/APARAgingView';
import { CustomerARAndPSAK72View } from './components/CustomerARAndPSAK72View';
import { POContractTrackingView } from './components/POContractTrackingView';
import { NotificationAlertCenter } from './components/NotificationAlertCenter';
import { NotificationHistoryView } from './components/NotificationHistoryView';
import { ProjectSwitchModal } from './components/modals/ProjectSwitchModal';
import { BackupRestoreModal } from './components/modals/BackupRestoreModal';
import { IntegrationCenterModal } from './components/modals/IntegrationCenterModal';
import { InitialCapitalModal } from './components/modals/InitialCapitalModal';

import { 
  Building2, 
  LayoutDashboard, 
  BookOpen, 
  ShieldCheck, 
  FileSpreadsheet, 
  ShieldAlert, 
  PlusCircle, 
  Sparkles, 
  CalendarClock, 
  FileCheck2, 
  Briefcase, 
  History, 
  ChevronDown, 
  Layers, 
  Menu, 
  Database,
  Network,
  Coins,
  Download,
  RefreshCw,
  ArrowUpDown,
  CheckCircle2
} from 'lucide-react';

export function App() {
  // Load persistent state from LocalStorage on mount
  const [appState, setAppState] = useState<AppState | null>(() => loadAppState());

  // UI Navigation & Active Persona
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'aging' | 'customer_ar' | 'po_tracking' | 'wbs_cost' | 'approvals' | 'accounting_bank' | 'control_checks' | 'notification_history'
  >('dashboard');
  const [activeRole, setActiveRole] = useState<UserRole>('DIREKSI');
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState<boolean>(false);
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState<boolean>(false);
  const [isProjectSwitchModalOpen, setIsProjectSwitchModalOpen] = useState<boolean>(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState<boolean>(false);
  const [isCapitalModalOpen, setIsCapitalModalOpen] = useState<boolean>(false);
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState<boolean>(false);
  const [inspectingTx, setInspectingTx] = useState<Transaction | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Synchronize state changes to LocalStorage
  const updateAndPersist = (updater: (prev: AppState) => AppState) => {
    setAppState(prev => {
      if (!prev) return prev;
      const nextState = updater(prev);
      saveAppState(nextState);
      return nextState;
    });
  };

  // Active Project helper
  const activeProject = appState?.projects.find(p => p.id === appState.activeProjectId) || appState?.projects[0] || null;

  // Filter transactions, accounts, and aging for active project
  const currentTransactions = (appState?.transactions || []).filter(t => !t.projectId || !activeProject || t.projectId === activeProject.id);
  const currentBankAccounts = appState?.bankAccounts || [];
  const currentAgingItems = (appState?.agingItems || []).filter(i => !i.projectId || !activeProject || i.projectId === activeProject.id);
  const currentCustomerAR = (appState?.customerARRecords || []).filter(r => !r.projectId || !activeProject || r.projectId === activeProject.id);
  const currentPoContracts = (appState?.poContracts || []).filter(c => !c.projectId || !activeProject || c.projectId === activeProject.id);
  const currentAlerts = appState?.alerts || [];
  const currentAuditLogs = appState?.auditLogs || [];
  const currentCostCodes = appState?.costCodes || [];
  const currentWbsNodes = appState?.wbsNodes || [];
  const currentParties = appState?.parties || [];
  const pendingSyncCount = (appState?.syncQueue || []).filter(s => s.status === 'PENDING' || s.status === 'FAILED').length;

  // ---------------------------------------------------------------------------
  // PROJECT LIFECYCLE HANDLERS
  // ---------------------------------------------------------------------------
  const handleCreateProject = (
    newProject: Project,
    initialCapital: InitialCapitalEntry,
    accounts: BankAccount[]
  ) => {
    const audit = createAuditRecord(
      'CREATE',
      newProject.id,
      `Inisialisasi Project ${newProject.name} (${newProject.code}) dengan Modal Awal Rp ${initialCapital.amount.toLocaleString('id-ID')}`,
      `${activeRole} User`,
      activeRole
    );

    const initialTx: Transaction = {
      id: `TRX-${newProject.code}-001`,
      projectId: newProject.id,
      projectName: newProject.name,
      date: initialCapital.date,
      type: 'INCOME',
      category: 'PENDANAAN',
      subcategory: 'Setoran Modal / Dana Awal Disetor',
      description: initialCapital.notes || `Setoran modal disetor awal dari ${initialCapital.sourceName}`,
      wbsCode: '00',
      costCode: 'MOD-001',
      costCodeName: 'Modal Disetor & Ekuitas Pendirian Proyek',
      partyId: 'PTY-INV-01',
      partyName: initialCapital.sourceName,
      partyRole: 'INVESTOR',
      debitAccountCode: '1120', // Kas & Bank
      creditAccountCode: '3100', // Ekuitas Modal Disetor
      subtotal: initialCapital.amount,
      totalAmount: initialCapital.amount,
      paidAmount: initialCapital.amount,
      outstandingAmount: 0,
      paymentMethod: 'TRANSFER_BCA',
      status: 'PAID',
      isPaid: true,
      journalPosted: true,
      operatorName: `${activeRole} Controller`,
      createdBy: `${activeRole} User`,
      createdAt: new Date().toISOString(),
      currentApprovalLevel: 1,
      approvalSteps: [
        {
          stepNo: 1,
          roleRequired: 'DIREKSI',
          status: 'APPROVED',
          approverName: `${activeRole} Lead`,
          actionDate: new Date().toISOString(),
          notes: 'Pengesahan setoran modal awal pendirian proyek'
        }
      ]
    };

    const nextState: AppState = {
      activeProjectId: newProject.id,
      projects: [...(appState?.projects || []), newProject],
      bankAccounts: accounts,
      capitalEntries: [...(appState?.capitalEntries || []), initialCapital],
      transactions: [initialTx, ...(appState?.transactions || [])],
      parties: appState?.parties && appState.parties.length > 0 ? appState.parties : [],
      agingItems: appState?.agingItems || [],
      customerARRecords: appState?.customerARRecords || [],
      poContracts: appState?.poContracts || [],
      alerts: [
        {
          id: `ALT-INIT-${Date.now().toString().slice(-4)}`,
          timestamp: 'Baru saja',
          date: initialCapital.date,
          type: 'CONTROL_WARNING',
          title: `Project ${newProject.name} Dibuka`,
          message: `Project resmi dibuat dengan modal disetor Rp ${initialCapital.amount.toLocaleString('id-ID')}.`,
          priority: 'LOW',
          severity: 'LOW',
          read: false,
          targetRoles: ['DIREKSI', 'PROJECT_MANAGER', 'FINANCE', 'OPERATOR'],
          category: 'Setup Project',
          auditStatus: 'RESOLVED',
        }
      ],
      auditLogs: [audit, ...(appState?.auditLogs || [])],
      wbsNodes: appState?.wbsNodes || [],
      costCodes: appState?.costCodes || [],
      syncQueue: enqueueSync([], 'PROJECT', newProject.id, 'CREATE', newProject),
      integrationConfig: appState?.integrationConfig || {
        google: { status: 'NOT_CONFIGURED' },
        github: { status: 'NOT_CONFIGURED' },
        cloudflare: { status: 'NOT_CONFIGURED' },
        whatsapp: { manualModeAvailable: true, apiStatus: 'NOT_CONFIGURED' },
      },
    };

    setAppState(nextState);
    saveAppState(nextState);
    setIsSetupWizardOpen(false);
    setIsMigrationModalOpen(false);
    showToast(`🎉 Project ${newProject.name} berhasil dibuat & siap digunakan!`);
  };

  const handleSelectProject = (projectId: string) => {
    updateAndPersist(prev => ({
      ...prev,
      activeProjectId: projectId,
      auditLogs: [
        createAuditRecord('APPROVE', projectId, `Beralih ke project aktif ${projectId}`, `${activeRole} User`, activeRole),
        ...prev.auditLogs
      ]
    }));
    showToast(`Beralih ke project aktif.`);
  };

  const handleLoadDemoProject = () => {
    const demo = getDemoAppState();
    setAppState(demo);
    saveAppState(demo);
    showToast(`⚡ Data Simulasi / Demo Graha Asri berhasil dimuat!`);
  };

  const handleClearProductionData = () => {
    clearAppState();
    setAppState(null);
    showToast('Database berhasil direset. Aplikasi kembali ke kondisi awal.');
  };

  // ---------------------------------------------------------------------------
  // TRANSACTIONS & CASH ENGINE
  // ---------------------------------------------------------------------------
  const handleSaveTransaction = (newTx: Transaction) => {
    updateAndPersist(prev => {
      // 1. Deduct or add bank balance if isPaid
      const updatedAccounts = prev.bankAccounts.map(b => {
        if (!newTx.isPaid || !newTx.bankAccountId || b.id !== newTx.bankAccountId) return b;
        if (newTx.type === 'EXPENSE') return { ...b, currentBalance: b.currentBalance - newTx.totalAmount };
        if (newTx.type === 'INCOME') return { ...b, currentBalance: b.currentBalance + newTx.totalAmount };
        return b;
      });

      // 2. Update project actual cost if expense
      const updatedProjects = prev.projects.map(p => {
        if (p.id === (newTx.projectId || prev.activeProjectId) && newTx.type === 'EXPENSE' && newTx.isPaid) {
          return {
            ...p,
            actualCost: p.actualCost + newTx.totalAmount,
            forecastEAC: Math.max(p.forecastEAC, p.actualCost + newTx.totalAmount)
          };
        }
        return p;
      });

      const audit = createAuditRecord(
        'CREATE',
        newTx.id,
        `Pencatatan transaksi ${newTx.subcategory} senilai Rp ${newTx.totalAmount.toLocaleString('id-ID')}`,
        `${activeRole} User`,
        activeRole
      );

      const updatedSync = enqueueSync(prev.syncQueue, 'TRANSACTION', newTx.id, 'CREATE', newTx);

      return {
        ...prev,
        projects: updatedProjects,
        bankAccounts: updatedAccounts,
        transactions: [newTx, ...prev.transactions],
        auditLogs: [audit, ...prev.auditLogs],
        syncQueue: updatedSync,
      };
    });

    showToast(`✅ Transaksi ${newTx.id} berhasil dicatat & masuk antrean otorisasi.`);
  };

  const handleApproveTransaction = (txId: string, stepNo: number, notes: string) => {
    updateAndPersist(prev => {
      const updatedTx = prev.transactions.map(tx => {
        if (tx.id !== txId) return tx;

        const updatedSteps = tx.approvalSteps.map(s => {
          if (s.stepNo === stepNo) {
            return {
              ...s,
              status: 'APPROVED' as const,
              approverName: `${activeRole} Officer`,
              approverRole: activeRole,
              actionDate: new Date().toISOString(),
              notes
            };
          }
          return s;
        });

        const allApproved = updatedSteps.every(s => s.status === 'APPROVED');
        const nextStatus = (allApproved ? (tx.isPaid ? 'PAID' : 'APPROVED') : 'VERIFIED') as import('./types').TransactionStatus;

        return {
          ...tx,
          approvalSteps: updatedSteps,
          status: nextStatus
        };
      });

      const audit = createAuditRecord(
        'APPROVE',
        txId,
        `Menyetujui langkah ${stepNo} untuk transaksi ${txId} (${notes})`,
        `${activeRole} User`,
        activeRole
      );

      return {
        ...prev,
        transactions: updatedTx,
        auditLogs: [audit, ...prev.auditLogs],
        syncQueue: enqueueSync(prev.syncQueue, 'TRANSACTION', txId, 'UPDATE', { status: 'APPROVED', stepNo }),
      };
    });

    showToast(`✅ Transaksi ${txId} langkah ${stepNo} disetujui.`);
  };

  const handleRejectTransaction = (txId: string, stepNo: number, notes: string) => {
    updateAndPersist(prev => {
      const updatedTx = prev.transactions.map(tx => {
        if (tx.id !== txId) return tx;
        const updatedSteps = tx.approvalSteps.map(s => {
          if (s.stepNo === stepNo) {
            return {
              ...s,
              status: 'REJECTED' as const,
              approverName: `${activeRole} Officer`,
              approverRole: activeRole,
              actionDate: new Date().toISOString(),
              notes
            };
          }
          return s;
        });

        const rejectedStatus = 'REJECTED' as import('./types').TransactionStatus;

        return {
          ...tx,
          approvalSteps: updatedSteps,
          status: rejectedStatus
        };
      });

      const audit = createAuditRecord(
        'REJECT',
        txId,
        `Menolak transaksi ${txId} pada langkah ${stepNo} (${notes})`,
        `${activeRole} User`,
        activeRole
      );

      return {
        ...prev,
        transactions: updatedTx,
        auditLogs: [audit, ...prev.auditLogs],
        syncQueue: enqueueSync(prev.syncQueue, 'TRANSACTION', txId, 'UPDATE', { status: 'REJECTED' }),
      };
    });

    showToast(`⚠️ Transaksi ${txId} ditolak.`);
  };

  // Additional Capital Injection Handler
  const handleAddInitialCapital = (entry: InitialCapitalEntry) => {
    updateAndPersist(prev => {
      const updatedBankAccounts = prev.bankAccounts.map(b => {
        if (b.id === entry.destinationAccountId) {
          return { ...b, currentBalance: b.currentBalance + entry.amount };
        }
        return b;
      });

      const audit = createAuditRecord(
        'CREATE',
        entry.id,
        `Injeksi modal / dana disetor Rp ${entry.amount.toLocaleString('id-ID')} dari ${entry.sourceName}`,
        `${activeRole} User`,
        activeRole
      );

      return {
        ...prev,
        capitalEntries: [entry, ...prev.capitalEntries],
        bankAccounts: updatedBankAccounts,
        auditLogs: [audit, ...prev.auditLogs],
        syncQueue: enqueueSync(prev.syncQueue, 'CAPITAL', entry.id, 'CREATE', entry),
      };
    });

    showToast(`💰 Setoran modal Rp ${entry.amount.toLocaleString('id-ID')} berhasil dicatat & masuk kas!`);
  };

  // Real Sync Action
  const handleTriggerSync = async () => {
    if (!appState || isSyncing) return;
    setIsSyncing(true);
    showToast('Sedang memproses antrean sinkronisasi...');
    
    const result = await processSyncQueue(appState.syncQueue);
    updateAndPersist(prev => ({
      ...prev,
      syncQueue: result.updatedQueue,
    }));
    
    setIsSyncing(false);
    if (result.success) {
      showToast(`✓ Sinkronisasi tuntas! ${result.syncedCount} item berhasil diselaraskan.`);
    } else {
      showToast(`⚠️ Sinkronisasi selesai: ${result.syncedCount} berhasil, ${result.failedCount} gagal.`);
    }
  };

  // Export CSV Action
  const handleExportCSV = () => {
    if (!activeProject) return;
    exportTransactionsToCSV(currentTransactions, activeProject.name);
    showToast(`📥 File CSV transaksi ${activeProject.name} berhasil diunduh.`);
  };

  // ---------------------------------------------------------------------------
  // EXISTING ADVANCED AUDIT / RECONCILIATION HANDLERS
  // ---------------------------------------------------------------------------
  const handleResolveException = (txId: string, newCostCode: string, newCategory: any, note: string) => {
    updateAndPersist(prev => {
      const updatedTx = prev.transactions.map(tx => {
        if (tx.id === txId) {
          return {
            ...tx,
            costCode: newCostCode,
            costCodeName: newCostCode === 'BLD-002' ? 'Struktur Beton Bertulang (WBS 05)' : 'Pondasi Batu Kali (WBS 05)',
            wbsCode: '05',
            category: newCategory,
            debitAccountCode: '1320',
            creditAccountCode: '1120',
            status: 'VERIFIED' as const,
            description: `${tx.description} - [Diverifikasi: ${note}]`
          };
        }
        return tx;
      });

      const audit = createAuditRecord(
        'CORRECTION',
        txId,
        `Reklasifikasi transaksi ${txId} ke Cost Code ${newCostCode} (${note})`,
        `${activeRole} Controller`,
        activeRole
      );

      return {
        ...prev,
        transactions: updatedTx,
        auditLogs: [audit, ...prev.auditLogs],
        syncQueue: enqueueSync(prev.syncQueue, 'TRANSACTION', txId, 'UPDATE', { costCode: newCostCode }),
      };
    });

    showToast(`✓ Berhasil! Transaksi ${txId} direklasifikasi ke Cost Code ${newCostCode}.`);
  };

  const handlePostBankReconciliation = (accountId: string, adjustedBalance: number, causeDescription: string) => {
    updateAndPersist(prev => {
      const updatedAccounts = prev.bankAccounts.map(b => {
        if (b.id === accountId) {
          return {
            ...b,
            statementBalance: adjustedBalance,
            currentBalance: adjustedBalance,
            unreconciledDifference: 0,
            reconciliationStatus: 'RECONCILED' as const
          };
        }
        return b;
      });

      const audit = createAuditRecord(
        'RECONCILE',
        accountId,
        `Posting Jurnal Penyesuaian Rekonsiliasi Bank Rp 2.000.000 (${causeDescription})`,
        `${activeRole} Akuntan`,
        activeRole
      );

      return {
        ...prev,
        bankAccounts: updatedAccounts,
        auditLogs: [audit, ...prev.auditLogs],
        syncQueue: enqueueSync(prev.syncQueue, 'ACCOUNT', accountId, 'RECONCILE', { adjustedBalance }),
      };
    });

    showToast(`✓ Rekonsiliasi Bank tuntas! Selisih berhasil diselaraskan.`);
  };

  // PSAK 72 & PO Operations
  const handleProcessBAST = (unitId: string) => {
    updateAndPersist(prev => {
      const updatedCustomerAR = prev.customerARRecords.map(rec => {
        if (rec.unitId === unitId) {
          const fullPrice = rec.sellingPrice;
          return {
            ...rec,
            psak72: {
              ...rec.psak72,
              contractLiabilityBalance: 0,
              recognizedRevenue: fullPrice,
              cogsWIPTransfer: 310000000,
              handoverStatus: 'BAST_COMPLETED' as const,
              bastDate: new Date().toISOString().split('T')[0],
              bastNo: `BAST/GAR/2026/${rec.unitNo}`,
              notes: `BAST Resmi ditandatangani. Pendapatan Rp ${fullPrice.toLocaleString('id-ID')} sah diakui sesuai PSAK 72.`
            }
          };
        }
        return rec;
      });

      const audit = createAuditRecord(
        'APPROVE',
        unitId,
        `Eksekusi BAST Unit ${unitId} & Pengakuan Pendapatan PSAK 72 (Rp 535 Juta)`,
        `${activeRole} (Direksi/PM)`,
        activeRole
      );

      return {
        ...prev,
        customerARRecords: updatedCustomerAR,
        auditLogs: [audit, ...prev.auditLogs],
        syncQueue: enqueueSync(prev.syncQueue, 'TRANSACTION', unitId, 'UPDATE', { BAST: true }),
      };
    });

    showToast(`🏛️ PSAK 72: BAST Unit ${unitId} sukses! Pendapatan Rp 535 Jt sah diakui.`);
  };

  const handleRecordCustomerPayment = (customerRecordId: string, scheduleId: string, amount: number) => {
    updateAndPersist(prev => {
      const updatedRecords = prev.customerARRecords.map(rec => {
        if (rec.id === customerRecordId) {
          const updatedSchedules = rec.schedules.map(s => {
            if (s.id === scheduleId) {
              return {
                ...s,
                status: 'PAID' as const,
                paidDate: new Date().toISOString().split('T')[0],
                paidAmount: amount
              };
            }
            return s;
          });
          const newTotalPaid = rec.totalPaid + amount;
          return {
            ...rec,
            totalPaid: newTotalPaid,
            totalOutstandingAR: Math.max(0, rec.sellingPrice - newTotalPaid),
            schedules: updatedSchedules,
            psak72: {
              ...rec.psak72,
              contractLiabilityBalance: rec.psak72.contractLiabilityBalance + amount
            }
          };
        }
        return rec;
      });

      const audit = createAuditRecord(
        'CREATE',
        customerRecordId,
        `Penerimaan angsuran konsumen ${customerRecordId} Rp ${amount.toLocaleString('id-ID')}`,
        `${activeRole} Kasir`,
        activeRole
      );

      return {
        ...prev,
        customerARRecords: updatedRecords,
        auditLogs: [audit, ...prev.auditLogs],
      };
    });

    showToast(`✓ Pembayaran angsuran konsumen berhasil dicatat!`);
  };

  const handleUpdateOpname = (contractId: string, newProgress: number) => {
    updateAndPersist(prev => {
      const updatedContracts = prev.poContracts.map(c => {
        if (c.id === contractId) {
          const verifiedAmount = (newProgress / 100) * c.totalContractBudget;
          return {
            ...c,
            verifiedOpnamePercent: newProgress,
            verifiedOpnameAmount: verifiedAmount,
            invoicedAmount: Math.max(c.invoicedAmount, verifiedAmount),
            outstandingPayable: Math.max(0, Math.max(c.invoicedAmount, verifiedAmount) - c.paidAmount),
            status: newProgress >= 100 ? ('COMPLETED' as const) : ('ACTIVE' as const)
          };
        }
        return c;
      });

      return {
        ...prev,
        poContracts: updatedContracts,
      };
    });

    showToast(`Opname fisik SPK ${contractId} diperbarui.`);
  };

  const handlePayContractTermin = (contractId: string, amount: number) => {
    updateAndPersist(prev => {
      const updatedContracts = prev.poContracts.map(c => {
        if (c.id === contractId) {
          const newPaid = c.paidAmount + amount;
          return {
            ...c,
            paidAmount: newPaid,
            outstandingCommitment: Math.max(0, c.totalContractBudget - newPaid),
            outstandingPayable: Math.max(0, c.invoicedAmount - newPaid),
            status: newPaid >= c.totalContractBudget ? ('COMPLETED' as const) : c.status
          };
        }
        return c;
      });

      return {
        ...prev,
        poContracts: updatedContracts,
      };
    });

    showToast(`Pembayaran Rp ${amount.toLocaleString('id-ID')} untuk SPK ${contractId} berhasil diproses.`);
  };

  // ---------------------------------------------------------------------------
  // FIRST-RUN STATE CHECK
  // ---------------------------------------------------------------------------
  if (!appState || appState.projects.length === 0 || !activeProject) {
    return (
      <>
        <FirstRunScreen
          onStartSetup={() => setIsSetupWizardOpen(true)}
          onStartMigration={() => setIsMigrationModalOpen(true)}
          onLoadDemo={handleLoadDemoProject}
        />

        <ProjectSetupWizard
          isOpen={isSetupWizardOpen}
          onClose={() => setIsSetupWizardOpen(false)}
          onSubmit={handleCreateProject}
        />

        <MigrationCenterModal
          isOpen={isMigrationModalOpen}
          onClose={() => setIsMigrationModalOpen(false)}
          onSubmitMigration={handleCreateProject}
        />
      </>
    );
  }

  // ---------------------------------------------------------------------------
  // MAIN RUNNING APPLICATION
  // ---------------------------------------------------------------------------
  const pendingApprovalsCount = currentTransactions.filter(t => t.status === 'SUBMITTED' || t.status === 'VERIFIED').length;
  const isSecondaryActive = ['aging', 'customer_ar', 'po_tracking', 'control_checks', 'notification_history'].includes(activeTab);

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-800 flex flex-col font-sans">
      {/* Top Main Navigation Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo & Name (Interactive Project Selector) */}
            <div 
              onClick={() => setIsProjectSwitchModalOpen(true)}
              className="flex items-center gap-3 cursor-pointer group p-1 -ml-1 rounded-xl hover:bg-slate-800/80 transition-colors"
              title="Klik untuk memilih atau menambah project"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center shadow-md">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-base tracking-tight block group-hover:text-indigo-300 transition-colors">
                    {activeProject.name}
                  </span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-300" />
                  {activeProject.isDemo ? (
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Simulasi
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Produksi
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  {activeProject.developerCompany || 'PT Developer'} • {activeProject.code}
                </span>
              </div>
            </div>

            {/* Persona / Role Switcher */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-800/90 p-1 px-2.5 rounded-xl border border-indigo-500/30 shadow-xs">
              <div className="flex items-center gap-1.5 pl-1 pr-1.5 border-r border-slate-700/80">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <div className="leading-tight">
                  <span className="text-[10px] uppercase font-black text-indigo-300 tracking-wider block">
                    Role Aktif
                  </span>
                  <span className="text-[9px] text-slate-400 block -mt-0.5">{activeRole}</span>
                </div>
              </div>
              {(['OPERATOR', 'FINANCE', 'PROJECT_MANAGER', 'DIREKSI'] as UserRole[]).map(role => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeRole === role
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {role === 'OPERATOR' ? '👷 Operator' :
                   role === 'FINANCE' ? '💼 Finance' :
                   role === 'PROJECT_MANAGER' ? '📐 PM' : '👔 Direksi'}
                </button>
              ))}
            </div>

            {/* Action buttons & Notification Center */}
            <div className="flex items-center gap-2">
              {/* Real Sync Outbox Button */}
              <button
                type="button"
                onClick={handleTriggerSync}
                disabled={isSyncing}
                title="Sinkronisasi Antrean Outbox"
                className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  pendingSyncCount > 0 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-indigo-400' : ''}`} />
                {pendingSyncCount > 0 && (
                  <span className="text-[10px] font-black">{pendingSyncCount}</span>
                )}
              </button>

              <NotificationAlertCenter
                alerts={currentAlerts}
                currentRole={activeRole}
                onSelectAlert={(a) => {
                  if (a.transactionId) {
                    const found = currentTransactions.find(t => t.id === a.transactionId);
                    if (found) setInspectingTx(found);
                  }
                }}
                onSimulateNewAlert={() => {}}
                onMarkAllAsRead={() => {
                  updateAndPersist(prev => ({
                    ...prev,
                    alerts: prev.alerts.map(a => ({ ...a, read: true }))
                  }));
                  showToast('Semua notifikasi ditandai dibaca.');
                }}
                onViewAllHistory={() => { setActiveTab('notification_history'); setIsMoreMenuOpen(false); }}
              />

              <button
                onClick={() => setIsOperatorModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">+ Catat Transaksi</span>
                <span className="sm:hidden">+ Catat</span>
              </button>
            </div>
          </div>

          {/* Modular Navigation Tabs */}
          <div className="border-t border-slate-800/70 flex items-center justify-between py-1.5">
            <nav className="hidden md:flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={() => { setActiveTab('dashboard'); setIsMoreMenuOpen(false); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Executive Dashboard</span>
              </button>

              <button
                onClick={() => { setActiveTab('wbs_cost'); setIsMoreMenuOpen(false); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'wbs_cost'
                    ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Kontrol Biaya &amp; COA</span>
              </button>

              <button
                onClick={() => { setActiveTab('accounting_bank'); setIsMoreMenuOpen(false); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'accounting_bank'
                    ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Kas &amp; Bank</span>
              </button>

              <button
                onClick={() => { setActiveTab('approvals'); setIsMoreMenuOpen(false); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'approvals'
                    ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Approval Center</span>
                {pendingApprovalsCount > 0 && (
                  <span className="bg-amber-400 text-slate-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>

              {/* Modul Lanjutan & Utility Actions */}
              <div className="relative">
                <button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    isSecondaryActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700/60'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Modul &amp; Utilitas</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isMoreMenuOpen && (
                  <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-800">
                      Modul Kontrol Proyek
                    </div>

                    <button
                      onClick={() => { setActiveTab('aging'); setIsMoreMenuOpen(false); }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white cursor-pointer"
                    >
                      <CalendarClock className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <div className="font-semibold">AP &amp; AR Aging</div>
                        <div className="text-[10px] text-slate-500">Jadwal jatuh tempo hutang &amp; piutang</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setActiveTab('customer_ar'); setIsMoreMenuOpen(false); }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white cursor-pointer"
                    >
                      <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-semibold">AR &amp; PSAK 72 (Pendapatan)</div>
                        <div className="text-[10px] text-slate-500">Kontrak konsumen &amp; eksekusi BAST</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setActiveTab('po_tracking'); setIsMoreMenuOpen(false); }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white cursor-pointer"
                    >
                      <Briefcase className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <div className="font-semibold">PO &amp; Kontrak Rekanan</div>
                        <div className="text-[10px] text-slate-500">Komitmen subkon &amp; opname fisik</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setActiveTab('control_checks'); setIsMoreMenuOpen(false); }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <div className="font-semibold">Control Checks &amp; Risk Register</div>
                        <div className="text-[10px] text-slate-500">Diagnostic aturan integritas</div>
                      </div>
                    </button>

                    <button
                      onClick={() => { setActiveTab('notification_history'); setIsMoreMenuOpen(false); }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-white cursor-pointer"
                    >
                      <History className="w-4 h-4 text-purple-400 shrink-0" />
                      <div>
                        <div className="font-semibold">Notification History &amp; Audit Trail</div>
                        <div className="text-[10px] text-slate-500">Log audit notifikasi &amp; respons</div>
                      </div>
                    </button>

                    <div className="px-3 py-1 mt-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-t border-b border-slate-800">
                      Utilitas Data &amp; Operasional
                    </div>

                    <button
                      onClick={() => { setIsCapitalModalOpen(true); setIsMoreMenuOpen(false); }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-emerald-400 cursor-pointer"
                    >
                      <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-semibold">Setor Modal / Dana Awal</span>
                    </button>

                    <button
                      onClick={() => { handleExportCSV(); setIsMoreMenuOpen(false); }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-indigo-400 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="font-semibold">Export CSV Transaksi</span>
                    </button>

                    <button
                      onClick={() => { setIsBackupModalOpen(true); setIsMoreMenuOpen(false); }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-purple-400 cursor-pointer"
                    >
                      <Database className="w-4 h-4 text-purple-400 shrink-0" />
                      <span className="font-semibold">Backup &amp; Restore JSON</span>
                    </button>

                    <button
                      onClick={() => { setIsIntegrationModalOpen(true); setIsMoreMenuOpen(false); }}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800/60 hover:text-cyan-400 cursor-pointer"
                    >
                      <Network className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="font-semibold">Integrasi Cloud &amp; WhatsApp</span>
                    </button>
                  </div>
                )}
              </div>
            </nav>

            {/* Mobile Navigation Toggle */}
            <div className="md:hidden flex items-center justify-between w-full py-1">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-2 text-xs font-bold"
              >
                <Menu className="w-4 h-4" />
                <span className="capitalize">{activeTab.replace('_', ' ')}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>{activeRole}</span>
              </div>
            </div>
          </div>

          {/* Mobile Collapsible Drawer */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-slate-800 py-2 space-y-1 animate-in fade-in duration-150">
              {[
                { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
                { id: 'wbs_cost', label: 'Kontrol Biaya & COA', icon: BookOpen },
                { id: 'accounting_bank', label: 'Kas & Bank', icon: FileSpreadsheet },
                { id: 'approvals', label: 'Approval Center', icon: ShieldCheck },
                { id: 'aging', label: 'AP & AR Aging', icon: CalendarClock },
                { id: 'customer_ar', label: 'AR & PSAK 72', icon: FileCheck2 },
                { id: 'po_tracking', label: 'PO & Kontrak Rekanan', icon: Briefcase },
                { id: 'control_checks', label: 'Control Checks & Audit', icon: ShieldAlert },
                { id: 'notification_history', label: 'Notification History', icon: History }
              ].map(item => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold ${
                      activeTab === item.id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* Toast notification banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {activeTab === 'dashboard' && (
          <ExecutiveDashboard
            project={activeProject}
            bankAccounts={currentBankAccounts}
            transactions={currentTransactions}
            controlChecks={INITIAL_CONTROL_CHECKS}
            agingItems={currentAgingItems}
            activeRole={activeRole}
            onOpenOperatorInput={() => setIsOperatorModalOpen(true)}
            onOpenApprovals={() => setActiveTab('approvals')}
            onNavigateToTab={(tab) => {
              setActiveTab(tab as any);
              setIsMoreMenuOpen(false);
            }}
            onSelectTransactionForReview={(tx) => setInspectingTx(tx)}
            onResolveException={handleResolveException}
            onPostBankReconciliation={handlePostBankReconciliation}
          />
        )}

        {activeTab === 'notification_history' && (
          <NotificationHistoryView
            alerts={currentAlerts}
            activeRole={activeRole}
            onUpdateAlertStatus={(alertId, newStatus, note, responderName) => {
              updateAndPersist(prev => ({
                ...prev,
                alerts: prev.alerts.map(a => a.id === alertId ? { ...a, auditStatus: newStatus, responseNote: note, respondedBy: responderName, read: true } : a)
              }));
              showToast(`✓ Audit alert [${alertId}] disimpan.`);
            }}
            onToggleRead={(alertId) => {
              updateAndPersist(prev => ({
                ...prev,
                alerts: prev.alerts.map(a => a.id === alertId ? { ...a, read: !a.read } : a)
              }));
            }}
            onMarkAllAsRead={() => {
              updateAndPersist(prev => ({
                ...prev,
                alerts: prev.alerts.map(a => ({ ...a, read: true }))
              }));
              showToast('Semua notifikasi ditandai dibaca.');
            }}
            onSelectTransaction={(txId) => {
              const foundTx = currentTransactions.find(t => t.id === txId);
              if (foundTx) setInspectingTx(foundTx);
            }}
            onNavigateToTab={(tab) => setActiveTab(tab as any)}
          />
        )}

        {activeTab === 'aging' && (
          <APARAgingView
            agingItems={currentAgingItems}
          />
        )}

        {activeTab === 'customer_ar' && (
          <CustomerARAndPSAK72View
            records={currentCustomerAR}
            onProcessBAST={handleProcessBAST}
            onRecordCustomerPayment={handleRecordCustomerPayment}
          />
        )}

        {activeTab === 'po_tracking' && (
          <POContractTrackingView
            contracts={currentPoContracts}
            onUpdateOpname={handleUpdateOpname}
            onPayContractTermin={handlePayContractTermin}
          />
        )}

        {activeTab === 'wbs_cost' && (
          <COAAndCostCodes
            coaList={INITIAL_COA}
            costCodes={currentCostCodes.length > 0 ? currentCostCodes : []}
            wbsNodes={currentWbsNodes.length > 0 ? currentWbsNodes : []}
          />
        )}

        {activeTab === 'approvals' && (
          <ApprovalCenter
            transactions={currentTransactions}
            approvalRules={INITIAL_APPROVAL_RULES}
            activeRole={activeRole}
            onApproveTransaction={handleApproveTransaction}
            onRejectTransaction={handleRejectTransaction}
          />
        )}

        {activeTab === 'accounting_bank' && (
          <AccountingAndBankView
            transactions={currentTransactions}
            bankAccounts={currentBankAccounts}
            coaList={INITIAL_COA}
          />
        )}

        {activeTab === 'control_checks' && (
          <ControlChecksView
            controlChecks={INITIAL_CONTROL_CHECKS}
            auditLogs={currentAuditLogs}
            onReclassifyLegacy50M={() => {
              handleResolveException('TRX-2026-0003', 'BLD-002', 'MATERIAL', 'Reklasifikasi resmi via Diagnostic C-001');
            }}
            onVerifyPaDidiContract={() => {
              showToast('Kontrak & KTP Pa Didi terverifikasi.');
            }}
            onReconcileBankBCA={() => {
              handlePostBankReconciliation('BNK-02', 123000000, 'Koreksi selisih mutasi kliring bank koran');
            }}
          />
        )}
      </main>

      {/* Operator Modal */}
      <OperatorInputModal
        isOpen={isOperatorModalOpen}
        onClose={() => setIsOperatorModalOpen(false)}
        project={activeProject}
        parties={currentParties}
        costCodes={currentCostCodes}
        bankAccounts={currentBankAccounts}
        onSaveTransaction={handleSaveTransaction}
      />

      {/* Transaction Details Modal */}
      <TransactionDetailModal
        transaction={inspectingTx}
        onClose={() => setInspectingTx(null)}
        activeRole={activeRole}
        onApprove={handleApproveTransaction}
      />

      {/* Project Switch Modal */}
      <ProjectSwitchModal
        isOpen={isProjectSwitchModalOpen}
        onClose={() => setIsProjectSwitchModalOpen(false)}
        projects={appState.projects}
        activeProjectId={appState.activeProjectId}
        onSelectProject={handleSelectProject}
        onAddNewProject={() => setIsSetupWizardOpen(true)}
        onLoadDemoProject={handleLoadDemoProject}
      />

      {/* Project Setup Wizard Modal */}
      <ProjectSetupWizard
        isOpen={isSetupWizardOpen}
        onClose={() => setIsSetupWizardOpen(false)}
        onSubmit={handleCreateProject}
      />

      {/* Migration Center Modal */}
      <MigrationCenterModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
        onSubmitMigration={handleCreateProject}
      />

      {/* Backup & Restore Modal */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        appState={appState}
        onRestoreState={(restored) => {
          setAppState(restored);
          saveAppState(restored);
          showToast('✓ Pemulihan data cadangan berhasil dilakukan.');
        }}
        onClearProductionData={handleClearProductionData}
      />

      {/* Integration Center Modal */}
      <IntegrationCenterModal
        isOpen={isIntegrationModalOpen}
        onClose={() => setIsIntegrationModalOpen(false)}
        config={appState.integrationConfig}
        recentTransaction={currentTransactions[0]}
        senderRole={activeRole}
      />

      {/* Initial / Additional Capital Modal */}
      <InitialCapitalModal
        isOpen={isCapitalModalOpen}
        onClose={() => setIsCapitalModalOpen(false)}
        projectId={activeProject.id}
        bankAccounts={currentBankAccounts}
        onSubmitCapital={handleAddInitialCapital}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-medium text-slate-300">
            Sistem Akuntansi &amp; Kontrol Proyek Developer • {activeProject.name} ({activeProject.code})
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Standar SAK Entitas Privat &amp; PSAK 72 • Persistensi Nyata Browser • Audit Trail Integrity
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
