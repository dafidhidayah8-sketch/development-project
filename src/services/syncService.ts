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

export async function processSyncQueue(
  queue: SyncOutboxItem[],
  onProgress?: (updatedQueue: SyncOutboxItem[]) => void
): Promise<{ success: boolean; syncedCount: number; failedCount: number; updatedQueue: SyncOutboxItem[] }> {
  let updatedQueue = [...queue];
  let synced = 0;
  let failed = 0;

  for (let i = 0; i < updatedQueue.length; i++) {
    const item = updatedQueue[i];
    if (item.status === 'PENDING' || item.status === 'FAILED') {
      // Mark as syncing
      updatedQueue[i] = { ...item, status: 'SYNCING' };
      if (onProgress) onProgress([...updatedQueue]);

      // Small async tick for real network round-trip simulation
      await new Promise(r => setTimeout(r, 120));

      // Network check
      const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      if (!isOnline) {
        updatedQueue[i] = {
          ...item,
          status: 'FAILED',
          retryCount: item.retryCount + 1,
          lastError: 'Tidak ada koneksi internet (Offline)',
        };
        failed++;
      } else {
        // Successful dispatch
        updatedQueue[i] = {
          ...item,
          status: 'SYNCED',
          lastError: undefined,
        };
        synced++;
      }
      if (onProgress) onProgress([...updatedQueue]);
    }
  }

  return {
    success: failed === 0,
    syncedCount: synced,
    failedCount: failed,
    updatedQueue,
  };
}
