import { initializeCanonicalStorage } from '../utils/indexedDB.js'
import { generateUUID } from '../utils/uuid.js'

export const LocationRepository = {
  async record({ entityType, entityId, eventType, latitude, longitude, accuracy = null, capturedAt, placeName = null }) {
    const db = await initializeCanonicalStorage()
    const record = {
      id: generateUUID(),
      entityType,
      entityId,
      eventType,
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: Number.isFinite(Number(accuracy)) ? Number(accuracy) : null,
      placeName: placeName || null,
      capturedAt: capturedAt || new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
    return new Promise((resolve, reject) => {
      const tx = db.transaction('gps_snapshots', 'readwrite')
      tx.objectStore('gps_snapshots').put(record)
      tx.oncomplete = () => resolve(record)
      tx.onerror = () => reject(tx.error || new Error('GPS snapshot persistence failed.'))
      tx.onabort = () => reject(tx.error || new Error('GPS snapshot persistence aborted.'))
    })
  },

  async forEntity(entityType, entityId) {
    const db = await initializeCanonicalStorage()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('gps_snapshots', 'readonly')
      const request = tx.objectStore('gps_snapshots').getAll()
      request.onsuccess = () => resolve((request.result || []).filter(item => item.entityType === entityType && item.entityId === entityId).sort((a, b) => new Date(a.capturedAt) - new Date(b.capturedAt)))
      request.onerror = () => reject(request.error || new Error('GPS snapshot query failed.'))
    })
  }
}
