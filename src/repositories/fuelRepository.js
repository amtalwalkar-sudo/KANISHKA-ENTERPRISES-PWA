import { initializeCanonicalStorage } from '../utils/indexedDB'
import { generateUUID } from '../utils/uuid'
import { buildMutationRecord } from './mutationRepository'

export const FuelRepository = {
  async create(fuelData) {
    const db = await initializeCanonicalStorage()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['fuel_logs', 'pending_mutations'], 'readwrite')
      const fuelStore = tx.objectStore('fuel_logs')
      const mutationStore = tx.objectStore('pending_mutations')
      const now = new Date().toISOString()
      const fuelRecord = {
        id: fuelData.id || generateUUID(),
        odometer: Number(fuelData.odometer) || 0,
        pricePerKg: Number(fuelData.pricePerKg) || 0,
        amount: Number(fuelData.amount) || 0,
        kg: Number(fuelData.kg) || 0,
        createdAt: fuelData.createdAt || now,
        updatedAt: now
      }
      const mutationRecord = buildMutationRecord({ entityId: fuelRecord.id, entityType: 'FUEL', action: 'CREATE', payload: fuelRecord, createdAt: now })
      try {
        fuelStore.put(fuelRecord)
        mutationStore.put(mutationRecord)
      } catch (error) {
        reject(error)
        return
      }
      tx.oncomplete = () => resolve(fuelRecord)
      tx.onerror = () => reject(tx.error || new Error('Atomic fuel log persistence failed.'))
      tx.onabort = () => reject(tx.error || new Error('Fuel log transaction aborted.'))
    })
  },

  async getAll() {
    const db = await initializeCanonicalStorage()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('fuel_logs', 'readonly')
      const req = tx.objectStore('fuel_logs').getAll()
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => reject(req.error || new Error('Failed to read fuel logs.'))
    })
  }
}
