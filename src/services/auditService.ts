import { AuditLog, UserRole } from '../types';

export function createAuditRecord(
  action: AuditLog['action'],
  recordId: string,
  description: string,
  userName: string,
  userRole: UserRole,
  previousValue?: string,
  newValue?: string
): AuditLog {
  const timestamp = new Date().toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return {
    id: `AUD-${Date.now().toString().slice(-6)}`,
    timestamp,
    userName,
    userRole,
    action,
    recordId,
    description,
    previousValue,
    newValue,
  };
}
