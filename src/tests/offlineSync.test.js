import { buildMutationRecord } from '../repositories/mutationRepository'
import { SyncService } from '../services/syncService'

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

async function runContractTests() {
  console.log('--- Running Phase 5 Offline Sync Contract Tests ---')

  const mutation = buildMutationRecord({
    entityId: 'entity-1',
    entityType: 'SHIFT',
    action: 'CREATE',
    payload: { id: 'entity-1', revenue: 1000 },
    createdAt: '2026-09-12T10:00:00.000Z'
  })
  assert(mutation.id && mutation.id !== mutation.entityId, 'Dual-ID contract failed')
  assert(mutation.entityId === 'entity-1' && mutation.status === 'PENDING', 'Mutation envelope contract failed')

  const second = { ...buildMutationRecord({ entityId: 'entity-2', entityType: 'FUEL', action: 'CREATE', payload: { id: 'entity-2' }, createdAt: '2026-09-12T10:00:01.000Z' }) }
  const ordered = [second, mutation].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
  assert(ordered[0].id === mutation.id, 'Chronological ordering contract failed')

  const calls = []
  const originalOnline = Object.getOwnPropertyDescriptor(Navigator.prototype, 'onLine')
  Object.defineProperty(Navigator.prototype, 'onLine', { configurable: true, get: () => true })
  const originalRepo = {
    recoverStaleSyncing: SyncService.__repo?.recoverStaleSyncing,
    getPending: SyncService.__repo?.getPending,
    updateStatus: SyncService.__repo?.updateStatus,
    remove: SyncService.__repo?.remove
  }

  // Contract-level dependency injection without changing production architecture.
  const repo = await import('../repositories/mutationRepository')
  const originals = { ...repo.MutationRepository }
  repo.MutationRepository.recoverStaleSyncing = async () => {}
  repo.MutationRepository.getPending = async () => [mutation, second]
  repo.MutationRepository.updateStatus = async (id, status) => calls.push(['status', id, status])
  repo.MutationRepository.remove = async (id) => calls.push(['remove', id])

  const apiClient = {
    post: async (_path, envelope) => {
      calls.push(['post', envelope.mutationId])
      if (envelope.mutationId === mutation.id) throw new Error('simulated network failure')
    }
  }

  const result = await SyncService.processQueue(apiClient)
  assert(result.status === 'PARTIAL_FAILURE' && result.processedCount === 0 && result.failureCount === 1, 'Halt-on-first-failure contract failed')
  assert(calls.some((entry) => entry[0] === 'post' && entry[1] === mutation.id), 'First mutation was not attempted')
  assert(!calls.some((entry) => entry[0] === 'post' && entry[1] === second.id), 'Queue continued after failure')
  assert(calls.some((entry) => entry[0] === 'status' && entry[1] === mutation.id && entry[2] === 'FAILED'), 'FAILED state was not recorded')

  Object.assign(repo.MutationRepository, originals)
  if (originalOnline) Object.defineProperty(Navigator.prototype, 'onLine', originalOnline)

  console.log('✅ Phase 5 Offline Sync Contract Tests Passed Successfully!')
}

runContractTests().catch((error) => {
  console.error('❌ Phase 5 Offline Sync Contract Tests Failed:', error)
  process.exitCode = 1
})
