import { generateUUID } from '../utils/uuid.js'
import { initializeCanonicalStorage } from '../utils/indexedDB.js'

const readAll = async () => {
  const db = await initializeCanonicalStorage()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('financial_inputs', 'readonly')
    const request = tx.objectStore('financial_inputs').getAll()
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error || new Error('Financial inputs query failed.'))
  })
}

export const PerformanceInputsRepository = {
  async getAll() {
    return readAll()
  },
  async save(input) {
    const db = await initializeCanonicalStorage()
    const now = new Date().toISOString()
    const record = { ...input, id: input.id || generateUUID(), status: input.status || 'ACTIVE', createdAt: input.createdAt || now, updatedAt: now }
    return new Promise((resolve, reject) => {
      const tx = db.transaction('financial_inputs', 'readwrite')
      tx.objectStore('financial_inputs').put(record)
      tx.oncomplete = () => resolve(record)
      tx.onerror = () => reject(tx.error || new Error('Financial input persistence failed.'))
      tx.onabort = () => reject(tx.error || new Error('Financial input persistence aborted.'))
    })
  },
  async remove(id) {
    const db = await initializeCanonicalStorage()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('financial_inputs', 'readwrite')
      tx.objectStore('financial_inputs').delete(id)
      tx.oncomplete = resolve
      tx.onerror = () => reject(tx.error || new Error('Financial input deletion failed.'))
      tx.onabort = () => reject(tx.error || new Error('Financial input deletion aborted.'))
    })
  }
}
