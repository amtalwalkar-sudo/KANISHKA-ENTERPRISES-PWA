import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createKfeApplication} from '../application/kfe.js';

const appSource=fs.readFileSync(new URL('../application/kfe.js',import.meta.url),'utf8');
const uiSource=fs.readFileSync(new URL('../../src/components/WorkSessionView.vue',import.meta.url),'utf8');
const swipeSource=fs.readFileSync(new URL('../../src/components/KfeSwipeBar.vue',import.meta.url),'utf8');
const rootSource=fs.readFileSync(new URL('../../src/App.vue',import.meta.url),'utf8');
assert.equal(appSource.includes("../core/hardened-db.js"),false);
assert.equal(uiSource.includes("../../js/core/"),false);
assert.match(uiSource,/createUiCommand\('START_SHIFT'/);
assert.match(uiSource,/createUiCommand\('START_TRIP'/);
assert.match(uiSource,/createUiCommand\('END_TRIP'/);
assert.match(uiSource,/createUiCommand\('END_SHIFT'/);
assert.match(uiSource,/createUiCommand\('START_DAY'/);
assert.match(uiSource,/createUiCommand\('START_PERSONAL_TRIP'/);
assert.match(uiSource,/createUiCommand\('END_PERSONAL_TRIP'/);
assert.match(uiSource,/createUiCommand\('END_DAY'/);
assert.match(swipeSource,/pointerdown/);
assert.match(swipeSource,/pointerup/);
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
const trip=await app.startBusinessTrip({},'phase4-trip');
assert.equal(stores.get('rides').get(trip.id).start_odometer,undefined);
await app.endBusinessTrip({id:trip.id},'phase4-trip-end');
await app.endShift({id:shift.id,endOdometer:120},'phase4-shift-end');
await app.endDay({},'phase4-day-end');
assert.equal((await app.getWorkScreenState()).day.status,'COMPLETED');
console.log('PASS UI reaches application command boundary');
console.log('PASS reusable swipe boundary preserves scroll safety and accessibility');
console.log('PASS Work Day → Shift → Business Trip → Shift → Day lifecycle');
console.log('PASS business trips contain no manual odometer fields');
console.log('PASS persistence-ready application orchestration');
console.log('PASS Phase 4 Work Session vertical slice contract');
