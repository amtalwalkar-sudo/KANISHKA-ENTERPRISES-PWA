import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createKfeApplication} from '../application/kfe.js';

const appSource=fs.readFileSync(new URL('../application/kfe.js',import.meta.url),'utf8');
const uiSource=fs.readFileSync(new URL('../../src/components/WorkSessionView.vue',import.meta.url),'utf8');
const rootSource=fs.readFileSync(new URL('../../src/App.vue',import.meta.url),'utf8');
assert.equal(appSource.includes("../core/hardened-db.js"),false);
assert.equal(uiSource.includes("../../js/core/"),false);
assert.match(uiSource,/createUiCommand\(type\s*,\s*payload\)/);
for (const command of ['START_SHIFT','START_TRIP','END_TRIP','END_SHIFT','START_DAY','START_PERSONAL_TRIP','END_PERSONAL_TRIP','END_DAY']) assert.match(uiSource,new RegExp(command));
assert.doesNotMatch(uiSource,/kfe-swipe-bar|KfeSwipeBar|pointerdown|pointerup/);
assert.match(rootSource,/WorkSessionView/);
assert.match(rootSource,/kfe:work-state-changed/);

const names=['work_days','work_sessions','rides','odometer_allocations','operational_events','revenue_records','idempotency'];
const stores=new Map(names.map(name=>[name,new Map()]));
const idempotency=new Map();
const repo={
 assertRecord(record){return record;},
 updateRecord(existing,changes){return Object.freeze({...existing,...changes,updated_at:new Date().toISOString(),synced:false});},
 entity(store){return {get:async id=>stores.get(store).get(id)||null,list:async()=>[...stores.get(store).values()],update:async(existing,changes)=>{const next=repo.updateRecord(existing,changes);stores.get(store).set(next.id,next);return next;},softDelete:async existing=>{const next=repo.updateRecord(existing,{is_deleted:true});stores.get(store).set(next.id,next);return next;}};},
 async atomic(names,operation){const views=Object.fromEntries(names.map(name=>[name,{put:value=>stores.get(name).set(value.id,structuredClone(value)),clear:()=>stores.get(name).clear()}]));return operation(views);},
 async getIdempotency(id){const result=idempotency.get(id);return result===undefined?undefined:{result};},
 async saveIdempotency(entry){idempotency.set(entry.id,entry.result);return entry;}
};
const app=createKfeApplication(repo);
const day=await app.startDay({odometer:100},'phase4-day');
assert.equal(day.status,'OPEN');
const shift=await app.startShift({},'phase4-shift');
const trip=await app.startBusinessTrip({startOdometer:100},'phase4-trip');
assert.equal(stores.get('rides').get(trip.id).start_odometer,100);
await app.endBusinessTrip({id:trip.id,endOdometer:120},'phase4-trip-end');
assert.equal(stores.get('rides').get(trip.id).end_odometer,120);
assert.equal(stores.get('rides').get(trip.id).trip_total_km,20);
await app.endShift({id:shift.id,endOdometer:120,revenuePaise:10000},'phase4-shift-end');
await app.endDay({},'phase4-day-end');
assert.equal((await app.getWorkScreenState()).day.status,'COMPLETED');
console.log('PASS UI reaches application command boundary');
console.log('PASS clean Work canvas has no obsolete swipe boundary');
console.log('PASS Work Day → Shift → Business Trip → Shift → Day lifecycle');
console.log('PASS business trips persist authoritative start/end odometers');
console.log('PASS persistence-ready application orchestration');
console.log('PASS Phase 4 Work Session vertical slice contract');
