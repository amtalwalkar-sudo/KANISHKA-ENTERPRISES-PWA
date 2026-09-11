import { initializeCanonicalStorage, openCanonicalDB } from '../utils/indexedDB.js'
import { generateUUID } from '../utils/uuid.js'
import { buildMutationRecord } from './mutationRepository.js'

export const DayRepository = {
  async create(dayData) {
    const db = await initializeCanonicalStorage()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['days', 'pending_mutations'], 'readwrite')
      const store = tx.objectStore('days')
      const mutations = tx.objectStore('pending_mutations')
      const now = new Date().toISOString()
      const record = { id: dayData.id || generateUUID(), dayStartAt: dayData.dayStartAt || now, dayEndAt: dayData.dayEndAt || null, status: dayData.status || 'ACTIVE', hasCompletedBusinessTrip: Boolean(dayData.hasCompletedBusinessTrip), createdAt: dayData.createdAt || now, updatedAt: now }
      try { store.put(record); mutations.put(buildMutationRecord({ entityId: record.id, entityType: 'DAY', action: 'CREATE', payload: record, createdAt: now })) } catch (error) { reject(error); return }
      tx.oncomplete = () => resolve(record)
      tx.onerror = () => reject(tx.error || new Error('Day persistence failed.'))
      tx.onabort = () => reject(tx.error || new Error('Day transaction aborted.'))
    })
  },
  async end(id, dayEndAt) {
    const db = await initializeCanonicalStorage()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['days', 'pending_mutations'], 'readwrite')
      const store = tx.objectStore('days'); const mutations = tx.objectStore('pending_mutations')
      const req = store.get(id)
      req.onsuccess = () => { const record = req.result; if (!record) { reject(new Error('Active day not found.')); return }; record.dayEndAt = dayEndAt || new Date().toISOString(); record.status = 'COMPLETED'; record.updatedAt = new Date().toISOString(); store.put(record); mutations.put(buildMutationRecord({ entityId: record.id, entityType: 'DAY', action: 'UPDATE', payload: record, createdAt: record.updatedAt })) }
      req.onerror = () => reject(req.error || new Error('Failed to read day.'))
      tx.oncomplete = () => resolve(true); tx.onerror = () => reject(tx.error || new Error('Day end transaction failed.')); tx.onabort = () => reject(tx.error || new Error('Day end transaction aborted.'))
    })
  },
  async getActive() {
    const db = await initializeCanonicalStorage()
    return new Promise((resolve, reject) => { const tx = db.transaction('days','readonly'); const req = tx.objectStore('days').getAll(); req.onsuccess=()=>resolve((req.result||[]).find(d=>d.status==='ACTIVE')||null); req.onerror=()=>reject(req.error||new Error('Failed to read active day.')) })
  }
}
