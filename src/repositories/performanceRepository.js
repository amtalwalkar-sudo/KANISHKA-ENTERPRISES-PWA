import { initializeCanonicalStorage } from '../utils/indexedDB.js'

const readAll = async storeName => {
  const db = await initializeCanonicalStorage()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const request = tx.objectStore(storeName).getAll()
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error || new Error(`${storeName} query failed.`))
  })
}

export const PerformanceRepository = {
  async getSnapshot() {
    const [shifts, trips, fuelLogs] = await Promise.all([
      readAll('shifts'),
      readAll('trips'),
      readAll('fuel_logs')
    ])
    return { shifts, trips, fuelLogs }
  }
}
