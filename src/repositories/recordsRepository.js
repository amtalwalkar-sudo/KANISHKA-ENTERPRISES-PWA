import { db } from '@/db/index.js'

export const recordsRepository = {
  async save(record) {
    return await db.records.put(record)
  },
  async getAll() {
    return await db.records.toArray()
  },
  async updateStatus(entityId, status) {
    return await db.records.update(entityId, { status })
  },
  async enqueueOffline(action) {
    return await db.offlineQueue.add(action)
  },
  async getPendingQueue() {
    return await db.offlineQueue.orderBy('timestamp').toArray()
  },
  async removeOfflineAction(id) {
    return await db.offlineQueue.delete(id)
  }
}
