import { MutationRepository } from '../../repositories/mutationRepository.js'

export const StartupService = Object.freeze({
  async recoverPendingMutations() {
    return MutationRepository.recoverStaleSyncing()
  },
})
