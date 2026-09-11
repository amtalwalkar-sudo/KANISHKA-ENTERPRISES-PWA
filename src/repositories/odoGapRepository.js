import { initializeCanonicalStorage } from '../utils/indexedDB'
import { generateUUID } from '../utils/uuid'
import { buildMutationRecord } from './mutationRepository'

export const OdoGapRepository = {
  async create(gapData) {
    const db = await initializeCanonicalStorage()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['odoGaps', 'pending_mutations'], 'readwrite')
      const gapStore = tx.objectStore('odoGaps')
      const mutationStore = tx.objectStore('pending_mutations')
      const now = new Date().toISOString()
      const gapRecord = {
        id: gapData.id || generateUUID(),
        previousOdometer: Number(gapData.previousOdometer) || 0,
        newOdometer: Number(gapData.newOdometer) || 0,
        gapDistance: Number(gapData.gapDistance) || 0,
        reason: gapData.reason || 'UNEXPLAINED_DISCREPANCY',
        createdAt: gapData.createdAt || now
      }
      const mutationRecord = buildMutationRecord({ entityId: gapRecord.id, entityType: 'ODO_GAP', action: 'CREATE', payload: gapRecord, createdAt: now })
      try {
        gapStore.put(gapRecord)
        mutationStore.put(mutationRecord)
      } catch (error) {
        reject(error)
        return
      }
      tx.oncomplete = () => resolve(gapRecord)
      tx.onerror = () => reject(tx.error || new Error('Atomic odo gap persistence failed.'))
      tx.onabort = () => reject(tx.error || new Error('Odo gap transaction aborted.'))
    })
  },

  async getAll() {
    const db = await initializeCanonicalStorage()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('odoGaps', 'readonly')
      const req = tx.objectStore('odoGaps').getAll()
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => reject(req.error || new Error('Failed to read odometer gaps.'))
    })
  }
}
