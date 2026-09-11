import { initializeCanonicalStorage } from '../utils/indexedDB'
import { generateUUID } from '../utils/uuid'

export const OdoGapRepository = {
  /**
   * Logs an odometer gap detected between shifts or fuel entries.
   * Resolves only after the IndexedDB transaction completes.
   */
  async create(gapData) {
    const db = await initializeCanonicalStorage()

    return new Promise((resolve, reject) => {
      const tx = db.transaction('odoGaps', 'readwrite')
      const store = tx.objectStore('odoGaps')
      const now = new Date().toISOString()

      const record = {
        id: gapData.id || generateUUID(),
        previousOdometer: Number(gapData.previousOdometer) || 0,
        newOdometer: Number(gapData.newOdometer) || 0,
        gapDistance: Number(gapData.gapDistance) || 0,
        reason: gapData.reason || 'UNEXPLAINED_DISCREPANCY',
        createdAt: gapData.createdAt || now
      }

      try {
        store.put(record)
      } catch (error) {
        reject(error)
        return
      }

      tx.oncomplete = () => resolve(record)
      tx.onerror = () => reject(tx.error || new Error('Odometer gap persistence failed.'))
      tx.onabort = () => reject(tx.error || new Error('Odometer gap transaction aborted.'))
    })
  },

  /**
   * Retrieves all logged odometer gaps.
   */
  async getAll() {
    const db = await initializeCanonicalStorage()

    return new Promise((resolve, reject) => {
      const tx = db.transaction('odoGaps', 'readonly')
      const store = tx.objectStore('odoGaps')
      const req = store.getAll()

      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => reject(req.error || new Error('Failed to read odometer gaps.'))
    })
  }
}
