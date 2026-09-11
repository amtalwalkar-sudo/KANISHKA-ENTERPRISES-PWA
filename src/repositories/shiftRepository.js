import { initializeCanonicalStorage } from '../utils/indexedDB'
import { generateUUID } from '../utils/uuid'
import { buildMutationRecord } from './mutationRepository'

export const ShiftRepository = {
  async create(shiftData) {
    const db = await initializeCanonicalStorage()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['shifts', 'pending_mutations'], 'readwrite')
      const shiftStore = tx.objectStore('shifts')
      const mutationStore = tx.objectStore('pending_mutations')
      const now = new Date().toISOString()
      const shiftRecord = {
        id: shiftData.id || generateUUID(),
        startOdometer: Number(shiftData.startOdometer) || 0,
        endOdometer: Number(shiftData.endOdometer) || 0,
        totalDistance: Number(shiftData.totalDistance) || 0,
        revenue: Number(shiftData.revenue) || 0,
        shiftStartAt: shiftData.shiftStartAt || now,
        shiftEndAt: shiftData.shiftEndAt || now,
        createdAt: shiftData.createdAt || now,
        updatedAt: now
      }
      const mutationRecord = buildMutationRecord({ entityId: shiftRecord.id, entityType: 'SHIFT', action: 'CREATE', payload: shiftRecord, createdAt: now })
      try {
        shiftStore.put(shiftRecord)
        mutationStore.put(mutationRecord)
      } catch (error) {
        reject(error)
        return
      }
      tx.oncomplete = () => resolve(shiftRecord)
      tx.onerror = () => reject(tx.error || new Error('Atomic shift persistence failed.'))
      tx.onabort = () => reject(tx.error || new Error('Shift transaction aborted.'))
    })
  },

  async getAll() {
    const db = await initializeCanonicalStorage()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('shifts', 'readonly')
      const req = tx.objectStore('shifts').getAll()
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => reject(req.error || new Error('Failed to read completed shifts.'))
    })
  },

  async getLatestOdometer() {
    const shifts = await this.getAll()
    if (!shifts.length) return 0
    const sorted = [...shifts].sort((a, b) => new Date(b.shiftEndAt || b.createdAt).getTime() - new Date(a.shiftEndAt || a.createdAt).getTime())
    return Number(sorted[0].endOdometer) || 0
  }
}
