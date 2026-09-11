import { initializeCanonicalStorage } from '../utils/indexedDB.js'
import { generateUUID } from '../utils/uuid.js'
import { buildMutationRecord } from './mutationRepository.js'

const persist = async (tripData, action) => {
  const db = await initializeCanonicalStorage()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['trips','pending_mutations'], 'readwrite')
    const store = tx.objectStore('trips'); const mutations = tx.objectStore('pending_mutations')
    const now = new Date().toISOString()
    const record = { id: tripData.id || generateUUID(), dayId: tripData.dayId, shiftId: tripData.shiftId, tripStartAt: tripData.tripStartAt || null, tripEndAt: tripData.tripEndAt || null, status: tripData.status || 'COMPLETED', tripStartLocation: tripData.tripStartLocation || null, tripEndLocation: tripData.tripEndLocation || null, createdAt: tripData.createdAt || now, updatedAt: now }
    try { store.put(record); mutations.put(buildMutationRecord({ entityId: record.id, entityType:'TRIP', action, payload:record, createdAt:now })) } catch (error) { reject(error); return }
    tx.oncomplete=()=>resolve(record); tx.onerror=()=>reject(tx.error||new Error('Trip persistence failed.')); tx.onabort=()=>reject(tx.error||new Error('Trip transaction aborted.'))
  })
}

export const TripRepository = {
  create(data) { return persist(data,'CREATE') },
  async update(data) { return persist(data,'UPDATE') },
  async getActive() {
    const db=await initializeCanonicalStorage(); return new Promise((resolve,reject)=>{const tx=db.transaction('trips','readonly');const req=tx.objectStore('trips').getAll();req.onsuccess=()=>resolve((req.result||[]).find(t=>t.status==='ACTIVE')||null);req.onerror=()=>reject(req.error||new Error('Failed to read active trip.'))})
  },
  async getAll() {
    const db=await initializeCanonicalStorage(); return new Promise((resolve,reject)=>{const tx=db.transaction('trips','readonly');const req=tx.objectStore('trips').getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error||new Error('Failed to read trips.'))})
  }
}
