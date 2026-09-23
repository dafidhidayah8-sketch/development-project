import React, { useState } from 'react';
import { 
  Party,
  Transaction,
  WorkOrder, 
  EquipmentAsset, 
  InternalDepartment, 
  Project, 
  WBSNode, 
  CostCode,
  CostAllocationItem,
  OutputClassification,
  EntityType,
  RelationshipType,
  UserRole
} from '../types';
import { formatRupiah, formatCompactRupiah, formatDateIndo } from '../utils/formatters';
import { 
  Building2, 
  Wrench, 
  Truck, 
  Split, 
  ShieldAlert, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Layers, 
  DollarSign, 
  ArrowRight, 
  Clock, 
  ChevronRight,
  Sparkles,
  Info,
  Check,
  Tag,
  Factory,
  HardHat,
  Cpu,
  HelpCircle
} from 'lucide-react';

interface MitraAndInternalServicesViewProps {
  parties: Party[];
  workOrders: WorkOrder[];
  equipmentAssets: EquipmentAsset[];
  internalDepartments: InternalDepartment[];
  projects: Project[];
  transactions: Transaction[];
  wbsNodes: WBSNode[];
  costCodes: CostCode[];
  activeRole: UserRole;
  onAddParty: (party: Party) => void;
  onUpdateParty: (party: Party) => void;
  onAddWorkOrder: (wo: WorkOrder) => void;
  onUpdateWorkOrder: (wo: WorkOrder) => void;
  onAddEquipmentAsset: (asset: EquipmentAsset) => void;
  onUpdateEquipmentAsset: (asset: EquipmentAsset) => void;
}

