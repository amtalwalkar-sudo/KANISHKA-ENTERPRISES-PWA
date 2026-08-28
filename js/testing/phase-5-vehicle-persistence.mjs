import assert from 'node:assert/strict';
import {createVehicleRepository,VEHICLE_STORE} from '../application/vehicle-repository.js';
import {STORES} from '../core/hardened-db.js';

assert.equal(STORES[VEHICLE_STORE].keyPath,'id');

const original=globalThis.indexedDB;
const stores=new Map([[VEHICLE_STORE,new Map()]]);
function clone(v){return structuredClone(v);}
globalThis.indexedDB={open(){
  const request={result:{objectStoreNames:{contains:n=>stores.has(n)},createObjectStore(){},transaction(name){return {objectStore(){return {put(v){stores.get(name).set(v.id,clone(v));return {onsuccess:null,onerror:null};},get(id){const r={};queueMicrotask(()=>{r.result=clone(stores.get(name).get(id));r.onsuccess?.();});return r;},getAll(){const r={};queueMicrotask(()=>{r.result=[...stores.get(name).values()].map(clone);r.onsuccess?.();});return r;},delete(id){stores.get(name).delete(id);return {onsuccess:null,onerror:null};}}}}},close(){}}};
  queueMicrotask(()=>request.onsuccess?.());
  return request;
}};

const repo=createVehicleRepository();
const record={id:'vehicle-test-1',marker:'round-trip-test'};
await repo.create(record);
assert.deepEqual(await repo.get(record.id),record);
assert.deepEqual(await repo.list(),[record]);
const updated={...record,marker:'updated'};
await repo.update(updated);
assert.deepEqual(await repo.get(record.id),updated);
assert.deepEqual(await repo.list(),[updated]);
await repo.remove(record.id);
assert.equal(await repo.get(record.id),undefined);
assert.deepEqual(await repo.list(),[]);
globalThis.indexedDB=original;
console.log('PHASE_5_VEHICLE_PERSISTENCE=PASS');
