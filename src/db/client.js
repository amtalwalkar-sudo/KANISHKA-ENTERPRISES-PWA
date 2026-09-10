import Dexie from 'dexie'

export const db = new Dexie('KanishkaEnterprisesDB')

db.version(1).stores({
  records: 'entityId, record_type, date, status',
  offlineQueue: '++id, actionType, entityType, timestamp'
})

db.version(2).stores({
  records: 'entityId, record_type, date, status',
  offlineQueue: '++id, actionType, entityType, timestamp'
}).upgrade(tx => {
  return tx.table('records').toCollection().modify(record => {
    if (!record.status) record.status = 'PENDING'
  })
})
