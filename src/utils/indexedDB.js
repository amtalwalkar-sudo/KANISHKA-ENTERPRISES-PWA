import { generateUUID } from './uuid'

const OLD_DB_NAME = 'kanishka_pwa_db'
const CANONICAL_DB_NAME = 'kanishka_kfe_canonical_db'
const CANONICAL_DB_VERSION = 2
const LEGACY_SOURCE = OLD_DB_NAME

let dbInstance = null
let initializationPromise = null
let isInitialized = false

export const openCanonicalDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance)

    const request = indexedDB.open(CANONICAL_DB_NAME, CANONICAL_DB_VERSION)

    request.onupgradeneeded = (e) => {
      const db = e.target.result

      if (!db.objectStoreNames.contains('shifts')) {
        const shiftStore = db.createObjectStore('shifts', { keyPath: 'id' })
        shiftStore.createIndex('shiftEndAt', 'shiftEndAt', { unique: false })
        shiftStore.createIndex('legacyId', 'legacyId', { unique: false })
      }

      if (!db.objectStoreNames.contains('fuel_logs')) {
        const fuelStore = db.createObjectStore('fuel_logs', { keyPath: 'id' })
        fuelStore.createIndex('createdAt', 'createdAt', { unique: false })
        fuelStore.createIndex('legacyId', 'legacyId', { unique: false })
      }

      if (!db.objectStoreNames.contains('odoGaps')) {
        db.createObjectStore('odoGaps', { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains('pending_mutations')) {
        const mutationStore = db.createObjectStore('pending_mutations', { keyPath: 'id' })
        mutationStore.createIndex('createdAt', 'createdAt', { unique: false })
        mutationStore.createIndex('status', 'status', { unique: false })
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
}

export const initializeCanonicalStorage = async () => {
  if (isInitialized && dbInstance) return dbInstance
  if (initializationPromise) return initializationPromise

  initializationPromise = (async () => {
    const db = await openCanonicalDB()
    await migrateLegacyDataStrict(db)
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

const readLegacyData = (oldDb) => {
  const hasShifts = oldDb.objectStoreNames.contains('shifts')
  const hasFuel = oldDb.objectStoreNames.contains('fuel_logs')

  if (!hasShifts && !hasFuel) {
    oldDb.close()
    return Promise.resolve({ shifts: [], fuelLogs: [] })
  }

  return new Promise((resolve, reject) => {
    const stores = [hasShifts ? 'shifts' : null, hasFuel ? 'fuel_logs' : null].filter(Boolean)
    const tx = oldDb.transaction(stores, 'readonly')
    let shifts = []
    let fuelLogs = []
    let settled = false

    const fail = (error) => {
      if (settled) return
      settled = true
      oldDb.close()
      reject(error || new Error('Legacy database read failed.'))
    }

    tx.onabort = () => fail(tx.error || new Error('Legacy database read transaction aborted.'))
    tx.onerror = () => fail(tx.error || new Error('Legacy database read transaction failed.'))
    tx.oncomplete = () => {
      if (settled) return
      settled = true
      oldDb.close()
      resolve({ shifts, fuelLogs })
    }

    if (hasShifts) {
      const req = tx.objectStore('shifts').getAll()
      req.onsuccess = () => { shifts = req.result || [] }
      req.onerror = () => fail(req.error || new Error('Legacy shifts read failed.'))
    }

    if (hasFuel) {
      const req = tx.objectStore('fuel_logs').getAll()
      req.onsuccess = () => { fuelLogs = req.result || [] }
      req.onerror = () => fail(req.error || new Error('Legacy fuel log read failed.'))
    }
  })
}

const migrateLegacyDataStrict = async (canonicalDb) => {
  let legacyDBExists = true

  if (typeof indexedDB.databases === 'function') {
    const databases = await indexedDB.databases()
    legacyDBExists = databases.some((database) => database.name === OLD_DB_NAME)
  }

  if (!legacyDBExists) return

  const oldDb = await new Promise((resolve, reject) => {
    const req = indexedDB.open(OLD_DB_NAME)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error('Legacy database could not be opened.'))
  })

  const { shifts: oldShifts, fuelLogs: oldFuelLogs } = await readLegacyData(oldDb)

  if (oldShifts.length === 0 && oldFuelLogs.length === 0) return

  await new Promise((resolve, reject) => {
    const tx = canonicalDb.transaction(['shifts', 'fuel_logs'], 'readwrite')
    const shiftStore = tx.objectStore('shifts')
    const fuelStore = tx.objectStore('fuel_logs')

    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error || new Error('Migration transaction failed.'))
    tx.onabort = () => reject(tx.error || new Error('Migration transaction aborted.'))

    const shiftIndexReq = shiftStore.getAll()
    const fuelIndexReq = fuelStore.getAll()

    shiftIndexReq.onerror = () => reject(shiftIndexReq.error || new Error('Canonical shift migration check failed.'))
    fuelIndexReq.onerror = () => reject(fuelIndexReq.error || new Error('Canonical fuel migration check failed.'))

    let processed = 0
    const processIfReady = () => {
      processed += 1
      if (processed !== 2) return

      const existingShifts = shiftIndexReq.result || []
      const existingFuelLogs = fuelIndexReq.result || []
      const existingLegacyShiftIds = new Set(
        existingShifts
          .filter((record) => record.legacySource === LEGACY_SOURCE && record.legacyId !== null && record.legacyId !== undefined)
          .map((record) => String(record.legacyId))
      )
      const existingLegacyFuelIds = new Set(
        existingFuelLogs
          .filter((record) => record.legacySource === LEGACY_SOURCE && record.legacyId !== null && record.legacyId !== undefined)
          .map((record) => String(record.legacyId))
      )

      const now = new Date().toISOString()

      for (const legacyShift of oldShifts) {
        if (legacyShift.id !== undefined && legacyShift.id !== null && existingLegacyShiftIds.has(String(legacyShift.id))) continue

        const timestamp = legacyShift.timestamp || legacyShift.shiftEndAt || now
        shiftStore.put({
          id: generateUUID(),
          legacyId: legacyShift.id ?? null,
          legacySource: LEGACY_SOURCE,
          startOdometer: Number(legacyShift.startOdometer) || 0,
          endOdometer: Number(legacyShift.endOdometer) || 0,
          totalDistance: Number(legacyShift.totalDistance) || 0,
          revenue: Number(legacyShift.revenue) || 0,
          shiftStartAt: legacyShift.shiftStartAt || timestamp,
          shiftEndAt: legacyShift.shiftEndAt || timestamp,
          createdAt: legacyShift.createdAt || timestamp,
          updatedAt: now
        })
      }

      for (const legacyFuel of oldFuelLogs) {
        if (legacyFuel.id !== undefined && legacyFuel.id !== null && existingLegacyFuelIds.has(String(legacyFuel.id))) continue

        const timestamp = legacyFuel.timestamp || legacyFuel.createdAt || now
        fuelStore.put({
          id: generateUUID(),
          legacyId: legacyFuel.id ?? null,
          legacySource: LEGACY_SOURCE,
          odometer: Number(legacyFuel.odometer) || 0,
          pricePerKg: Number(legacyFuel.pricePerKg) || 0,
          amount: Number(legacyFuel.amount) || 0,
          kg: Number(legacyFuel.kg) || 0,
          createdAt: timestamp,
          updatedAt: now
        })
      }
    }

    shiftIndexReq.onsuccess = processIfReady
    fuelIndexReq.onsuccess = processIfReady
  })
}

export const saveCompletedShift = async (data) => {
  const db = await initializeCanonicalStorage()
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

    try {
      store.put(record)
    } catch (error) {
      reject(error)
      return
    }

    tx.oncomplete = () => resolve(record)
    tx.onerror = () => reject(tx.error || new Error('Shift persistence failed.'))
    tx.onabort = () => reject(tx.error || new Error('Shift persistence transaction aborted.'))
  })
}

export const getAllCompletedShifts = async () => {
  const db = await initializeCanonicalStorage()
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

  const sorted = [...shifts].sort((a, b) => {
    const timeA = new Date(a.shiftEndAt || a.createdAt).getTime()
    const timeB = new Date(b.shiftEndAt || b.createdAt).getTime()
    return timeB - timeA
  })

  return Number(sorted[0].endOdometer) || 0
}

export const saveFuelLog = async (data) => {
  const db = await initializeCanonicalStorage()
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

    try {
      store.put(record)
    } catch (error) {
      reject(error)
      return
    }

    tx.oncomplete = () => resolve(record)
    tx.onerror = () => reject(tx.error || new Error('Fuel log persistence failed.'))
    tx.onabort = () => reject(tx.error || new Error('Fuel log persistence transaction aborted.'))
  })
}

export const getAllFuelLogs = async () => {
  const db = await initializeCanonicalStorage()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('fuel_logs', 'readonly')
    const req = tx.objectStore('fuel_logs').getAll()
    req.onsuccess = () => resolve(req.result || [])
    req.onerror = () => reject(req.error || new Error('Failed to read fuel logs.'))
  })
}
