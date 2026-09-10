import Dexie from 'dexie'

export const db = new Dexie('KanishkaEnterprisesDB')

db.version(1).stores({
  records: '++id, entityId, record_type, date, status, syncedAt',
  offlineQueue: '++id, actionType, entityType, payload, createdAt',
  appMeta: 'key, value'
})

/**
 * Stores or updates a local record in IndexedDB.
 */
export async function saveLocalRecord(record) {
  return await db.records.put({
    ...record,
    updatedAt: new Date().toISOString()
  })
}

/**
 * Enqueues a mutation action when offline.
 */
export async function enqueueOfflineAction(actionType, entityType, payload) {
  return await db.offlineQueue.add({
    actionType,
    entityType,
    payload,
    createdAt: new Date().toISOString()
  })
}

/**
 * Retrieves all pending offline mutation actions in chronological order.
 */
export async function getPendingOfflineActions() {
  return await db.offlineQueue.orderBy('id').toArray()
}

/**
 * Removes a synced action from the queue by ID.
 */
export async function removeOfflineAction(id) {
  return await db.offlineQueue.delete(id)
}
