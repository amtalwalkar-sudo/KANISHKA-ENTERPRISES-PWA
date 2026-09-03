/** KFE 2.0 Timeline presentation contract. Work/domain records remain authoritative. */
export const TIMELINE_EVENT_CONTRACT='KFE_TIMELINE_EVENT_V1';
export const TIMELINE_HORIZONS=Object.freeze(['Day','Week','Long-term']);
export function normalizeTimelineEvent(event={}){const occurredAt=event.occurredAt??event.occurred_at??event.timestamp??event.recordedAt??event.recorded_at??null;return Object.freeze({id:event.id??null,type:event.type??event.event_type??'Other',occurredAt,recordedAt:event.recordedAt??event.recorded_at??null,description:event.description??event.notes??event.category??'',amount:event.amount??(event.amount_paise!=null?Number(event.amount_paise)/100:null),odometer:event.odometer!=null?Number(event.odometer):null,workDayId:event.workDayId??event.work_day_id??null,shiftId:event.shiftId??event.shift_id??null,rideId:event.rideId??event.ride_id??null,entityType:event.entityType??event.entity_type??null,entityId:event.entityId??event.entity_id??null,scope:event.scope??event.context?.scope??null,source:event.source??'AUTHORITATIVE',locationName:event.locationName??event.location_name??event.place_name??null,latitude:event.latitude??null,longitude:event.longitude??null,accuracy:event.accuracy??null,gpsAvailable:Boolean(event.gpsAvailable||event.location_status==='CAPTURED'||(event.latitude!=null&&event.longitude!=null)),dataConfidenceState:event.dataConfidenceState??'UNKNOWN'});}
export function projectTimeline(events=[]){return events.map(normalizeTimelineEvent).sort((a,b)=>{const at=a.occurredAt?Date.parse(a.occurredAt):Number.POSITIVE_INFINITY;const bt=b.occurredAt?Date.parse(b.occurredAt):Number.POSITIVE_INFINITY;if(at!==bt)return at-bt;return String(a.id??'').localeCompare(String(b.id??''));});}
function startOfDay(d){const x=new Date(d);x.setHours(0,0,0,0);return x;}
export function timelineWindow(horizon='Day',asOf=new Date()){const end=new Date(asOf);if(!Number.isFinite(end.getTime()))throw new TypeError('Invalid Timeline date');if(horizon==='Long-term')return {start:null,end};if(horizon==='Week'){const start=startOfDay(end);start.setDate(start.getDate()-start.getDay());const weekEnd=new Date(start);weekEnd.setDate(weekEnd.getDate()+7);return {start,end:weekEnd};}const start=startOfDay(end);const dayEnd=new Date(start);dayEnd.setDate(dayEnd.getDate()+1);return {start,end:dayEnd};}
export function filterTimelineByHorizon(events=[],horizon='Day',asOf=new Date()){const {start,end}=timelineWindow(horizon,asOf);return projectTimeline(events).filter(e=>{if(!e.occurredAt)return false;const at=Date.parse(e.occurredAt);return Number.isFinite(at)&&(!start||at>=start.getTime())&&at<end.getTime();});}

function normalizedLocation(value){return String(value||'').trim().toLowerCase();}
function isMumbaiLocation(value){const key=normalizedLocation(value);return key==='mumbai'||key==='navi mumbai'||key.includes('mumbai');}
function isOutsideLocation(value){return Boolean(String(value||'').trim())&&!isMumbaiLocation(value);}
function isTripEvent(event){return String(event?.type||'').toLowerCase().includes('trip');}

/**
 * Classify an event without inventing a city from a raw coordinate. Location names
 * supplied by authoritative records define the current Mumbai operating-area boundary;
 * latitude/longitude are retained on every event for future geofence classification.
 */
export function timelineArea(event={}){if(isMumbaiLocation(event.locationName))return 'MUMBAI';if(isOutsideLocation(event.locationName))return 'OUTSIDE';return 'UNKNOWN';}

/**
 * Build outstation journeys from area transitions. One journey starts only when the
 * event stream moves from Mumbai Area into an outside-Mumbai location and remains open
 * until a later Mumbai Area event. Fuel, maintenance, breaks and local trips while
 * outside remain children of that same journey and never increment the journey count.
 */
export function buildOutstationJourneys(events=[]){
 const ordered=projectTimeline(events);const journeys=[];let active=null;let previousArea='UNKNOWN';
 for(const event of ordered){
  const area=timelineArea(event);
  if(!active&&area==='OUTSIDE'&&previousArea==='MUMBAI'){
   active={id:`OUTSTATION-${journeys.length+1}`,startedAt:event.occurredAt,endedAt:null,origin:'Mumbai',destination:event.locationName||'Outside Mumbai',events:[]};
   journeys.push(active);
  }
  if(active){
   active.events.push({...event,journeyId:active.id,journeyArea:area});
   if(area==='OUTSIDE'&&event.locationName&&!active.destination)active.destination=event.locationName;
   if(area==='MUMBAI'){active.endedAt=event.occurredAt;active.returnLocation=event.locationName||'Mumbai';active=null;}
  }
  if(area!=='UNKNOWN')previousArea=area;
 }
 return journeys.map(j=>Object.freeze({...j,events:Object.freeze(j.events),destination:j.destination||'Outside Mumbai'}));
}

export function buildTimelineJourneyModel(events=[]){
 const ordered=projectTimeline(events);const journeys=buildOutstationJourneys(ordered);const byEvent=new Map();for(const journey of journeys)for(const event of journey.events)byEvent.set(event.id??`${event.type}:${event.occurredAt}`,journey);
 return ordered.map(event=>{const journey=byEvent.get(event.id??`${event.type}:${event.occurredAt}`);return {...event,journeyId:journey?.id??null,journeyDestination:journey?.destination??null};});
}

export function summarizeOutstationJourneys(events=[]){
 const journeys=buildOutstationJourneys(events);const destinations=new Map();for(const journey of journeys){const key=journey.destination||'Outside Mumbai';destinations.set(key,(destinations.get(key)||0)+1);}
 return {count:journeys.length,destinations:[...destinations.entries()].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name)),journeys};
}

export function summarizeTimelineActivity(events=[]){
 const projected=projectTimeline(events);const journeys=buildOutstationJourneys(projected);const journeyIds=new Set(journeys.map(j=>j.id));const tripEvents=projected.filter(isTripEvent);const mumbaiTrips=tripEvents.filter(e=>timelineArea(e)==='MUMBAI').length;const outstationTripEvents=tripEvents.filter(e=>{const key=e.id??`${e.type}:${e.occurredAt}`;return journeys.some(j=>j.events.some(x=>(x.id??`${x.type}:${x.occurredAt}`)===key));}).length;return {activeDays:new Set(projected.map(e=>{if(!e.occurredAt)return 'unknown';const d=new Date(e.occurredAt);return Number.isFinite(d.getTime())?`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`:'unknown';}).filter(Boolean)).size,trips:tripEvents.length,mumbaiTrips,outstationJourneys:journeyIds.size,outstationTripEvents};
}
