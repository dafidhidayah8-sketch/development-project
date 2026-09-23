import { Transaction, CostCode, AgingItem } from '../types';

function triggerCSVDownload(content: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportTransactionsToCSV(transactions: Transaction[], projectName: string): void {
  const headers = [
    'ID Transaksi',
    'Tanggal',
    'Project',
    'Tipe',
    'Kategori',
    'Uraian Transaksi',
    'Pihak / Rekanan',
    'Peranan',
    'WBS',
    'Cost Code',
    'Nominal (Rp)',
    'Metode Bayar',
    'Status Approval',
    'Operator',
  ];

  const rows = transactions.map(t => [
    `"${t.id}"`,
    `"${t.date}"`,
    `"${t.projectName || projectName}"`,
    `"${t.type}"`,
    `"${t.category}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${(t.partyName || '').replace(/"/g, '""')}"`,
    `"${t.partyRole || ''}"`,
    `"${t.wbsCode || ''}"`,
    `"${t.costCode || ''}"`,
    t.totalAmount,
    `"${t.paymentMethod}"`,
    `"${t.status}"`,
    `"${t.operatorName}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const safeProjectName = projectName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const dateStr = new Date().toISOString().slice(0, 10);
  triggerCSVDownload(csvContent, `transaksi_${safeProjectName}_${dateStr}.csv`);
}

export function exportCostCodesToCSV(costCodes: CostCode[], projectName: string): void {
  const headers = [
    'Kode Biaya',
    'Nama Pekerjaan / Material',
    'WBS',
    'COA Akun',
    'Satuan',
    'Anggaran RAB (Rp)',
    'Komitmen Terkontrak (Rp)',
    'Realisasi Aktual (Rp)',
    'Estimasi Penyelesaian (Rp)',
  ];

  const rows = costCodes.map(c => [
    `"${c.code}"`,
    `"${c.name.replace(/"/g, '""')}"`,
    `"${c.wbsCode}"`,
    `"${c.coaExpenseCode}"`,
    `"${c.unitOfMeasure}"`,
    c.budgetAllocated,
    c.committedAmount,
    c.actualAmount,
    c.forecastToComplete,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const safeProjectName = projectName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const dateStr = new Date().toISOString().slice(0, 10);
  triggerCSVDownload(csvContent, `rab_cost_codes_${safeProjectName}_${dateStr}.csv`);
}

export function exportAgingToCSV(agingItems: AgingItem[], type: 'AP' | 'AR', projectName: string): void {
  const headers = [
    'No Referensi',
    'Nama Pihak (Konsumen / Rekanan)',
    'Kategori',
    'Tgl Faktur/Invoice',
    'Tgl Jatuh Tempo',
    'Hari Keterlambatan',
    'Total Tagihan (Rp)',
    'Sudah Dibayar (Rp)',
    'Sisa Outstanding (Rp)',
    'Bucket Usia',
    'Tingkat Risiko',
  ];

  const filtered = agingItems.filter(i => i.type === type);
  const rows = filtered.map(i => [
    `"${i.referenceNo}"`,
    `"${i.entityName.replace(/"/g, '""')}"`,
    `"${i.category}"`,
    `"${i.invoiceDate}"`,
    `"${i.dueDate}"`,
    i.daysPastDue,
    i.totalAmount,
    i.paidAmount,
    i.outstandingBalance,
    `"${i.agingBucket}"`,
    `"${i.riskLevel}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const safeProjectName = projectName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const dateStr = new Date().toISOString().slice(0, 10);
  triggerCSVDownload(csvContent, `aging_${type.toLowerCase()}_${safeProjectName}_${dateStr}.csv`);
}