export const MitraAndInternalServicesView: React.FC<MitraAndInternalServicesViewProps> = ({
  parties,
  workOrders,
  equipmentAssets,
  internalDepartments,
  projects,
  transactions,
  wbsNodes,
  costCodes,
  activeRole,
  onAddParty,
  onUpdateParty,
  onAddWorkOrder,
  onUpdateWorkOrder,
  onAddEquipmentAsset,
  onUpdateEquipmentAsset,
}) => {
  const [activeTab, setActiveTab] = useState<'PARTIES' | 'WORKSHOP' | 'ASSETS' | 'ALLOCATION' | 'PSAK224'>('PARTIES');
  const [searchTerm, setSearchTerm] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState<string>('ALL');

  // Modals state
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [showAddWOModal, setShowAddWOModal] = useState(false);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);

  // New Party Form State
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyLegalName, setNewPartyLegalName] = useState('');
  const [newPartyEntityType, setNewPartyEntityType] = useState<EntityType>('EXTERNAL_ENTITY');
  const [newPartyRelationship, setNewPartyRelationship] = useState<RelationshipType>('EXTERNAL_VENDOR');
  const [newPartyServices, setNewPartyServices] = useState<string>('Teknikal, Lifting');
  const [newPartyIsRelated, setNewPartyIsRelated] = useState(false);
  const [newPartyRelatedDesc, setNewPartyRelatedDesc] = useState('');
  const [newPartyBankName, setNewPartyBankName] = useState('BCA');
  const [newPartyBankAcc, setNewPartyBankAcc] = useState('');
  const [newPartyPhone, setNewPartyPhone] = useState('');
  const [newPartyNotes, setNewPartyNotes] = useState('');

  // New Work Order Form State
  const [woTitle, setWoTitle] = useState('');
  const [woCategory, setWoCategory] = useState<WorkOrder['workCategory']>('FABRIKASI');
  const [woDepartment, setWoDepartment] = useState('DEP-WS');
  const [woPartyName, setWoPartyName] = useState('Divisi Workshop & Fabrikasi (Internal PT)');
  const [woMatCost, setWoMatCost] = useState('20000000');
  const [woLabCost, setWoLabCost] = useState('10000000');
  const [woMachCost, setWoMachCost] = useState('3000000');
  const [woConsCost, setWoConsCost] = useState('2000000');
  const [woOvCost, setWoOvCost] = useState('3000000');
  const [woOutputName, setWoOutputName] = useState('');
  const [woOutputClass, setWoOutputClass] = useState<OutputClassification>('FIXED_ASSET');
  const [woTargetProject, setWoTargetProject] = useState(projects[0]?.id || '');
  const [woNotes, setWoNotes] = useState('');

  // Live allocations are read from posted transactions; there is no standalone demo ledger.
  const liveAllocations = transactions.flatMap(transaction => transaction.allocations || []);

    // Grand stats
  const internalCount = parties.filter(p => p.relationshipType === 'INTERNAL_DEPARTMENT').length;
  const relatedCount = parties.filter(p => p.relationshipType === 'RELATED_PARTY' || p.relatedPartyInfo?.isRelatedParty).length;
  const externalVendorCount = parties.filter(p => p.relationshipType === 'EXTERNAL_VENDOR' || p.relationshipType === 'CONTRACTOR' || p.relationshipType === 'SUBCONTRACTOR').length;
  const totalWOCost = workOrders.reduce((acc, wo) => acc + wo.totalCost, 0);
  const totalEquipmentNBV = equipmentAssets.reduce((acc, eq) => acc + eq.netBookValue, 0);

  // Filter parties
  const filteredParties = parties.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.legalName && p.legalName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (relationshipFilter === 'ALL') return matchesSearch;
    if (relationshipFilter === 'INTERNAL') return matchesSearch && p.relationshipType === 'INTERNAL_DEPARTMENT';
    if (relationshipFilter === 'RELATED_PARTY') return matchesSearch && (p.relationshipType === 'RELATED_PARTY' || p.relatedPartyInfo?.isRelatedParty);
    if (relationshipFilter === 'VENDOR_CONTRACTOR') return matchesSearch && (['EXTERNAL_VENDOR', 'CONTRACTOR', 'SUBCONTRACTOR'].includes(p.relationshipType));
    if (relationshipFilter === 'INVESTOR') return matchesSearch && (p.relationshipType === 'INVESTOR' || p.role === 'INVESTOR');
    return matchesSearch;
  });

  const handleCreateParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartyName.trim()) return;

    const newP: Party = {
      id: `PTY-${Date.now().toString().slice(-4)}`,
      code: newPartyRelationship === 'INTERNAL_DEPARTMENT' ? `INT-${Date.now().toString().slice(-3)}` : `VND-${Date.now().toString().slice(-3)}`,
      name: newPartyName,
      legalName: newPartyLegalName || newPartyName,
      entityType: newPartyEntityType,
      relationshipType: newPartyRelationship,
      roles: [newPartyRelationship === 'INTERNAL_DEPARTMENT' ? 'DEVELOPER' : 'SUPPLIER'],
      role: newPartyRelationship === 'INTERNAL_DEPARTMENT' ? 'DEVELOPER' : 'SUPPLIER',
      services: newPartyServices.split(',').map(s => s.trim()).filter(Boolean),
      relatedPartyInfo: newPartyIsRelated ? {
        isRelatedParty: true,
        relationshipDescription: newPartyRelatedDesc || 'Pihak Berelasi sesuai PSAK 224 / SAK EP',
        controlType: 'COMMON_CONTROL',
        reportingNotes: 'Wajib diungkapkan dalam CALK'
      } : undefined,
      bankName: newPartyBankName,
      bankAccountNo: newPartyBankAcc,
      phone: newPartyPhone,
      notes: newPartyNotes,
      isVerified: true,
      totalTransactions: 0,
      totalOutstanding: 0,
      status: 'ACTIVE'
    };

    onAddParty(newP);
    setShowAddPartyModal(false);
    setNewPartyName('');
    setNewPartyLegalName('');
    setNewPartyRelatedDesc('');
    setNewPartyBankAcc('');
    setNewPartyNotes('');
  };

  const handleCreateWO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!woTitle.trim()) return;

    const mat = parseFloat(woMatCost) || 0;
    const lab = parseFloat(woLabCost) || 0;
    const mach = parseFloat(woMachCost) || 0;
    const cons = parseFloat(woConsCost) || 0;
    const ov = parseFloat(woOvCost) || 0;
    const total = mat + lab + mach + cons + ov;

    const newWO: WorkOrder = {
      id: `WO-${Date.now().toString().slice(-5)}`,
      woNumber: `WO-WS-${Date.now().toString().slice(-3)}`,
      title: woTitle,
      workCategory: woCategory,
      internalDepartmentId: woDepartment,
      partyName: woPartyName,
      startDate: new Date().toISOString().split('T')[0],
      targetEndDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'IN_PROGRESS',
      materialCost: mat,
      laborCost: lab,
      machineCost: mach,
      consumablesCost: cons,
      overheadCost: ov,
      totalCost: total,
      outputName: woOutputName || woTitle,
      outputClassification: woOutputClass,
      destinationProjectId: woTargetProject,
      destinationProjectName: projects.find(p => p.id === woTargetProject)?.name || 'Proyek Umum',
      destinationLocation: 'Site Lapangan',
      notes: woNotes
    };

    onAddWorkOrder(newWO);
    setShowAddWOModal(false);
    setWoTitle('');
    setWoOutputName('');
    setWoNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <Factory className="w-3.5 h-3.5" /> Enterprise Architecture
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                PSAK 224 &amp; 216 Compliant
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mt-2">
              Mitra, Unit Internal &amp; Workshop Bengkel
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Membedakan status hukum pihak: <strong>Departemen Internal PT</strong> (Service Cost Center, bukan vendor), <strong>Pihak Berelasi PSAK 224</strong> (Common Control), <strong>Mitra Fabrikasi / Lifting</strong>, serta <strong>Cost Allocation Engine</strong> multi-project &amp; multi-unit.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddPartyModal(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Tambah Mitra/Entitas
            </button>
            <button
              onClick={() => setShowAddWOModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition"
            >
              <Wrench className="w-4 h-4" /> Buat Work Order Bengkel
            </button>
          </div>
        </div>

        {/* 5 Dimension KPI Badges */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" /> Unit Internal PT
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">{internalCount} Divisi</div>
            <div className="text-[11px] text-slate-500">Service Cost Center</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Pihak Berelasi (PSAK 224)
            </div>
            <div className="text-lg font-bold text-amber-700 mt-1">{relatedCount} Entitas</div>
            <div className="text-[11px] text-slate-500">Wajib Pengungkapan CALK</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <HardHat className="w-3.5 h-3.5 text-emerald-600" /> Vendor &amp; Kontraktor
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">{externalVendorCount} Mitra</div>
            <div className="text-[11px] text-slate-500">Kontrak &amp; PO Eksternal</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-indigo-600" /> Work Order Bengkel
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">{formatCompactRupiah(totalWOCost)}</div>
            <div className="text-[11px] text-slate-500">{workOrders.length} pekerjaan fabrikasi</div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-purple-600" /> Aset &amp; Lifting (PSAK 216)
            </div>
            <div className="text-lg font-bold text-slate-900 mt-1">{formatCompactRupiah(totalEquipmentNBV)}</div>
            <div className="text-[11px] text-slate-500">{equipmentAssets.length} unit alat terdaftar</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-xl">
        <button
          onClick={() => setActiveTab('PARTIES')}
          className={`px-4 py-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'PARTIES'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Master Pihak &amp; Entitas ({parties.length})
        </button>

        <button
          onClick={() => setActiveTab('WORKSHOP')}
          className={`px-4 py-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'WORKSHOP'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Bengkel &amp; Fabrikasi ({workOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('ASSETS')}
          className={`px-4 py-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'ASSETS'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Truck className="w-4 h-4" />
          Equipment &amp; Lifting Register ({equipmentAssets.length})
        </button>

        <button
          onClick={() => setActiveTab('ALLOCATION')}
          className={`px-4 py-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'ALLOCATION'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Split className="w-4 h-4" />
          Mesin Alokasi Biaya (Multi-Target)
        </button>

        <button
          onClick={() => setActiveTab('PSAK224')}
          className={`px-4 py-3.5 text-sm font-semibold border-b-2 flex items-center gap-2 transition ${
            activeTab === 'PSAK224'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          Pengungkapan PSAK 224
        </button>
      </div>

      {/* TAB 1: MASTER PIHAK & ENTITAS */}
      {activeTab === 'PARTIES' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari pihak, legal entity, kode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                {[
                  { id: 'ALL', label: 'Semua Hubungan' },
                  { id: 'INTERNAL', label: 'Departemen Internal' },
                  { id: 'RELATED_PARTY', label: 'Pihak Berelasi (PSAK 224)' },
                  { id: 'VENDOR_CONTRACTOR', label: 'Vendor & Subkon' },
                  { id: 'INVESTOR', label: 'Investor Modal' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setRelationshipFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${
                      relationshipFilter === f.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Menampilkan {filteredParties.length} dari {parties.length} pihak
            </div>
          </div>

          {/* Party Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredParties.map((p) => {
              const isInternal = p.relationshipType === 'INTERNAL_DEPARTMENT';
              const isRelated = p.relationshipType === 'RELATED_PARTY' || p.relatedPartyInfo?.isRelatedParty;
              
              return (
                <div 
                  key={p.id}
                  className={`bg-white rounded-xl border p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between ${
                    isInternal ? 'border-blue-200 bg-blue-50/20' : isRelated ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Header Badges */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 font-mono block">
                          {p.code}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 leading-tight">
                          {p.name}
                        </h3>
                        {p.legalName && p.legalName !== p.name && (
                          <div className="text-xs text-slate-500 font-medium">
                            {p.legalName}
                          </div>
                        )}
                      </div>

                      {isInternal ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 whitespace-nowrap border border-blue-200">
                          INTERNAL PT
                        </span>
                      ) : isRelated ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 whitespace-nowrap border border-amber-300 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> PIHAK BERELASI
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 whitespace-nowrap border border-slate-200">
                          {p.relationshipType}
                        </span>
                      )}
                    </div>

                    {/* Related Party Information Box */}
                    {isRelated && p.relatedPartyInfo && (
                      <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                        <div className="font-semibold flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-amber-700" /> SAK EP / PSAK 224 Disclosure:
                        </div>
                        <p className="mt-0.5 text-amber-800 text-[11px]">
                          {p.relatedPartyInfo.relationshipDescription}
                        </p>
                      </div>
                    )}

                    {/* Internal Department Notice */}
                    {isInternal && (
                      <div className="mb-3 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                        <div className="font-semibold flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-blue-700" /> Service Cost Center:
                        </div>
                        <p className="mt-0.5 text-blue-800 text-[11px]">
                          Biaya dialokasikan via WBS/Cost Object. Tidak menimbulkan mutasi kas AP eksternal fiktif.
                        </p>
                      </div>
                    )}

                    {/* Services/Functions pills */}
                    {p.services && p.services.length > 0 && (
                      <div className="mb-3">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                          Layanan / Fungsi:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {p.services.map((svc, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium"
                            >
                              {svc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Contact & Banking */}
                    <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-3 mt-3">
                      {p.contactPerson && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Kontak:</span>
                          <span className="font-medium text-slate-800">{p.contactPerson}</span>
                        </div>
                      )}
                      {p.phone && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Telepon:</span>
                          <span className="font-mono">{p.phone}</span>
                        </div>
                      )}
                      {p.bankAccountNo && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Rekening:</span>
                          <span className="font-mono">{p.bankName} {p.bankAccountNo}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Metrics */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase">Outstanding Saldo</span>
                      <span className={`font-bold font-mono ${p.totalOutstanding > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {formatRupiah(p.totalOutstanding)}
                      </span>
                    </div>

                    <span className="text-slate-500 font-medium text-[11px]">
                      {p.totalTransactions} transaksi
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: BENGKEL & FABRIKASI (WORKSHOP & WORK ORDERS) */}
      {activeTab === 'WORKSHOP' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Work Order Bengkel &amp; Fabrikasi</h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Pusat kalkulasi biaya 5 unsur: <strong>Material + Tenaga Kerja + Mesin + Consumables + Overhead</strong>, serta penetapan sifat akuntansi output (PSAK 216 / IAS 16 / IAS 2).
              </p>
            </div>

            <button
              onClick={() => setShowAddWOModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> Buat Work Order Baru
            </button>
          </div>

          {/* Work Orders List */}
          <div className="space-y-4">
            {workOrders.map((wo) => {
              const outputBadgeColor = 
                wo.outputClassification === 'FIXED_ASSET' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                wo.outputClassification === 'PROJECT_COST' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                wo.outputClassification === 'INVENTORY' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                'bg-slate-100 text-slate-800 border-slate-200';

              return (
                <div key={wo.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {wo.woNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${outputBadgeColor}`}>
                          OUTPUT: {wo.outputClassification}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                          {wo.workCategory}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1.5">
                        {wo.title}
                      </h3>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Pelaksana: <strong>{wo.partyName}</strong> • Target: {wo.destinationProjectName} ({wo.destinationLocation})
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-medium">Total Akumulasi Biaya WO</div>
                      <div className="text-xl font-bold font-mono text-slate-900">
                        {formatRupiah(wo.totalCost)}
                      </div>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        {wo.status}
                      </span>
                    </div>
                  </div>

                  {/* 5 Cost Elements Breakdown Grid */}
                  <div>
                    <div className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                      Rincian 5 Komponen Biaya Fabrikasi (Cost Accumulation):
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[11px]">1. Material</span>
                        <span className="font-bold font-mono text-slate-800">{formatRupiah(wo.materialCost)}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[11px]">2. Tenaga Kerja (Labor)</span>
                        <span className="font-bold font-mono text-slate-800">{formatRupiah(wo.laborCost)}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[11px]">3. Mesin / Alat (Machine)</span>
                        <span className="font-bold font-mono text-slate-800">{formatRupiah(wo.machineCost)}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[11px]">4. Consumables (Kawat Las, dll)</span>
                        <span className="font-bold font-mono text-slate-800">{formatRupiah(wo.consumablesCost)}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-400 block text-[11px]">5. Workshop Overhead</span>
                        <span className="font-bold font-mono text-slate-800">{formatRupiah(wo.overheadCost)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Output Destination & Allocations */}
                  {wo.allocations && wo.allocations.length > 0 && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <div className="font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Split className="w-3.5 h-3.5 text-blue-600" /> Alokasi Beban Proyek:
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {wo.allocations.map((alc, idx) => (
                          <div key={idx} className="p-2 bg-white rounded border border-slate-200 flex justify-between items-center">
                            <div>
                              <span className="font-bold text-slate-800">{alc.projectName}</span>
                              <span className="text-slate-500 ml-1.5">({alc.block} - Cost Code: {alc.costCode})</span>
                            </div>
                            <div className="font-mono font-bold text-blue-700">
                              {alc.percentage}% ({formatCompactRupiah(alc.amount)})
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer notes */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-slate-500 pt-1">
                    <div>
                      Output: <strong>{wo.outputName}</strong> {wo.outputAssetCode && `(Kode: ${wo.outputAssetCode})`}
                    </div>
                    {wo.inspectedBy && (
                      <div>
                        Inspeksi QC: <strong>{wo.inspectedBy}</strong> ({formatDateIndo(wo.inspectionDate || '')})
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ASSET & LIFTING REGISTER (PSAK 216) */}
      {activeTab === 'ASSETS' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Equipment &amp; Asset Register (PSAK 216 / IAS 16)</h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Register alat berat, mesin hoist lifting, dan peralatan workshop milik PT. Pelacakan perolehan, depresiasi garis lurus, jam kerja, dan lokasi proyek.
              </p>
            </div>
            
            <button
              onClick={() => setShowAddAssetModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> Registrasi Aset Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {equipmentAssets.map((eq) => (
              <div key={eq.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {eq.code}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      eq.status === 'OPERASIONAL' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {eq.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {eq.name}
                  </h3>
                  <div className="text-xs text-slate-500 mt-1">
                    Kategori: <strong>{eq.category}</strong> • Kepemilikan: <strong>{eq.ownership}</strong>
                  </div>

                  <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Departemen Kustodian:</span>
                      <span className="font-medium text-slate-800">{eq.custodianDepartment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Lokasi Proyek:</span>
                      <span className="font-medium text-slate-800">{eq.currentLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Jam Kerja Terpakai:</span>
                      <span className="font-mono font-bold text-blue-700">{eq.totalHoursLogged} Jam</span>
                    </div>
                    {eq.hourlyRate && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tarif Cost Driver:</span>
                        <span className="font-mono font-bold text-slate-800">{formatRupiah(eq.hourlyRate)} / Jam</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Harga Perolehan:</span>
                      <span className="font-mono font-semibold">{formatRupiah(eq.acquisitionCost)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Akumulasi Penyusutan:</span>
                      <span className="font-mono font-semibold text-rose-600">-{formatRupiah(eq.accumulatedDepreciation)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Nilai Buku Bersih (NBV)</span>
                    <span className="text-base font-bold font-mono text-emerald-700">
                      {formatRupiah(eq.netBookValue)}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    Masa Manfaat: {eq.usefulLifeYears} Tahun
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MESIN ALOKASI BIAYA (COST ALLOCATION ENGINE) */}
      {activeTab === 'ALLOCATION' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Split className="w-5 h-5 text-indigo-600" /> Mesin Alokasi Biaya Lintas Proyek / Unit
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Sumber data berasal langsung dari transaksi yang memiliki allocation detail. Tidak ada ledger simulasi terpisah.
                </p>
              </div>
              <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-500">Transaksi beralokasi:</span>
                <strong className="ml-1 text-slate-900">{transactions.filter(t => (t.allocations || []).length > 0).length}</strong>
              </div>
            </div>

            {liveAllocations.length === 0 ? (
              <div className="mt-6 p-8 text-center rounded-xl border border-dashed border-slate-300 bg-slate-50">
                <AlertCircle className="w-9 h-9 text-slate-400 mx-auto mb-2" />
                <div className="text-sm font-bold text-slate-700">Belum ada transaksi dengan alokasi multi-target.</div>
                <div className="text-xs text-slate-500 mt-1">Allocation detail akan muncul otomatis setelah transaksi diposting melalui transaction engine.</div>
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 text-xs font-semibold uppercase">
                      <th className="p-3 rounded-l-lg">Target Proyek</th>
                      <th className="p-3">Blok / Unit</th>
                      <th className="p-3">WBS &amp; Cost Code</th>
                      <th className="p-3">Cost Center</th>
                      <th className="p-3 text-right">Persentase</th>
                      <th className="p-3 text-right">Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {liveAllocations.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-semibold text-slate-900">{item.projectName}</td>
                        <td className="p-3 text-slate-600">{item.block || item.unitId || '-'}</td>
                        <td className="p-3">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{item.costCode}</span>
                          <span className="text-xs text-slate-600 ml-1.5">{item.costCodeName || '-'}</span>
                        </td>
                        <td className="p-3 text-xs text-slate-600">{item.costCenter || '-'}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">{item.percentage.toFixed(2)}%</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">{formatRupiah(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 font-bold text-sm bg-slate-50">
                      <td colSpan={4} className="p-3 text-slate-700">Total</td>
                      <td className="p-3 text-right font-mono text-indigo-700">
                        {liveAllocations.reduce((sum, item) => sum + item.percentage, 0).toFixed(2)}%
                      </td>
                      <td className="p-3 text-right font-mono text-indigo-700">
                        {formatRupiah(liveAllocations.reduce((sum, item) => sum + item.amount, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PENGUNGKAPAN PSAK 224 */}
      {activeTab === 'PSAK224' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-6 h-6 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-bold text-amber-900">
                  Laporan Pengungkapan Pihak Berelasi (PSAK 224 / SAK EP Bab 33)
                </h2>
                <p className="text-xs text-amber-800 mt-1">
                  Standar Akuntansi Keuangan mengharuskan pengungkapan eksplisit atas hubungan, transaksi, saldo, dan komitmen dengan pihak-pihak berelasi (misal: entitas terafiliasi dengan kepemilikan bersama, pemegang saham, direksi, dan keluarga dekat).
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Daftar Entitas Pihak Berelasi Teridentifikasi
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-semibold uppercase">
                    <th className="p-3">Nama Entitas</th>
                    <th className="p-3">Sifat Hubungan / Pengendalian</th>
                    <th className="p-3">Layanan / Kontrak</th>
                    <th className="p-3 text-right">Saldo Hutang/Piutang</th>
                    <th className="p-3">Keterangan Pengungkapan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parties.filter(p => p.relationshipType === 'RELATED_PARTY' || p.relatedPartyInfo?.isRelatedParty).map((rp) => (
                    <tr key={rp.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">
                        {rp.name}
                        <span className="block text-[11px] text-slate-400 font-mono font-normal">{rp.legalName}</span>
                      </td>
                      <td className="p-3 font-medium text-amber-800">
                        {rp.relatedPartyInfo?.relationshipDescription || 'Pihak Berelasi'}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {rp.services?.map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-medium text-slate-700">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(rp.totalOutstanding)}
                      </td>
                      <td className="p-3 text-slate-600">
                        {rp.relatedPartyInfo?.reportingNotes || rp.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH MITRA / ENTITAS */}
      {showAddPartyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Tambah Mitra / Entitas / Unit Baru
              </h3>
              <button
                onClick={() => setShowAddPartyModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateParty} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Tampilan (Display Name) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PT Mitra Lifting Indonesia"
                  value={newPartyName}
                  onChange={(e) => setNewPartyName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Badan Hukum Resmi (Legal Name)</label>
                <input
                  type="text"
                  placeholder="e.g. PT Mitra Lifting Indonesia Tbk / CV ..."
                  value={newPartyLegalName}
                  onChange={(e) => setNewPartyLegalName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tipe Entitas *</label>
                  <select
                    value={newPartyEntityType}
                    onChange={(e) => setNewPartyEntityType(e.target.value as EntityType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="EXTERNAL_ENTITY">Entitas Eksternal (PT/CV)</option>
                    <option value="INTERNAL_DEPARTMENT">Departemen Internal PT</option>
                    <option value="INDIVIDUAL">Perorangan (Mandor/Tukang)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hubungan Hukum *</label>
                  <select
                    value={newPartyRelationship}
                    onChange={(e) => {
                      const val = e.target.value as RelationshipType;
                      setNewPartyRelationship(val);
                      if (val === 'RELATED_PARTY') setNewPartyIsRelated(true);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="EXTERNAL_VENDOR">External Vendor / Supplier</option>
                    <option value="CONTRACTOR">Kontraktor Utama</option>
                    <option value="SUBCONTRACTOR">Subkontraktor</option>
                    <option value="RELATED_PARTY">Pihak Berelasi (PSAK 224)</option>
                    <option value="INTERNAL_DEPARTMENT">Departemen Internal PT</option>
                    <option value="MANDOR">Mandor Tenaga Kerja</option>
                    <option value="INVESTOR">Investor / Mitra Pemodal</option>
                  </select>
                </div>
              </div>

              {/* Related Party Checkbox */}
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <label className="flex items-center gap-2 font-bold text-amber-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPartyIsRelated}
                    onChange={(e) => setNewPartyIsRelated(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Tandai Sebagai Pihak Berelasi (PSAK 224 / SAK EP)</span>
                </label>
                {newPartyIsRelated && (
                  <div className="mt-2">
                    <label className="text-[11px] font-semibold text-amber-800 block mb-1">
                      Deskripsi Pengendalian / Kepemilikan Saham:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Saham 40% dimiliki Direktur Utama PT Developer"
                      value={newPartyRelatedDesc}
                      onChange={(e) => setNewPartyRelatedDesc(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-amber-300 rounded text-xs bg-white"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Daftar Layanan / Spesialisasi (Pisahkan Koma)</label>
                <input
                  type="text"
                  placeholder="e.g. Lifting, Fabrikasi, Workshop, Maintenance"
                  value={newPartyServices}
                  onChange={(e) => setNewPartyServices(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bank Rekening</label>
                  <input
                    type="text"
                    placeholder="BCA / Mandiri / BRI"
                    value={newPartyBankName}
                    onChange={(e) => setNewPartyBankName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nomor Rekening</label>
                  <input
                    type="text"
                    placeholder="Nomor rekening bank..."
                    value={newPartyBankAcc}
                    onChange={(e) => setNewPartyBankAcc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddPartyModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg"
                >
                  Simpan Entitas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BUAT WORK ORDER BENGKEL */}
      {showAddWOModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Buat Work Order Bengkel &amp; Fabrikasi
              </h3>
              <button
                onClick={() => setShowAddWOModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWO} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Judul Pekerjaan Fabrikasi / Servis *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fabrikasi Lifting Equipment Tower Hoist 5-Ton"
                  value={woTitle}
                  onChange={(e) => setWoTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori Pekerjaan</label>
                  <select
                    value={woCategory}
                    onChange={(e) => setWoCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="FABRIKASI">Fabrikasi Komponen / Konstruksi</option>
                    <option value="LIFTING_EQUIPMENT">Fabrikasi Alat Lifting</option>
                    <option value="MAINTENANCE">Maintenance &amp; Perbaikan Alat</option>
                    <option value="WELDING">Welding &amp; Pengelasan</option>
                    <option value="VEHICLE_REPAIR">Perbaikan Armada Kendaraan</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Departemen / Pelaksana</label>
                  <select
                    value={woDepartment}
                    onChange={(e) => setWoDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {internalDepartments.map(dep => (
                      <option key={dep.id} value={dep.id}>{dep.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 5 Cost Elements Inputs */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Kalkulator 5 Unsur Biaya (Material + Labor + Mesin + Consumables + Overhead):
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-slate-600 block mb-0.5">1. Biaya Material (Rp)</label>
                    <input
                      type="number"
                      value={woMatCost}
                      onChange={(e) => setWoMatCost(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-0.5">2. Biaya Tenaga Kerja (Rp)</label>
                    <input
                      type="number"
                      value={woLabCost}
                      onChange={(e) => setWoLabCost(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-0.5">3. Jam Mesin (Machine) (Rp)</label>
                    <input
                      type="number"
                      value={woMachCost}
                      onChange={(e) => setWoMachCost(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-0.5">4. Consumables / Habis Pakai</label>
                    <input
                      type="number"
                      value={woConsCost}
                      onChange={(e) => setWoConsCost(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 block mb-0.5">5. Overhead Bengkel</label>
                    <input
                      type="number"
                      value={woOvCost}
                      onChange={(e) => setWoOvCost(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold"
                    />
                  </div>
                  <div className="p-2 bg-emerald-50 border border-emerald-200 rounded flex flex-col justify-center">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase">Total Biaya WO:</span>
                    <span className="text-sm font-bold font-mono text-emerald-900">
                      {formatRupiah(
                        (parseFloat(woMatCost)||0) +
                        (parseFloat(woLabCost)||0) +
                        (parseFloat(woMachCost)||0) +
                        (parseFloat(woConsCost)||0) +
                        (parseFloat(woOvCost)||0)
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Output Accounting Destination */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Klasifikasi Akuntansi Output (PSAK 216 / IAS 16) *
                  </label>
                  <select
                    value={woOutputClass}
                    onChange={(e) => setWoOutputClass(e.target.value as OutputClassification)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold"
                  >
                    <option value="FIXED_ASSET">FIXED ASSET (Aset Tetap Milik PT - Alat Lifting/Mesin)</option>
                    <option value="PROJECT_COST">PROJECT COST (Biaya Langsung dialokasikan ke WBS Proyek)</option>
                    <option value="INVENTORY">INVENTORY (Stok Suku Cadang / Komponen Siap Pakai)</option>
                    <option value="SERVICE">SERVICE (Jasa Operasional Langsung)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Proyek</label>
                  <select
                    value={woTargetProject}
                    onChange={(e) => setWoTargetProject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {projects.map(prj => (
                      <option key={prj.id} value={prj.id}>{prj.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Output / Aset Hasil Fabrikasi</label>
                <input
                  type="text"
                  placeholder="e.g. Tower Hoist 5-Ton Unit Proyek (LIFTING-002)"
                  value={woOutputName}
                  onChange={(e) => setWoOutputName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddWOModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
                >
                  Simpan Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
