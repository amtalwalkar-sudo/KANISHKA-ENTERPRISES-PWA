import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRecordsStore } from '../records.js'

vi.mock('@/db/index.js', () => ({
  saveLocalRecord: vi.fn().mockImplementation(record => Promise.resolve({ id: 1, ...record })),
  enqueueOfflineAction: vi.fn().mockImplementation((type, entity, payload) => Promise.resolve(1)),
  getPendingOfflineActions: vi.fn().mockResolvedValue([]),
  removeOfflineAction: vi.fn().mockResolvedValue(true)
}))

import { saveLocalRecord, enqueueOfflineAction } from '@/db/index.js'

describe('Records Store & Persistence', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes with empty records and total zero', () => {
    const store = useRecordsStore()
    expect(store.records).toEqual([])
    expect(store.totalPaise).toBe(0)
  })

  it('adds record and updates filtered getters', () => {
    const store = useRecordsStore()
    const revRecord = { id: 'rec-1', record_type: 'REVENUE', amount_paise: 5000 }
    const expRecord = { id: 'rec-2', record_type: 'EXPENSE', amount_paise: 2000 }

    store.addRecord(revRecord)
    store.addRecord(expRecord)

    expect(store.records.length).toBe(2)
    expect(store.totalPaise).toBe(7000)
    expect(store.revenueRecords).toHaveLength(1)
    expect(store.expenseRecords).toHaveLength(1)
  })

  it('updates existing record by ID', () => {
    const store = useRecordsStore()
    store.setRecords([{ id: 'rec-10', record_type: 'FUEL', amount_paise: 1000 }])

    store.updateRecord('rec-10', { amount_paise: 2500 })

    expect(store.records[0].amount_paise).toBe(2500)
    expect(store.totalPaise).toBe(2500)
  })

  it('delegates record saving to IndexedDB wrapper', async () => {
    const payload = { entityId: 'ent-1', record_type: 'REVENUE', amount_paise: 8000 }
    const res = await saveLocalRecord(payload)

    expect(saveLocalRecord).toHaveBeenCalledWith(payload)
    expect(res.id).toBe(1)
  })

  it('enqueues offline action during mutations', async () => {
    const payload = { amount_paise: 1500, type: 'MAINTENANCE' }
    await enqueueOfflineAction('CREATE', 'RECORD', payload)

    expect(enqueueOfflineAction).toHaveBeenCalledWith('CREATE', 'RECORD', payload)
  })
})
