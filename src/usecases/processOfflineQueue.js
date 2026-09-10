import { recordsRepository } from '@/repositories/recordsRepository.js'
import { apiAdapter } from '@/services/adapters/apiAdapter.js'

export async function processOfflineQueueUseCase() {
  const pendingActions = await recordsRepository.getPendingQueue()

  for (const action of pendingActions) {
    try {
      if (action.entityType === 'RECORD') {
        await apiAdapter.postRecord(action.payload)
      }

      if (action.payload?.entityId) {
        await recordsRepository.updateStatus(action.payload.entityId, 'SYNCED')
      }

      await recordsRepository.removeOfflineAction(action.id)
    } catch (err) {
      if (err.status >= 400 && err.status < 500) {
        if (action.payload?.entityId) {
          await recordsRepository.updateStatus(action.payload.entityId, 'SYNC_ERROR')
        }
        await recordsRepository.removeOfflineAction(action.id)
      } else {
        break
      }
    }
  }
}
