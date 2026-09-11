import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildMutationRecord } from '../repositories/mutationRepository.js'
import { SyncService } from '../services/syncService.js'

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcRoot = path.resolve(__dirname, '..')

async function runContractTests() {
  console.log('--- Running Phase 5 Offline Sync Contract Tests ---')

  const repositoryContracts = [
    ['shiftRepository.js', "['shifts', 'pending_mutations']", 'shiftStore.put(shiftRecord)', 'mutationStore.put(mutationRecord)'],
    ['fuelRepository.js', "['fuel_logs', 'pending_mutations']", 'fuelStore.put(fuelRecord)', 'mutationStore.put(mutationRecord)'],
    ['odoGapRepository.js', "['odoGaps', 'pending_mutations']", 'gapStore.put(gapRecord)', 'mutationStore.put(mutationRecord)']
  ]
  for (const [file, stores, entityPut, mutationPut] of repositoryContracts) {
    const source = fs.readFileSync(path.join(srcRoot, 'repositories', file), 'utf8')
    assert(source.includes(`db.transaction(${stores}, 'readwrite')`), `${file}: atomic multi-store transaction missing`)
    assert(source.includes(entityPut), `${file}: entity put missing`)
    assert(source.includes(mutationPut), `${file}: mutation put missing`)
    assert(source.includes('tx.oncomplete'), `${file}: commit completion handling missing`)
  }

  const dbSource = fs.readFileSync(path.join(srcRoot, 'utils', 'indexedDB.js'), 'utf8')
  assert(dbSource.includes('CANONICAL_DB_VERSION = 2'), 'Canonical DB was not upgraded to v2')
  assert(dbSource.includes("createObjectStore('pending_mutations'"), 'pending_mutations store missing')
  assert(dbSource.includes("createIndex('createdAt', 'createdAt'"), 'createdAt index missing')
  assert(dbSource.includes("createIndex('status', 'status'"), 'status index missing')

  const mutation = buildMutationRecord({
    entityId: 'entity-1',
    entityType: 'SHIFT',
    action: 'CREATE',
    payload: { id: 'entity-1', revenue: 1000 },
    createdAt: '2026-09-12T10:00:00.000Z'
  })
  assert(mutation.id && mutation.id !== mutation.entityId, 'Dual-ID contract failed')
  assert(mutation.entityId === 'entity-1' && mutation.status === 'PENDING', 'Mutation envelope contract failed')

  const second = buildMutationRecord({
    entityId: 'entity-2',
    entityType: 'FUEL',
    action: 'CREATE',
    payload: { id: 'entity-2' },
    createdAt: '2026-09-12T10:00:01.000Z'
  })
  const ordered = [second, mutation].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))
  assert(ordered[0].id === mutation.id, 'Chronological ordering contract failed')

  const syncSource = fs.readFileSync(path.join(srcRoot, 'services', 'syncService.js'), 'utf8')
  assert(syncSource.includes("mutationId: mutation.id"), 'mutationId missing from sync envelope')
  assert(syncSource.includes("entityId: mutation.entityId"), 'entityId missing from sync envelope')
  assert(syncSource.includes("break"), 'halt-on-first-failure protection missing')

  const calls = []
  const previousNavigator = globalThis.navigator
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { onLine: true } })
  const repo = await import('../repositories/mutationRepository.js')
  const originals = {
    recoverStaleSyncing: repo.MutationRepository.recoverStaleSyncing,
    getPending: repo.MutationRepository.getPending,
    updateStatus: repo.MutationRepository.updateStatus,
    remove: repo.MutationRepository.remove
  }
  repo.MutationRepository.recoverStaleSyncing = async () => {}
  repo.MutationRepository.getPending = async () => [mutation, second]
  repo.MutationRepository.updateStatus = async (id, status) => calls.push(['status', id, status])
  repo.MutationRepository.remove = async (id) => calls.push(['remove', id])

  try {
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
  } finally {
    Object.assign(repo.MutationRepository, originals)
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: previousNavigator })
  }

  console.log('✅ Phase 5 Offline Sync Contract Tests Passed Successfully!')
}

runContractTests().catch((error) => {
  console.error('❌ Phase 5 Offline Sync Contract Tests Failed:', error)
  process.exitCode = 1
})
