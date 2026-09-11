import { initializeCanonicalStorage } from '../utils/indexedDB.js'
import { generateUUID } from '../utils/uuid.js'
import { buildMutationRecord } from './mutationRepository.js'

export const GpsSnapshotRepository = {
  async create({ entityType, entityId, event, location, periodic = false }) {
    if (!location) return null
    const db = await initializeCanonicalStorage(); const now = new Date().toISOString()
    const record={id:generateUUID(),entityType,entityId,event:event||'PERIODIC',periodic:Boolean(periodic),latitude:Number(location.latitude),longitude:Number(location.longitude),accuracy:Number(location.accuracy),speed:location.speed==null?null:Number(location.speed),bearing:location.bearing==null?null:Number(location.bearing),capturedAt:location.timestamp||now,createdAt:now}
    return new Promise((resolve,reject)=>{const tx=db.transaction(['gps_snapshots','pending_mutations'],'readwrite');const s=tx.objectStore('gps_snapshots');const m=tx.objectStore('pending_mutations');try{s.put(record);m.put(buildMutationRecord({entityId:record.id,entityType:'GPS_SNAPSHOT',action:'CREATE',payload:record,createdAt:now}))}catch(e){reject(e);return}tx.oncomplete=()=>resolve(record);tx.onerror=()=>reject(tx.error||new Error('GPS snapshot persistence failed.'));tx.onabort=()=>reject(tx.error||new Error('GPS snapshot transaction aborted.'))})
  },
  async getForEntity(entityId){const db=await initializeCanonicalStorage();return new Promise((resolve,reject)=>{const tx=db.transaction('gps_snapshots','readonly');const req=tx.objectStore('gps_snapshots').index('entityId').getAll(entityId);req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error||new Error('Failed to read GPS snapshots.'))})}
}
