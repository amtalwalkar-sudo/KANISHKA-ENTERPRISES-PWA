import assert from 'node:assert/strict';
import {TIMELINE_EVENT_CONTRACT,TIMELINE_HORIZONS,normalizeTimelineEvent,projectTimeline,timelineWindow} from '../ui/timeline.js';
assert.equal(TIMELINE_EVENT_CONTRACT,'KFE_TIMELINE_EVENT_V1');
assert.deepEqual(TIMELINE_HORIZONS,['Day','Week','Long-term']);
const future=normalizeTimelineEvent({id:'new',event_type:'NEW_WORK_EVENT',occurred_at:'2026-09-01T10:00:00Z',scope:'PERSONAL',location_status:'CAPTURED'});
assert.equal(future.type,'NEW_WORK_EVENT');assert.equal(future.occurredAt,'2026-09-01T10:00:00Z');assert.equal(future.scope,'PERSONAL');assert.equal(future.gpsAvailable,true);
assert.deepEqual(projectTimeline([{id:'late',occurredAt:'2026-09-01T12:00:00Z'},{id:'early',occurredAt:'2026-09-01T09:00:00Z'}]).map(x=>x.id),['early','late']);
assert.equal(timelineWindow('Day',new Date('2026-09-02T13:00:00')).start.getHours(),0);assert.equal(timelineWindow('Long-term',new Date('2026-09-02T13:00:00')).start,null);
console.log('Timeline foundation contract: PASS');
