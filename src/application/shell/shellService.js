import { initializeCanonicalStorage } from '../../utils/indexedDB.js'
import { useShiftTripStore } from '../../stores/shiftTrip.js'

export const ShellService = Object.freeze({
  async initialize() {
    await initializeCanonicalStorage()
    const store = useShiftTripStore()
    await store.initialize()
    return { ready: true }
  },
})
