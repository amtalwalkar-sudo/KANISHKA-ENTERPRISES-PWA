import { initializeCanonicalStorage } from '../utils/indexedDB.js'

const readAll = async storeName => {
  const db = await initializeCanonicalStorage()
  if (!db.objectStoreNames.contains(storeName)) return []
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const request = tx.objectStore(storeName).getAll()
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error || new Error(`${storeName} query failed.`))
  })
}

export const PerformanceRepository = {
  async getSnapshot() {
    const [shifts, trips, fuelLogs, financialInputs] = await Promise.all([
      readAll('shifts'), readAll('trips'), readAll('fuel_logs'), readAll('financial_inputs')
    ])
    return { shifts, trips, fuelLogs, financialInputs }
  }
}
