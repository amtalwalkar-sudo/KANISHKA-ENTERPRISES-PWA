import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createKfeApplication} from '../application/kfe.js';
import {workSessionReadModel} from '../application/read-models.js';

const appSource=fs.readFileSync(new URL('../application/kfe.js',import.meta.url),'utf8');
const uiSource=fs.readFileSync(new URL('../../src/components/WorkSessionView.vue',import.meta.url),'utf8');
const rootSource=fs.readFileSync(new URL('../../src/App.vue',import.meta.url),'utf8');
assert.equal(appSource.includes("../core/hardened-db.js"),false);
assert.equal(uiSource.includes("../../js/core/"),false);
assert.equal(uiSource.includes('application.startWork'),true);
assert.equal(uiSource.includes('application.completeWork'),true);
assert.equal(uiSource.includes('viewModels.workSession'),true);
assert.equal(rootSource.includes('WorkSessionView'),true);

const stores=new Map(['work_sessions','revenue_records'].map(name=>[name,new Map()]));
const idempotency=new Map();
const repo={
 assertRecord(record){return record;},
 updateRecord(existing,changes){return Object.freeze({...existing,...changes,updated_at:new Date().toISOString(),synced:false});},
 entity(store){return {get:async id=>stores.get(store).get(id)||null,list:async()=>[...stores.get(store).values()]};},
 async atomic(names,operation){const views=Object.fromEntries(names.map(name=>[name,{put:value=>stores.get(name).set(value.id,structuredClone(value))}]));return operation(views);},
 async getIdempotency(id){return idempotency.get(id);},
 async saveIdempotency(entry){idempotency.set(entry.id,entry.result);return entry;}
};
const app=createKfeApplication(repo);
const operation='phase-4-start-0001';
const created=await app.startWork({started_at:'2026-08-28T06:00:00.000Z',start_odometer:100,break_minutes:0},operation);
const replay=await app.startWork({started_at:'2026-08-28T06:00:00.000Z',start_odometer:100,break_minutes:0},operation);
assert.equal(created.id,replay.id);
assert.equal(created.status,'OPEN');
const loaded=await app.getWork(created.id);
assert.equal(loaded.id,created.id);
const presented=workSessionReadModel(loaded);
assert.equal(presented.session.id,created.id);
const updated=await app.completeWork(created.id,{ended_at:'2026-08-28T14:00:00.000Z',end_odometer:180},'phase-4-complete-0001');
assert.equal(updated.status,'COMPLETED');
assert.equal(stores.get('work_sessions').get(created.id).end_odometer,180);
const reread=await app.getWork(created.id);
assert.equal(reread.status,'COMPLETED');
assert.equal(workSessionReadModel(reread).session.status,'COMPLETED');
await assert.rejects(()=>app.completeWork('00000000-0000-4000-8000-000000000000',{},'phase-4-missing-0001'),/Work session not found/);
console.log('PASS UI reaches application command boundary');
console.log('PASS application reaches repository boundary');
console.log('PASS Work Session create/update/retrieve lifecycle');
console.log('PASS application command idempotency');
console.log('PASS read model renders persisted application state');
console.log('PASS deterministic invalid-state handling');
console.log('PASS Phase 4 Work Session vertical slice contract');
