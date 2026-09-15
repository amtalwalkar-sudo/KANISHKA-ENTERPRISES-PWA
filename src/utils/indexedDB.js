import { generateUUID } from './uuid.js'

const CANONICAL_DB_NAME = 'kanishka_kfe_canonical_db'
const CANONICAL_DB_VERSION = 6

let dbInstance = null
let initializationPromise = null
let isInitialized = false

export const openCanonicalDB = () => new Promise((resolve, reject) => {
  if (dbInstance) return resolve(dbInstance)
  const request = indexedDB.open(CANONICAL_DB_NAME, CANONICAL_DB_VERSION)
  request.onupgradeneeded = (e) => {
    const db = e.target.result
    const tx = e.target.transaction

    if (!db.objectStoreNames.contains('shifts')) {
      const store = db.createObjectStore('shifts', { keyPath: 'id' })
      store.createIndex('shiftEndAt', 'shiftEndAt', { unique: false })
    } else {
      const store = tx.objectStore('shifts')
      if (store.indexNames.contains('legacyId')) store.deleteIndex('legacyId')
    }

    if (!db.objectStoreNames.contains('fuel_logs')) {
      const store = db.createObjectStore('fuel_logs', { keyPath: 'id' })
      store.createIndex('createdAt', 'createdAt', { unique: false })
    } else {
      const store = tx.objectStore('fuel_logs')
      if (store.indexNames.contains('legacyId')) store.deleteIndex('legacyId')
    }

    if (!db.objectStoreNames.contains('odoGaps')) db.createObjectStore('odoGaps', { keyPath: 'id' })
    if (!db.objectStoreNames.contains('pending_mutations')) {
      const store = db.createObjectStore('pending_mutations', { keyPath: 'id' })
      store.createIndex('createdAt', 'createdAt', { unique: false })
      store.createIndex('status', 'status', { unique: false })
    }
    if (!db.objectStoreNames.contains('days')) {
      const store = db.createObjectStore('days', { keyPath: 'id' })
      store.createIndex('status', 'status', { unique: false })
      store.createIndex('dayStartAt', 'dayStartAt', { unique: false })
    }
    if (!db.objectStoreNames.contains('trips')) {
      const store = db.createObjectStore('trips', { keyPath: 'id' })
      store.createIndex('dayId', 'dayId', { unique: false })
      store.createIndex('shiftId', 'shiftId', { unique: false })
      store.createIndex('status', 'status', { unique: false })
      store.createIndex('tripStartAt', 'tripStartAt', { unique: false })
    }
    if (!db.objectStoreNames.contains('gps_snapshots')) {
      const store = db.createObjectStore('gps_snapshots', { keyPath: 'id' })
      store.createIndex('entityType', 'entityType', { unique: false })
      store.createIndex('entityId', 'entityId', { unique: false })
      store.createIndex('capturedAt', 'capturedAt', { unique: false })
    }
    if (!db.objectStoreNames.contains('movement_artifacts')) {
      const store = db.createObjectStore('movement_artifacts', { keyPath: 'id' })
      store.createIndex('shiftId', 'shiftId', { unique: false })
      store.createIndex('generatedAt', 'generatedAt', { unique: false })
    }
    if (!db.objectStoreNames.contains('financial_inputs')) {
      const store = db.createObjectStore('financial_inputs', { keyPath: 'id' })
      store.createIndex('kind', 'kind', { unique: false })
      store.createIndex('status', 'status', { unique: false })
      store.createIndex('effectiveFrom', 'effectiveFrom', { unique: false })
      store.createIndex('effectiveTo', 'effectiveTo', { unique: false })
    }
  }
  request.onsuccess = () => {
    dbInstance = request.result
    dbInstance.onversionchange = () => {
      dbInstance.close()
      dbInstance = null
      isInitialized = false
      initializationPromise = null
    }
    resolve(dbInstance)
  }
  request.onerror = () => reject(request.error || new Error('Canonical database could not be opened.'))
})

export const initializeCanonicalStorage = async () => {
  if (isInitialized && dbInstance) return dbInstance
  if (initializationPromise) return initializationPromise
  initializationPromise = (async () => {
    const db = await openCanonicalDB()
    isInitialized = true
    return db
  })()
  try {
    return await initializationPromise
  } catch (error) {
    isInitialized = false
    throw error
  } finally {
    initializationPromise = null
  }
}

export const saveCompletedShift = async (data) => {
  const db = await openCanonicalDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('shifts', 'readwrite')
    const store = tx.objectStore('shifts')
    const now = new Date().toISOString()
    const record = {
      id: data.id || generateUUID(),
      startOdometer: Number(data.startOdometer) || 0,
      endOdometer: Number(data.endOdometer) || 0,
      totalDistance: Number(data.totalDistance) || 0,
      revenue: Number(data.revenue) || 0,
      shiftStartAt: data.shiftStartAt || now,
      shiftEndAt: data.shiftEndAt || now,
      createdAt: data.createdAt || now,
      updatedAt: now
    }
    try { store.put(record) } catch (error) { reject(error); return }
    tx.oncomplete = () => resolve(record)
    tx.onerror = () => reject(tx.error || new Error('Shift persistence failed.'))
    tx.onabort = () => reject(tx.error || new Error('Shift persistence aborted.'))
  })
}

export const getAllCompletedShifts = async () => {
  const db = await openCanonicalDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('shifts', 'readonly')
    const req = tx.objectStore('shifts').getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error || new Error('Failed to read completed shifts.'))
  })
}

export const getLastOdometer = async () => {
  const shifts = await getAllCompletedShifts()
  if (!shifts.length) return 0
  const sorted = [...shifts].sort((a, b) => new Date(b.shiftEndAt || b.createdAt).getTime() - new Date(a.shiftEndAt || a.createdAt).getTime())
  return Number(sorted[0].endOdometer) || 0
}

export const saveFuelLog = async (data) => {
  const db = await openCanonicalDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('fuel_logs', 'readwrite')
    const store = tx.objectStore('fuel_logs')
    const now = new Date().toISOString()
    const record = {
      id: data.id || generateUUID(),
      odometer: Number(data.odometer) || 0,
      pricePerKg: Number(data.pricePerKg) || 0,
      amount: Number(data.amount) || 0,
      kg: Number(data.kg) || 0,
      createdAt: data.createdAt || now,
      updatedAt: now
    }
    try { store.put(record) } catch (error) { reject(error); return }
    tx.oncomplete = () => resolve(record)
    tx.onerror = () => reject(tx.error || new Error('Fuel log persistence failed.'))
    tx.onabort = () => reject(tx.error || new Error('Fuel log persistence aborted.'))
  })
}

export const getAllFuelLogs = async () => {
  const db = await openCanonicalDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('fuel_logs', 'readonly')
    const req = tx.objectStore('fuel_logs').getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error || new Error('Failed to read fuel logs.'))
  })
}
