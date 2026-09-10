import { db } from './client.js'

export async function enqueueOfflineAction(actionType, entityType, payload) {
  try {
    return await db.offlineQueue.add({
      actionType,
      entityType,
      payload,
      timestamp: Date.now()
    })
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      throw new Error('Storage full! Cannot queue offline action.')
    }
    throw err
  }
}

export async function getPendingOfflineActions() {
  return await db.offlineQueue.orderBy('timestamp').toArray()
}

export async function removeOfflineAction(id) {
  return await db.offlineQueue.delete(id)
}
