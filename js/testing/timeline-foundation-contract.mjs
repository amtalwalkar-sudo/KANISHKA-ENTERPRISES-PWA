import assert from 'node:assert/strict';
import {TIMELINE_EVENT_CONTRACT,TIMELINE_HORIZONS,normalizeTimelineEvent,projectTimeline,filterTimelineByHorizon,timelineWindow,buildOutstationJourneys,summarizeOutstationJourneys,summarizeTimelineActivity} from '../ui/timeline.js';
assert.equal(TIMELINE_EVENT_CONTRACT,'KFE_TIMELINE_EVENT_V1');
assert.deepEqual(TIMELINE_HORIZONS,['Day','Week','Long-term']);
const future=normalizeTimelineEvent({id:'new',event_type:'NEW_WORK_EVENT',occurred_at:'2026-09-01T10:00:00Z',scope:'PERSONAL',location_status:'CAPTURED'});
assert.equal(future.type,'NEW_WORK_EVENT');assert.equal(future.occurredAt,'2026-09-01T10:00:00Z');assert.equal(future.scope,'PERSONAL');assert.equal(future.gpsAvailable,true);assert.equal(future.dataConfidenceState,'UNKNOWN');
assert.deepEqual(projectTimeline([{id:'late',occurredAt:'2026-09-01T12:00:00Z'},{id:'early',occurredAt:'2026-09-01T09:00:00Z'}]).map(x=>x.id),['early','late']);
assert.deepEqual(filterTimelineByHorizon([{id:'timed',occurredAt:'2026-09-02T10:00:00'},{id:'untimed'}],'Long-term',new Date('2026-09-02T13:00:00')).map(x=>x.id),['timed']);
assert.equal(timelineWindow('Day',new Date('2026-09-02T13:00:00')).start.getHours(),0);assert.equal(timelineWindow('Long-term',new Date('2026-09-02T13:00:00')).start,null);

const outstationScenario=[
 {id:'m1',type:'Work Started',occurredAt:'2026-09-01T08:00:00',locationName:'Mumbai'},
 {id:'p1',type:'Business Trip',occurredAt:'2026-09-01T10:00:00',locationName:'Pune'},
 {id:'p2',type:'Fuel',occurredAt:'2026-09-01T11:00:00',locationName:'Pune'},
 {id:'p3',type:'Business Trip',occurredAt:'2026-09-01T12:00:00',locationName:'Pune'},
 {id:'p4',type:'Maintenance',occurredAt:'2026-09-01T13:00:00',locationName:'Pune'},
 {id:'m2',type:'Business Trip',occurredAt:'2026-09-01T17:00:00',locationName:'Mumbai'},
 {id:'m3',type:'Business Trip',occurredAt:'2026-09-02T09:00:00',locationName:'Mumbai'},
 {id:'s1',type:'Business Trip',occurredAt:'2026-09-02T11:00:00',locationName:'Shahapur'},
 {id:'s2',type:'Fuel',occurredAt:'2026-09-02T12:00:00',locationName:'Shahapur'},
 {id:'m4',type:'Business Trip',occurredAt:'2026-09-02T18:00:00',locationName:'Mumbai'}
];
const journeys=buildOutstationJourneys(outstationScenario);
assert.equal(journeys.length,2);
assert.equal(journeys[0].destination,'Pune');
assert.deepEqual(journeys[0].events.map(e=>e.id),['p1','p2','p3','p4','m2']);
assert.deepEqual(summarizeOutstationJourneys(outstationScenario).destinations.map(x=>[x.name,x.count]),[['Pune',1],['Shahapur',1]]);
const activity=summarizeTimelineActivity(outstationScenario);
assert.equal(activity.mumbaiTrips,2);assert.equal(activity.outstationJourneys,2);assert.equal(activity.outstationTripEvents,2);
console.log('Timeline foundation contract: PASS');
