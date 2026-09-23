import { SyncOutboxItem } from '../types';

export function enqueueSync(
  currentQueue: SyncOutboxItem[],
  entity: SyncOutboxItem['entity'],
  entityId: string,
  operation: SyncOutboxItem['operation'],
  payload: any
): SyncOutboxItem[] {
  const newItem: SyncOutboxItem = {
    id: `SYNC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    entity,
    entityId,
    operation,
    payload,
    timestamp: new Date().toISOString(),
    status: 'PENDING',
    retryCount: 0,
  };
  return [newItem, ...currentQueue];
}

/**
 * Processes the local outbox safely.
 *
 * IMPORTANT: This browser-only build does not have a remote transport configured.
 * Therefore an online browser is NOT treated as proof that data reached a server.
 * Items are only marked SYNCED when a real transport callback confirms delivery.
 */
export async function processSyncQueue(
  queue: SyncOutboxItem[],
  onProgress?: (updatedQueue: SyncOutboxItem[]) => void,
  transport?: (item: SyncOutboxItem) => Promise<void>
): Promise<{ success: boolean; syncedCount: number; failedCount: number; pendingCount: number; updatedQueue: SyncOutboxItem[] }> {
  let updatedQueue = [...queue];
  let synced = 0;
  let failed = 0;

  for (let i = 0; i < updatedQueue.length; i++) {
    const item = updatedQueue[i];
    if (item.status !== 'PENDING' && item.status !== 'FAILED') continue;

    updatedQueue[i] = { ...item, status: 'SYNCING' };
    onProgress?.([...updatedQueue]);

    if (!transport) {
      updatedQueue[i] = {
        ...item,
        status: 'FAILED',
        retryCount: item.retryCount + 1,
        lastError: 'Belum ada koneksi transport remote. Data tetap aman di antrean lokal.',
      };
      failed++;
      onProgress?.([...updatedQueue]);
      continue;
    }

    try {
      await transport(item);
      updatedQueue[i] = { ...item, status: 'SYNCED', lastError: undefined };
      synced++;
    } catch (error: any) {
      updatedQueue[i] = {
        ...item,
        status: 'FAILED',
        retryCount: item.retryCount + 1,
        lastError: error?.message || 'Pengiriman remote gagal.',
      };
      failed++;
    }
    onProgress?.([...updatedQueue]);
  }

  return {
    success: failed === 0,
    syncedCount: synced,
    failedCount: failed,
    pendingCount: updatedQueue.filter(i => i.status === 'PENDING' || i.status === 'SYNCING' || i.status === 'FAILED').length,
    updatedQueue,
  };
}
