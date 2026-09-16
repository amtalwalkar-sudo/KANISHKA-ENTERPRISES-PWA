import { initializeCanonicalStorage } from '../../utils/indexedDB.js'

export const ShellService = Object.freeze({
  async initialize() {
    await initializeCanonicalStorage()
    return { ready: true }
  },
})
