import { Transaction, IntegrationConfig } from '../types';
import { formatRupiah } from '../utils/formatters';

export function checkIntegrationsStatus(config: IntegrationConfig): IntegrationConfig {
  // Check if real environment variables exist (client side or Vite)
  const hasFirebase = Boolean((import.meta as any).env?.VITE_FIREBASE_API_KEY);
  const hasGitHub = Boolean((import.meta as any).env?.VITE_GITHUB_REPO_URL);
  const hasCloudflare = Boolean((import.meta as any).env?.VITE_CF_PAGES_URL);
  const hasWhatsAppAPI = Boolean((import.meta as any).env?.VITE_WHATSAPP_TOKEN);

  return {
    google: {
      ...config.google,
      status: hasFirebase ? 'CONFIGURED' : 'NOT_CONFIGURED',
    },
    github: {
      ...config.github,
      status: hasGitHub ? 'CONFIGURED' : 'NOT_CONFIGURED',
    },
    cloudflare: {
      ...config.cloudflare,
      status: hasCloudflare ? 'CONFIGURED' : 'NOT_CONFIGURED',
    },
    whatsapp: {
      manualModeAvailable: true,
      apiStatus: hasWhatsAppAPI ? 'CONFIGURED' : 'NOT_CONFIGURED',
    },
  };
}

/**
 * Generates an actual WhatsApp wa.me shareable link with pre-formatted transaction details
 */
export function generateWhatsAppManualLink(
  phoneNumber: string,
  tx: Transaction,
  senderRole: string
): string {
  // Clean phone number (e.g. 081234 -> 6281234)
  let cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  }

  const message = [
    `*NOTIFIKASI TRANSAKSI PROYEK*`,
    `🏢 *Proyek:* ${tx.projectName || 'Proyek Perumahan'}`,
    `📄 *No. Transaksi:* ${tx.id}`,
    `📅 *Tanggal:* ${tx.date}`,
    `👤 *Pihak/Rekanan:* ${tx.partyName} (${tx.partyRole})`,
    `📝 *Uraian:* ${tx.description}`,
    `💰 *Jumlah:* ${formatRupiah(tx.totalAmount)}`,
    `💳 *Metode:* ${tx.paymentMethod.replace(/_/g, ' ')}`,
    `📌 *Status:* ${tx.status}`,
    `\n_Dikirim melalui Sistem Kontrol Proyek Developer (${senderRole})_`
  ].join('\n');

  const encoded = encodeURIComponent(message);
  return cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}
