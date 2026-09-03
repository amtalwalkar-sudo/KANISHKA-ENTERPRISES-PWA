import {createRecord,utcNow} from '../core/record.js';
import {createBackgroundTracking} from './background-tracking.js';
import {reverseGeocode} from './reverse-geocoding.js';

export function createOperationalTelemetry(repository){
  const events=repository.entity('operational_events');
  const pending=new Set();
  let tracking=null;
  let active=false;

  async function resolvePlace(eventId,position){
    const placeName=await reverseGeocode(position.latitude,position.longitude);
    const existing=await events.get(eventId);
    if(!existing||existing.is_deleted)return;
    return events.update(existing,placeName
      ? {place_name:placeName,place_name_status:'RESOLVED'}
      : {place_name:null,place_name_status:'UNAVAILABLE'});
  }

  async function applyPosition(eventId,position){
    const existing=await events.get(eventId);
    if(!existing||existing.is_deleted)return;
    const updated=await events.update(existing,{latitude:position.latitude,longitude:position.longitude,accuracy:position.accuracy,location_status:'CAPTURED',location_captured_at:utcNow(),place_name:null,place_name_status:'PENDING'});
    pending.delete(eventId);
    void resolvePlace(eventId,position).catch(()=>{});
    return updated;
  }

  function ensureTracker(){
    if(tracking)return;
    tracking=createBackgroundTracking({
      options:{enableHighAccuracy:false,maximumAge:30000,timeout:10000},
      onPosition:position=>{
        const value={latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy:position.coords.accuracy};
        for(const id of [...pending])void applyPosition(id,value).catch(()=>{});
      },
      onError:()=>{}
    });
  }

  function setActive(value){
    active=Boolean(value);
    if(active){ensureTracker();tracking?.start();}
    else tracking?.stop();
  }

  async function recordEvent({eventType,entityType,entityId,actionMode='SWIPE',direction=null,occurredAt=utcNow(),context={}}={}){
    const record=createRecord({event_type:eventType,entity_type:entityType,entity_id:entityId||null,action_mode:actionMode,direction,occurred_at:occurredAt,latitude:null,longitude:null,accuracy:null,location_status:'PENDING',location_captured_at:null,place_name:null,place_name_status:'PENDING',context});
    repository.assertRecord(record);
    await repository.atomic(['operational_events'],stores=>{stores.operational_events.put(record);return record;});
    pending.add(record.id);
    ensureTracker();
    if(active)tracking?.start();
    if(typeof navigator!=='undefined'&&navigator.geolocation){
      navigator.geolocation.getCurrentPosition(
        position=>void applyPosition(record.id,{latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy:position.coords.accuracy}).catch(()=>{}),
        ()=>void events.update(record,{location_status:'UNAVAILABLE',place_name_status:'UNAVAILABLE'}).then(()=>pending.delete(record.id)).catch(()=>{}),
        {enableHighAccuracy:false,maximumAge:30000,timeout:2500}
      );
    }else{
      pending.delete(record.id);
      await events.update(record,{location_status:'UNAVAILABLE',place_name_status:'UNAVAILABLE'});
    }
    return record;
  }

  function dispose(){tracking?.stop();tracking=null;pending.clear();}
  return Object.freeze({recordEvent,setActive,isActive:()=>active,dispose});
}
