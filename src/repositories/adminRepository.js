import { initializeCanonicalStorage, openCanonicalDB } from '../utils/indexedDB.js'
import { generateUUID } from '../utils/uuid.js'

const STORE = 'admin_records'

async function db() {
  await initializeCanonicalStorage()
  return openCanonicalDB()
}

export const AdminRepository = {
  async list(formKey) {
    const database = await db()
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE, 'readonly')
      const request = tx.objectStore(STORE).index('formKey').getAll(formKey)
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error || new Error('Failed to read Admin records.'))
    })
  },

  async get(formKey, id) {
    const database = await db()
    return new Promise((resolve, reject) => {
      const request = database.transaction(STORE, 'readonly').objectStore(STORE).get(`${formKey}:${id}`)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error || new Error('Failed to read Admin record.'))
    })
  },

  async save(formKey, values, existingId = null) {
    const database = await db()
    const now = new Date().toISOString()
    const record = {
      id: existingId || generateUUID(),
      recordKey: `${formKey}:${existingId || generateUUID()}`,
      formKey,
      values: structuredClone(values),
      createdAt: now,
      updatedAt: now,
    }
    if (existingId) {
      const existing = await this.get(formKey, existingId)
      record.recordKey = `${formKey}:${existingId}`
      record.createdAt = existing?.createdAt || now
    }
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(record)
      tx.oncomplete = () => resolve(record)
      tx.onerror = () => reject(tx.error || new Error('Admin record save failed.'))
      tx.onabort = () => reject(tx.error || new Error('Admin record save aborted.'))
    })
  },

  async remove(formKey, id) {
    const database = await db()
    return new Promise((resolve, reject) => {
      const tx = database.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(`${formKey}:${id}`)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => reject(tx.error || new Error('Admin record delete failed.'))
      tx.onabort = () => reject(tx.error || new Error('Admin record delete aborted.'))
    })
  },
}
