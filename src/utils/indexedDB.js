const DB_NAME = 'kanishka_pwa_db'
const DB_VERSION = 1

export const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('fuel_logs')) db.createObjectStore('fuel_logs', { keyPath: 'id', autoIncrement: true })
      if (!db.objectStoreNames.contains('shifts')) db.createObjectStore('shifts', { keyPath: 'id', autoIncrement: true })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const safeDBExecute = async (operation) => {
  try {
    return await operation()
  } catch (err) {
    console.error('IndexedDB Operation Failed:', err)
    return null
  }
}

export const saveFuelLog = async (data) => {
  return await safeDBExecute(async () => {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('fuel_logs', 'readwrite')
      const store = tx.objectStore('fuel_logs')
      const req = store.add({ ...data, timestamp: new Date().toISOString() })
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  })
}

export const saveCompletedShift = async (data) => {
  return await safeDBExecute(async () => {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('shifts', 'readwrite')
      const store = tx.objectStore('shifts')
      
      // EXPLICIT PAYLOAD FORMATTING
      const payload = {
        startOdometer: Number(data.startOdometer) || 0,
        endOdometer: Number(data.endOdometer) || 0,
        totalDistance: Number(data.totalDistance) || 0,
        revenue: Number(data.revenue) || 0,
        timestamp: new Date().toISOString()
      }

      console.log('Saving Shift Payload to IndexedDB:', payload)
      const req = store.add(payload)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  })
}

export const getAllCompletedShifts = async () => {
  return (await safeDBExecute(async () => {
    const db = await openDB()
    return new Promise((resolve) => {
      const tx = db.transaction('shifts', 'readonly')
      const store = tx.objectStore('shifts')
      const req = store.getAll()
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => resolve([])
    })
  })) || []
}

export const getLastEndOdometer = async () => {
  const shifts = await getAllCompletedShifts()
  if (!shifts || shifts.length === 0) return 0
  const sorted = [...shifts].sort((a, b) => (b.id || 0) - (a.id || 0))
  return Number(sorted[0].endOdometer) || 0
}
