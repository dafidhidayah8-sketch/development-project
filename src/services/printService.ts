import { Transaction } from '../types';
import { formatRupiah } from '../utils/formatters';

export function printTransactionVoucher(tx: Transaction): void {
  const printWindow = window.open('', '_blank', 'width=800,height=700');
  if (!printWindow) {
    alert('Pop-up terblokir oleh browser. Izinkan pop-up untuk mencetak voucher.');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>BUKTI TRANSAKSI PROYEK - ${tx.id}</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 40px; color: #1e293b; font-size: 13px; line-height: 1.5; }
        .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
        .title { font-size: 18px; font-weight: bold; text-transform: uppercase; margin: 0; color: #0f172a; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; background: #e2e8f0; }
        .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .meta-table td { padding: 6px 8px; }
        .meta-label { font-weight: 600; color: #64748b; width: 160px; }
        .amount-box { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 15px; text-align: center; margin: 25px 0; }
        .amount-value { font-size: 24px; font-weight: 800; color: #0f172a; }
        .sign-table { width: 100%; margin-top: 50px; border-collapse: collapse; text-align: center; }
        .sign-table td { width: 33.3%; padding: 10px; }
        .sign-line { margin-top: 60px; border-bottom: 1px solid #94a3b8; font-weight: bold; }
        @media print {
          body { margin: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="title">BUKTI PENGELUARAN / KAS MASUK</h1>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Sistem Kontrol Akuntansi Proyek Developer</div>
        </div>
        <div style="text-align: right;">
          <div style="font-weight: bold; font-size: 14px;">${tx.id}</div>
          <div style="font-size: 11px; color: #64748b;">Tanggal: ${tx.date}</div>
          <div class="badge" style="margin-top: 5px;">STATUS: ${tx.status}</div>
        </div>
      </div>

      <table class="meta-table">
        <tr>
          <td class="meta-label">Nama Proyek:</td>
          <td><strong>${tx.projectName || 'Proyek Lapangan'}</strong></td>
          <td class="meta-label">Jenis Transaksi:</td>
          <td><strong>${tx.type} (${tx.category})</strong></td>
        </tr>
        <tr>
          <td class="meta-label">Penerima / Pembayar:</td>
          <td><strong>${tx.partyName}</strong> (${tx.partyRole})</td>
          <td class="meta-label">WBS & Cost Code:</td>
          <td>${tx.wbsCode ? `WBS ${tx.wbsCode}` : '-'} / ${tx.costCode || '-'}</td>
        </tr>
        <tr>
          <td class="meta-label">Metode Pembayaran:</td>
          <td>${tx.paymentMethod.replace(/_/g, ' ')}</td>
          <td class="meta-label">No. Bukti / Kuitansi:</td>
          <td>${tx.receiptProofNo || tx.invoiceNo || '-'}</td>
        </tr>
        <tr>
          <td class="meta-label">Uraian Transaksi:</td>
          <td colspan="3" style="background: #f1f5f9; padding: 10px; border-radius: 6px;">
            ${tx.description}
          </td>
        </tr>
      </table>

      <div class="amount-box">
        <div style="font-size: 12px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; font-weight: 600;">Jumlah Uang:</div>
        <div class="amount-value">${formatRupiah(tx.totalAmount)}</div>
      </div>

      <table class="meta-table">
        <tr>
          <td class="meta-label">Jurnal Debit:</td>
          <td>Akun [${tx.debitAccountCode}]</td>
          <td class="meta-label">Jurnal Kredit:</td>
          <td>Akun [${tx.creditAccountCode}]</td>
        </tr>
        <tr>
          <td class="meta-label">Dicatat Oleh:</td>
          <td>${tx.operatorName} (${tx.createdAt})</td>
          <td class="meta-label">Posting Jurnal:</td>
          <td>${tx.journalPosted ? '✓ Terposting' : 'Menunggu Verifikasi'}</td>
        </tr>
      </table>

      <table class="sign-table">
        <tr>
          <td>
            <div>Dibuat Oleh:</div>
            <div class="sign-line">${tx.operatorName}</div>
            <div style="font-size: 10px; color: #64748b;">Operator / Kasir Proyek</div>
          </td>
          <td>
            <div>Diperiksa Oleh:</div>
            <div class="sign-line">Site QS / Finance</div>
            <div style="font-size: 10px; color: #64748b;">Pemeriksa Biaya & SPK</div>
          </td>
          <td>
            <div>Disetujui Oleh:</div>
            <div class="sign-line">Project Manager / Direksi</div>
            <div style="font-size: 10px; color: #64748b;">Otoritas Pembayaran</div>
          </td>
        </tr>
      </table>

      <div style="margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px;">
        Dokumen ini dihasilkan secara otomatis oleh Sistem Akuntansi & Kontrol Proyek Developer. Dicetak pada ${new Date().toLocaleString('id-ID')}.
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  // Trigger print after load
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 250);
}
