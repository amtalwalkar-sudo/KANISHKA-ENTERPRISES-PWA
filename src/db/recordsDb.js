import { db } from './client.js'

export async function saveLocalRecord(record) {
  try {
    return await db.records.put(record)
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      throw new Error('Device storage full! Please export backup and clear device storage.')
    }
    throw err
  }
}

export async function getLocalRecords() {
  return await db.records.toArray()
}

export async function updateRecordStatusInDb(entityId, status) {
  return await db.records.update(entityId, { status })
}
