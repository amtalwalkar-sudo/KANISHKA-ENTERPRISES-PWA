import {
  initializeCanonicalStorage,
  saveFuelLog,
  getAllFuelLogs
} from '../utils/indexedDB'

export const FuelRepository = {
  /**
   * Saves a fuel log to canonical storage.
   * Resolves only after the IndexedDB transaction completes.
   */
  async create(fuelData) {
    await initializeCanonicalStorage()
    return saveFuelLog(fuelData)
  },

  /**
   * Fetches all fuel log entries from canonical storage.
   */
  async getAll() {
    await initializeCanonicalStorage()
    return getAllFuelLogs()
  }
}
