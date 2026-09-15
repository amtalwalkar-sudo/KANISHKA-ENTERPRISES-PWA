import { initializeCanonicalStorage } from '../utils/indexedDB.js'
import { generateUUID } from '../utils/uuid.js'
import { buildMutationRecord } from './mutationRepository.js'

const atomic = async (stores, writer) => {
  const db = await initializeCanonicalStorage()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([...stores, 'pending_mutations'], 'readwrite')
    const mutations = tx.objectStore('pending_mutations')
    try { writer(tx, mutations) } catch (error) { reject(error); return }
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error || new Error('Lifecycle persistence failed.'))
    tx.onabort = () => reject(tx.error || new Error('Lifecycle transaction aborted.'))
  })
}

const saveMutation = (store, entityId, entityType, action, payload, createdAt) => store.put(buildMutationRecord({ entityId, entityType, action, payload, createdAt }))

const readAll = async storeName => {
  const db = await initializeCanonicalStorage()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([storeName], 'readonly')
    const request = tx.objectStore(storeName).getAll()
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error || new Error(`${storeName} query failed.`))
  })
}

export const DayShiftTripRepository = {
  async createShift(data) {
    const now = new Date().toISOString()
    const record = { id: data.id || generateUUID(), startOdometer: Number(data.startOdometer), endOdometer: null, totalDistance: 0, revenue: 0, toll: 0, parking: 0, tollParkingRevenueTreatment: 'NONE', shiftStartAt: data.shiftStartAt || now, shiftEndAt: null, status: 'ACTIVE', createdAt: now, updatedAt: now }
    await atomic(['shifts'], (_, m) => { _.objectStore('shifts').put(record); saveMutation(m, record.id, 'SHIFT', 'CREATE', record, now) })
    return record
  },

  async endShift(data) {
    const db = await initializeCanonicalStorage()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['shifts', 'pending_mutations'], 'readwrite'), shifts = tx.objectStore('shifts'), mutations = tx.objectStore('pending_mutations'), request = shifts.get(data.id)
      request.onsuccess = () => { const r = request.result; if (!r) { reject(new Error('Active shift not found.')); return }; const now = new Date().toISOString(); r.endOdometer = Number(data.endOdometer); r.totalDistance = r.endOdometer - r.startOdometer; r.revenue = Number(data.revenue); r.toll = Number(data.toll || 0); r.parking = Number(data.parking || 0); r.tollParkingRevenueTreatment = data.tollParkingRevenueTreatment || 'NONE'; r.shiftEndAt = now; r.status = 'COMPLETED'; r.updatedAt = now; shifts.put(r); saveMutation(mutations, r.id, 'SHIFT', 'UPDATE', r, now) }
      request.onerror = () => reject(request.error)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => reject(tx.error || new Error('Shift end failed.'))
      tx.onabort = () => reject(tx.error || new Error('Shift end aborted.'))
    })
  },

  async createTrip(data) {
    const now = new Date().toISOString()
    const record = { id: data.id || generateUUID(), shiftId: data.shiftId, operator: data.operator, tripStartAt: data.tripStartAt || now, tripEndAt: null, status: 'ACTIVE', tripStartLocation: data.tripStartLocation || null, tripEndLocation: null, tripKm: null, tripKmAuthority: 'ESTIMATE', revenue: null, revenueAuthority: 'ESTIMATE', createdAt: now, updatedAt: now }
    await atomic(['trips'], (_, m) => { _.objectStore('trips').put(record); saveMutation(m, record.id, 'TRIP', 'CREATE', record, now) })
    return record
  },

  async completeTrip(data) { return this._finishTrip(data, 'COMPLETED') },
  async cancelTrip(id) { return this._finishTrip({ id }, 'CANCELLED') },

  async _finishTrip(data, status) {
    const db = await initializeCanonicalStorage()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['trips', 'pending_mutations'], 'readwrite'), trips = tx.objectStore('trips'), mutations = tx.objectStore('pending_mutations'), request = trips.get(data.id)
      request.onsuccess = () => { const r = request.result; if (!r) { reject(new Error('Trip not found.')); return }; const now = new Date().toISOString(); r.tripEndAt = data.tripEndAt || now; r.status = status; r.tripEndLocation = data.tripEndLocation || null; r.updatedAt = now; trips.put(r); saveMutation(mutations, r.id, 'TRIP', 'UPDATE', r, now) }
      request.onerror = () => reject(request.error)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => reject(tx.error || new Error('Trip update failed.'))
      tx.onabort = () => reject(tx.error || new Error('Trip update aborted.'))
    })
  },

  async updateTrip(data) {
    const db = await initializeCanonicalStorage()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['trips', 'pending_mutations'], 'readwrite'), trips = tx.objectStore('trips'), mutations = tx.objectStore('pending_mutations'), request = trips.get(data.id)
      request.onsuccess = () => { const r = request.result; if (!r) { reject(new Error('Trip not found.')); return }; const now = new Date().toISOString(); if (data.operator !== undefined) r.operator = data.operator; if (data.tripKm !== undefined && data.tripKm !== '') { const km = Number(data.tripKm); if (!Number.isFinite(km) || km < 0) { reject(new Error('Trip KM must be a non-negative number.')); return }; r.tripKm = km; r.tripKmAuthority = 'MANUAL' }; if (data.revenue !== undefined && data.revenue !== '') { const revenue = Number(data.revenue); if (!Number.isFinite(revenue) || revenue < 0) { reject(new Error('Trip revenue must be a non-negative number.')); return }; r.revenue = revenue; r.revenueAuthority = 'MANUAL' }; r.updatedAt = now; trips.put(r); saveMutation(mutations, r.id, 'TRIP', 'UPDATE', r, now) }
      request.onerror = () => reject(request.error)
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => reject(tx.error || new Error('Trip correction failed.'))
      tx.onabort = () => reject(tx.error || new Error('Trip correction aborted.'))
    })
  },

  async getCompletedTripsForShift(shiftId) { const trips = await readAll('trips'); return trips.filter(t => t.shiftId === shiftId && t.status === 'COMPLETED').sort((a, b) => new Date(a.tripStartAt) - new Date(b.tripStartAt)) },
  async getLastCompletedShift() { const shifts = await readAll('shifts'); return shifts.filter(s => s.status === 'COMPLETED' && Number.isFinite(Number(s.endOdometer))).sort((a, b) => new Date(b.shiftEndAt || b.updatedAt) - new Date(a.shiftEndAt || a.updatedAt))[0] || null },
  async getLastCompletedTrip() { const trips = await readAll('trips'); return trips.filter(t => t.status === 'COMPLETED' && t.operator).sort((a, b) => new Date(b.tripEndAt || b.updatedAt) - new Date(a.tripEndAt || a.updatedAt))[0] || null },
  async getActive() { const [shifts, trips] = await Promise.all([readAll('shifts'), readAll('trips')]); return { shift: shifts.find(s => s.status === 'ACTIVE') || null, trip: trips.find(t => t.status === 'ACTIVE') || null } },
  async getOpenInterShiftGap() { return null }
}
