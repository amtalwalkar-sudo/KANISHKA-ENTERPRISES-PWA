import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRecord} from '../core/record.js';
import {createKfeApplication} from '../application/kfe.js';

const source=fs.readFileSync(new URL('../application/kfe.js',import.meta.url),'utf8');
assert.equal(source.includes("../core/hardened-db.js"),false,'application must not import hardened-db directly');
assert.equal(source.includes("repository.entity('work_sessions')"),true,'work completion must use repository boundary');

const stores=new Map(['work_sessions','revenue_records'].map(name=>[name,new Map()]));
const idempotency=new Map();
const repo={
  assertRecord(record){assert.equal(typeof record.id,'string');return record;},
  updateRecord(existing,changes){return createRecord({...existing,...changes},{id:existing.id,user_id:existing.user_id,created_at:existing.created_at,synced:false});},
  entity(store){return {get:async id=>stores.get(store).get(id)||null};},
  async atomic(names,operation){
    const views=Object.fromEntries(names.map(name=>[name,{put:value=>stores.get(name).set(value.id,structuredClone(value))}]));
    return operation(views);
  },
  async getIdempotency(id){return idempotency.get(id);},
  async saveIdempotency(entry){idempotency.set(entry.id,entry);return entry;}
};

const app=createKfeApplication(repo);
assert.ok(app.graph,'application exposes dependency graph');
assert.equal(typeof app.startWork,'function');
assert.equal(typeof app.completeWork,'function');

const operationId='phase-m-start-0001';
const first=await app.startWork({vehicle_id:null,started_at:new Date().toISOString()},operationId);
const second=await app.startWork({vehicle_id:null,started_at:new Date().toISOString()},operationId);
assert.equal(first.id,second.id,'replaying an application command must be idempotent');
assert.equal(first.status,'OPEN');

stores.get('work_sessions').set(first.id,first);
const completed=await app.completeWork(first.id,{ended_at:new Date().toISOString(),revenue_paise:12345},'phase-m-complete-0001');
assert.equal(completed.status,'COMPLETED');
assert.equal(stores.get('work_sessions').get(first.id).status,'COMPLETED');
assert.equal(stores.get('revenue_records').size,1,'completion may atomically create revenue');
assert.equal(stores.get('revenue_records').values().next().value.work_session_id,first.id);

await assert.rejects(()=>app.completeWork('00000000-0000-4000-8000-000000000000',{},'phase-m-missing-0001'),/Work session not found/);

console.log('PASS application layer does not access storage directly');
console.log('PASS application commands use repository boundary');
console.log('PASS application start operation is idempotent');
console.log('PASS completed work coordinates atomic work + revenue persistence');
console.log('PASS missing work session fails deterministically');
console.log('PASS Phase M application orchestration contract');
