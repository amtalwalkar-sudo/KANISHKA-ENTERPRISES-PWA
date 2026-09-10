import { recordsRepository } from '@/repositories/recordsRepository.js'
import { toPaise } from '@/domain/math/index.js'

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `rec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export async function createRecordUseCase(formData, isOnline) {
  if (!formData.amount || Number(formData.amount) <= 0) {
    throw new Error('Please enter a valid amount greater than zero.')
  }

  const record = {
    entityId: generateId(),
    record_type: formData.record_type,
    amount_paise: toPaise(Number(formData.amount)),
    notes: formData.notes || '',
    date: formData.date,
    status: isOnline ? 'SYNCED' : 'PENDING'
  }

  await recordsRepository.save(record)

  if (!isOnline) {
    await recordsRepository.enqueueOffline({
      actionType: 'CREATE',
      entityType: 'RECORD',
      payload: record,
      timestamp: Date.now()
    })
  }

  return record
}
