import { initializeCanonicalStorage } from '../utils/indexedDB.js'
import { generateUUID } from '../utils/uuid.js'
import { buildMutationRecord } from './mutationRepository.js'

const atomic = async (stores, writer) => {
  const db = await initializeCanonicalStorage()
  return new Promise((resolve, reject) => {
    const tx = db.transaction([...stores, 'pending_mutations'], 'readwrite')
    const mutationStore = tx.objectStore('pending_mutations')
    try { writer(tx, mutationStore) } catch (e) { reject(e); return }
    tx.oncomplete = () => resolve(true)
    tx.onerror = () => reject(tx.error || new Error('Lifecycle persistence failed.'))
    tx.onabort = () => reject(tx.error || new Error('Lifecycle transaction aborted.'))
  })
}

const saveMutation = (mutationStore, entityId, entityType, action, payload, now) => mutationStore.put(buildMutationRecord({ entityId, entityType, action, payload, createdAt: now }))

export const DayShiftTripRepository = {
  async createDay(data) {
    const now = new Date().toISOString(); const record = { id: data.id || generateUUID(), dayStartAt: data.dayStartAt || now, dayEndAt: null, status: 'ACTIVE', hasCompletedBusinessTrip: false, createdAt: now, updatedAt: now }
    await atomic(['days'], (_, m) => { _.objectStore('days').put(record); saveMutation(m, record.id, 'DAY', 'CREATE', record, now) }); return record
  },
  async endDay(id) {
    const db = await initializeCanonicalStorage(); return new Promise((resolve,reject)=>{const tx=db.transaction(['days','pending_mutations'],'readwrite');const s=tx.objectStore('days');const m=tx.objectStore('pending_mutations');const req=s.get(id);req.onsuccess=()=>{const r=req.result;if(!r){reject(new Error('Day not found.'));return} const now=new Date().toISOString();r.dayEndAt=now;r.status='COMPLETED';r.updatedAt=now;s.put(r);saveMutation(m,r.id,'DAY','UPDATE',r,now)};req.onerror=()=>reject(req.error);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error||new Error('Day end failed.'));tx.onabort=()=>reject(tx.error||new Error('Day end aborted.'))})
  },
  async createShift(data) {
    const now = new Date().toISOString(); const record={id:data.id||generateUUID(),dayId:data.dayId,startOdometer:Number(data.startOdometer),endOdometer:null,totalDistance:0,revenue:0,shiftStartAt:data.shiftStartAt||now,shiftEndAt:null,status:'ACTIVE',createdAt:now,updatedAt:now}
    await atomic(['shifts'], (_,m)=>{_.objectStore('shifts').put(record);saveMutation(m,record.id,'SHIFT','CREATE',record,now)});return record
  },
  async endShift(data) {
    const db=await initializeCanonicalStorage(); return new Promise((resolve,reject)=>{const tx=db.transaction(['shifts','pending_mutations'],'readwrite');const s=tx.objectStore('shifts');const m=tx.objectStore('pending_mutations');const req=s.get(data.id);req.onsuccess=()=>{const r=req.result;if(!r){reject(new Error('Active shift not found.'));return} const now=new Date().toISOString();r.endOdometer=Number(data.endOdometer);r.totalDistance=r.endOdometer-r.startOdometer;r.revenue=Number(data.revenue);r.shiftEndAt=now;r.status='COMPLETED';r.updatedAt=now;s.put(r);saveMutation(m,r.id,'SHIFT','UPDATE',r,now)};req.onerror=()=>reject(req.error);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error||new Error('Shift end failed.'));tx.onabort=()=>reject(tx.error||new Error('Shift end aborted.'))})
  },
  async createTrip(data) { const now=new Date().toISOString();const record={id:data.id||generateUUID(),dayId:data.dayId,shiftId:data.shiftId,tripStartAt:data.tripStartAt||now,tripEndAt:null,status:'ACTIVE',tripStartLocation:data.tripStartLocation||null,tripEndLocation:null,createdAt:now,updatedAt:now};await atomic(['trips'],(_,m)=>{_.objectStore('trips').put(record);saveMutation(m,record.id,'TRIP','CREATE',record,now)});return record },
  async endTrip(data) { const db=await initializeCanonicalStorage();return new Promise((resolve,reject)=>{const tx=db.transaction(['trips','days','pending_mutations'],'readwrite');const t=tx.objectStore('trips');const d=tx.objectStore('days');const m=tx.objectStore('pending_mutations');const req=t.get(data.id);req.onsuccess=()=>{const r=req.result;if(!r){reject(new Error('Active trip not found.'));return}const now=new Date().toISOString();r.tripEndAt=now;r.status='COMPLETED';r.tripEndLocation=data.tripEndLocation||null;r.updatedAt=now;t.put(r);saveMutation(m,r.id,'TRIP','UPDATE',r,now);const dayReq=d.get(r.dayId);dayReq.onsuccess=()=>{const day=dayReq.result;if(day){day.hasCompletedBusinessTrip=true;day.updatedAt=now;d.put(day);saveMutation(m,day.id,'DAY','UPDATE',day,now)}}};req.onerror=()=>reject(req.error);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error||new Error('Trip end failed.'));tx.onabort=()=>reject(tx.error||new Error('Trip end aborted.'))}) },
  async getActive() { const db=await initializeCanonicalStorage();return new Promise((resolve,reject)=>{const tx=db.transaction(['days','shifts','trips'],'readonly');const ds=tx.objectStore('days').getAll();const ss=tx.objectStore('shifts').getAll();const ts=tx.objectStore('trips').getAll();let out={day:null,shift:null,trip:null};let n=0;const done=()=>{n++;if(n<3)return;out.day=(ds.result||[]).find(x=>x.status==='ACTIVE')||null;out.shift=(ss.result||[]).find(x=>x.status==='ACTIVE')||null;out.trip=(ts.result||[]).find(x=>x.status==='ACTIVE')||null;resolve(out)};ds.onsuccess=done;ss.onsuccess=done;ts.onsuccess=done;ds.onerror=()=>reject(ds.error);ss.onerror=()=>reject(ss.error);ts.onerror=()=>reject(ts.error)}) }
}
