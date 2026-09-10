import { processOfflineQueueUseCase } from '@/usecases/recordUseCases.js'
import { useOfflineQueueStore } from '@/stores/index.js'

export async function processOfflineQueue() {
  if (!navigator.onLine) return

  const offlineQueueStore = useOfflineQueueStore()
  if (offlineQueueStore.syncing) return

  offlineQueueStore.syncing = true
  try {
    await processOfflineQueueUseCase()
  } catch (err) {
    console.error('Queue execution error:', err)
  } finally {
    offlineQueueStore.syncing = false
  }
}
