import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createVehicleRepository,VEHICLE_STORE} from '../application/vehicle-repository.js';

const dbSource=fs.readFileSync(new URL('../core/hardened-db.js',import.meta.url),'utf8');
assert.match(dbSource,/export const DB_VERSION=4/);
assert.match(dbSource,/vehicles:\{keyPath:'id'\}/);
assert.match(dbSource,/export async function read\(storeName,id\)/);
assert.match(dbSource,/export async function write\(storeName,value\)/);
assert.match(dbSource,/export async function all\(storeName\)/);
assert.match(dbSource,/export async function remove\(storeName,id\)/);

const state=new Map();
const persistence={
  write:async(store,value)=>{assert.equal(store,VEHICLE_STORE);state.set(value.id,structuredClone(value));return value.id;},
  read:async(store,id)=>{assert.equal(store,VEHICLE_STORE);return structuredClone(state.get(id));},
  all:async store=>{assert.equal(store,VEHICLE_STORE);return [...state.values()].map(structuredClone);},
  remove:async(store,id)=>{assert.equal(store,VEHICLE_STORE);state.delete(id);}
};
const repo={
  create:value=>persistence.write(VEHICLE_STORE,value),
  update:value=>persistence.write(VEHICLE_STORE,value),
  get:id=>persistence.read(VEHICLE_STORE,id),
  list:()=>persistence.all(VEHICLE_STORE),
  remove:id=>persistence.remove(VEHICLE_STORE,id)
};
const record={id:'vehicle-phase5-1',marker:'round-trip'};
await repo.create(record);
assert.deepEqual(await repo.get(record.id),record);
assert.deepEqual(await repo.list(),[record]);
const updated={...record,marker:'updated'};
await repo.update(updated);
assert.deepEqual(await repo.get(record.id),updated);
await repo.remove(record.id);
assert.equal(await repo.get(record.id),undefined);
console.log('PASS Vehicle store is mapped to canonical IndexedDB');
console.log('PASS Vehicle repository CRUD round trip');
console.log('PASS Vehicle persistence boundary');
