import { initializeCanonicalStorage } from '../utils/indexedDB.js'
import { generateUUID } from '../utils/uuid.js'
import { buildMutationRecord } from './mutationRepository.js'

const FINANCIAL_KINDS = new Set(['LOAN','TARGET'])
const CORE_STORES = { SHIFT: 'shifts', TRIP: 'trips', FUEL: 'fuel_logs' }

const readAll = async storeName => {
  const db = await initializeCanonicalStorage()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const req = tx.objectStore(storeName).getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error || new Error('Admin read failed.'))
  })
}

const normalize = (kind, input) => {
  const now = new Date().toISOString()
  const record = { ...input, id: input.id || generateUUID(), updatedAt: now, createdAt: input.createdAt || now }
  if (kind === 'SHIFT') {
    record.startOdometer = Number(input.openingOdometer ?? input.startOdometer ?? 0)
    record.endOdometer = Number(input.closingOdometer ?? input.endOdometer ?? 0)
    record.totalDistance = record.endOdometer - record.startOdometer
    record.revenue = Number(input.shiftRevenue ?? input.revenue ?? 0)
    record.toll = Number(input.businessToll ?? input.toll ?? 0)
    record.parking = Number(input.businessParking ?? input.parking ?? 0)
    record.tollParkingRevenueTreatment = input.businessTollTreatment || input.businessParkingTreatment || input.tollParkingRevenueTreatment || 'NONE'
    record.shiftStartAt = input.shiftStart || input.shiftStartAt || record.createdAt
    record.shiftEndAt = input.shiftEnd || input.shiftEndAt || record.updatedAt
    record.status = input.shiftStatus || input.status || 'COMPLETED'
  }
  if (kind === 'TRIP') {
    record.shiftId = input.tripShiftReference || input.shiftId || null
    record.operator = input.tripOperator || input.operator || ''
    record.tripStartAt = input.tripStart || input.tripStartAt || record.createdAt
    record.tripEndAt = input.tripEnd || input.tripEndAt || record.updatedAt
    record.tripKm = input.tripKm === '' || input.tripKm == null ? null : Number(input.tripKm)
    record.tripKmAuthority = input.tripKmSource === 'GPS' ? 'GPS' : 'MANUAL'
    record.revenue = input.tripRevenue === '' || input.tripRevenue == null ? null : Number(input.tripRevenue)
    record.cancelledRevenue = input.tripCancellationRevenue === '' || input.tripCancellationRevenue == null ? null : Number(input.tripCancellationRevenue)
    record.cancelReason = input.tripCancellationReason || null
    record.status = input.tripStatus || input.status || 'COMPLETED'
  }
  if (kind === 'FUEL') {
    record.odometer = Number(input.fuelOdometer ?? input.odometer)
    record.pricePerKg = Number(input.fuelPricePerKg ?? input.pricePerKg)
    record.amount = Number(input.fuelAmount ?? input.amount)
    record.quantityKg = record.pricePerKg > 0 ? record.amount / record.pricePerKg : 0
    record.capturedAt = input.fuelRecordedAt || input.capturedAt || record.createdAt
  }
  if (FINANCIAL_KINDS.has(kind)) record.kind = kind
  return record
}

export const AdminRepository = {
  async list(kind) {
    if (CORE_STORES[kind]) return readAll(CORE_STORES[kind])
    if (FINANCIAL_KINDS.has(kind)) return (await readAll('financial_inputs')).filter(r => r.kind === kind)
    return (await readAll('admin_records')).filter(r => r.entityType === kind)
  },
  async save(kind, input) {
    const db = await initializeCanonicalStorage()
    const storeName = CORE_STORES[kind] || (FINANCIAL_KINDS.has(kind) ? 'financial_inputs' : 'admin_records')
    const record = normalize(kind, input)
    if (storeName === 'admin_records') record.entityType = kind
    return new Promise((resolve, reject) => {
      const tx = db.transaction([storeName, 'pending_mutations'], 'readwrite')
      tx.objectStore(storeName).put(record)
      tx.objectStore('pending_mutations').put(buildMutationRecord({ entityId: record.id, entityType: kind, action: input.id ? 'UPDATE' : 'CREATE', payload: record, createdAt: record.updatedAt }))
      tx.oncomplete = () => resolve(record)
      tx.onerror = () => reject(tx.error || new Error('Admin save failed.'))
      tx.onabort = () => reject(tx.error || new Error('Admin save aborted.'))
    })
  },
  async remove(kind, id) {
    const db = await initializeCanonicalStorage()
    const storeName = CORE_STORES[kind] || (FINANCIAL_KINDS.has(kind) ? 'financial_inputs' : 'admin_records')
    return new Promise((resolve, reject) => {
      const tx = db.transaction([storeName, 'pending_mutations'], 'readwrite')
      tx.objectStore(storeName).delete(id)
      tx.objectStore('pending_mutations').put(buildMutationRecord({ entityId: id, entityType: kind, action: 'DELETE', payload: { id }, createdAt: new Date().toISOString() }))
      tx.oncomplete = () => resolve(true)
      tx.onerror = () => reject(tx.error || new Error('Admin delete failed.'))
      tx.onabort = () => reject(tx.error || new Error('Admin delete aborted.'))
    })
  }
}
