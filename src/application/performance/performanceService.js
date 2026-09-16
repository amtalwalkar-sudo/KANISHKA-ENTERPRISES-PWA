import { PerformanceRepository } from '../../repositories/performanceRepository.js'

export const PerformanceService = Object.freeze({
  async getSnapshot() {
    return PerformanceRepository.getSnapshot()
  },
})
