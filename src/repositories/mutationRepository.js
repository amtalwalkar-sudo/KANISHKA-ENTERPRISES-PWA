import { initializeCanonicalStorage, openCanonicalDB } from '../utils/indexedDB'
import { generateUUID } from '../utils/uuid'

export const buildMutationRecord = ({ entityId, entityType, action, payload, createdAt }) => ({
  id: generateUUID(),
  entityId,
  entityType,
  action,
  payload,
  status: 'PENDING',
  retryCount: 0,
  createdAt: createdAt || new Date().toISOString()
})

export const MutationRepository = {
  async recoverStaleSyncing() {
    await initializeCanonicalStorage()
    const db = await openCanonicalDB()

    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_mutations', 'readwrite')
      const store = tx.objectStore('pending_mutations')
      const req = store.getAll()

      req.onsuccess = () => {
        for (const mutation of req.result || []) {
          if (mutation.status === 'SYNCING') {
            mutation.status = 'PENDING'
            store.put(mutation)
          }
        }
      }

      req.onerror = () => reject(req.error || new Error('Failed to recover stale mutations.'))
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => reject(tx.error || new Error('Mutation recovery transaction failed.'))
      tx.onabort = () => reject(tx.error || new Error('Mutation recovery transaction aborted.'))
    })
  },

  async getPending() {
    await initializeCanonicalStorage()
    const db = await openCanonicalDB()

    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_mutations', 'readonly')
      const index = tx.objectStore('pending_mutations').index('createdAt')
      const req = index.getAll()

      req.onsuccess = () => {
        const mutations = (req.result || [])
          .filter((mutation) => mutation.status === 'PENDING' || mutation.status === 'FAILED')
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
        resolve(mutations)
      }
      req.onerror = () => reject(req.error || new Error('Failed to read pending mutations.'))
    })
  },

  async updateStatus(id, status) {
    await initializeCanonicalStorage()
    const db = await openCanonicalDB()

    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_mutations', 'readwrite')
      const store = tx.objectStore('pending_mutations')
      const req = store.get(id)

      req.onsuccess = () => {
        const record = req.result
        if (!record) return

        record.status = status
        if (status === 'FAILED') record.retryCount = Number(record.retryCount) + 1 || 1
        store.put(record)
      }

      req.onerror = () => reject(req.error || new Error('Failed to read mutation state.'))
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => reject(tx.error || new Error('Mutation state transaction failed.'))
      tx.onabort = () => reject(tx.error || new Error('Mutation state transaction aborted.'))
    })
  },

  async remove(id) {
    await initializeCanonicalStorage()
    const db = await openCanonicalDB()

    return new Promise((resolve, reject) => {
      const tx = db.transaction('pending_mutations', 'readwrite')
      tx.objectStore('pending_mutations').delete(id)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => reject(tx.error || new Error('Mutation removal failed.'))
      tx.onabort = () => reject(tx.error || new Error('Mutation removal transaction aborted.'))
    })
  }
}
