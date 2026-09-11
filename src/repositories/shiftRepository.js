import {
  initializeCanonicalStorage,
  saveCompletedShift,
  getAllCompletedShifts,
  getLastOdometer
} from '../utils/indexedDB'

export const ShiftRepository = {
  /**
   * Saves a completed shift to canonical storage.
   * Resolves only after the IndexedDB transaction completes.
   */
  async create(shiftData) {
    await initializeCanonicalStorage()
    return saveCompletedShift(shiftData)
  },

  /**
   * Fetches all completed shifts from canonical storage.
   */
  async getAll() {
    await initializeCanonicalStorage()
    return getAllCompletedShifts()
  },

  /**
   * Fetches the latest business-time-ordered end odometer.
   */
  async getLatestOdometer() {
    await initializeCanonicalStorage()
    return getLastOdometer()
  }
}
