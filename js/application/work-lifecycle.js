import {createRecord,utcNow,softDeleteRecord} from '../core/record.js';
import {withIdempotency,createOperationId} from '../core/idempotency.js';
import {validateWorkOdometer} from '../domain/work.js';
import {deriveWorkScreenState,calculateOdometerDifference,validateKmAllocation,canStartDay,canStartShift,canStartBusinessTrip,canStartPersonalTrip,canEndShift,canEndDay} from '../domain/work-lifecycle.js';
import {validateTripLifecycle} from '../domain/trips.js';

function localDate(value=new Date()){
  const d=value instanceof Date?value:new Date(value);if(!Number.isFinite(d.getTime()))throw new TypeError('Invalid date');
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function number(value,name){const n=Number(value);if(!Number.isFinite(n))throw new RangeError(`${name} must be a number`);return n;}
function whole(value,name){const n=number(value,name);if(!Number.isInteger(n))throw new RangeError(`${name} must be a whole number`);return n;}
function active(records){return records.filter(record=>!record.is_deleted&&record.status!=='CANCELLED');}

export function createWorkApplication({repository,telemetry}){
  const days=repository.entity('work_days'),shifts=repository.entity('work_sessions'),trips=repository.entity('rides'),allocations=repository.entity('odometer_allocations'),revenues=repository.entity('revenue_records');

  async function latestOdometer(){
    const [dayRows,shiftRows,tripRows]=await Promise.all([days.list(),shifts.list(),trips.list()]);const candidates=[];
    for(const day of active(dayRows))if(Number.isFinite(Number(day.start_odometer)))candidates.push({at:day.started_at,odometer:Number(day.start_odometer),source:'DAY'});
    for(const shift of active(shiftRows)){
      if(Number.isFinite(Number(shift.end_odometer))&&shift.ended_at)candidates.push({at:shift.ended_at,odometer:Number(shift.end_odometer),source:'BUSINESS_SHIFT_END'});
      else if(Number.isFinite(Number(shift.start_odometer))&&shift.started_at)candidates.push({at:shift.started_at,odometer:Number(shift.start_odometer),source:'BUSINESS_SHIFT_START'});
    }
    for(const trip of active(tripRows))if(trip.scope==='PERSONAL'){
      if(Number.isFinite(Number(trip.end_odometer))&&trip.ended_at)candidates.push({at:trip.ended_at,odometer:Number(trip.end_odometer),source:'PERSONAL_TRIP_END'});
      else if(Number.isFinite(Number(trip.start_odometer))&&trip.started_at)candidates.push({at:trip.started_at,odometer:Number(trip.start_odometer),source:'PERSONAL_TRIP_START'});
    }
    candidates.sort((a,b)=>Date.parse(String(b.at||''))-Date.parse(String(a.at||'')));return candidates[0]||null;
  }

  async function currentContext(businessDate=localDate()){
    const [dayRows,shiftRows,tripRows,revenueRows]=await Promise.all([days.list(),shifts.list(),trips.list(),revenues.list()]);
    const day=active(dayRows).find(x=>x.business_date===businessDate&&x.status==='OPEN')||active(dayRows).find(x=>x.business_date===businessDate&&x.status==='COMPLETED')||null;
    const shift=active(shiftRows).filter(x=>x.scope==='BUSINESS'&&x.business_date===businessDate&&x.status==='OPEN').sort((a,b)=>Date.parse(b.started_at)-Date.parse(a.started_at))[0]||null;
    const trip=active(tripRows).filter(x=>x.status==='OPEN').sort((a,b)=>Date.parse(b.started_at||b.start_at)-Date.parse(a.started_at||a.start_at))[0]||null;
    const todayBusinessTrips=active(tripRows).filter(x=>x.scope==='BUSINESS'&&String(x.business_date||'')===businessDate&&x.status==='COMPLETED').length;
    const todayRevenuePaise=active(revenueRows).filter(x=>x.scope==='BUSINESS'&&String(x.business_date||'')===businessDate).reduce((sum,x)=>sum+Number(x.amount_paise||0),0);
    const latest=await latestOdometer();return {day,shift,trip,todayBusinessTrips,todayRevenuePaise,latest};
  }

  async function state(){const businessDate=localDate(),context=await currentContext(businessDate);return deriveWorkScreenState({day:context.day,shift:context.shift,trip:context.trip,latestOdometer:context.latest?.odometer,todayBusinessTrips:context.todayBusinessTrips,todayRevenuePaise:context.todayRevenuePaise});}
  async function recordTelemetry(eventType,entityType,entityId,{actionMode='SWIPE',direction=null,occurredAt}={}){return telemetry?.recordEvent({eventType,entityType,entityId,actionMode,direction,occurredAt,context:{business_date:localDate()}})||null;}
  async function syncTracking(){const s=await state();telemetry?.setActive(Boolean(s.day.status==='OPEN'||s.shift.active||s.trip.active));return s;}

  async function startDay({odometer,prefilledOdometer=null,businessKm=0,personalKm=0,actionMode='SWIPE',direction='RIGHT'}={},operationId=createOperationId()){
    return withIdempotency(repository,operationId,async()=>{const occurredAt=utcNow(),businessDate=localDate(),context=await currentContext(businessDate);if(!canStartDay(context))throw new Error('Day cannot be started while another operational session is active');const current=whole(odometer,'Start odometer');if(prefilledOdometer!=null)validateWorkOdometer(current,Number(prefilledOdometer));const difference=calculateOdometerDifference(prefilledOdometer,current).difference;validateKmAllocation(difference,{businessKm,personalKm});const day=createRecord({business_date:businessDate,started_at:occurredAt,ended_at:null,start_odometer:current,status:'OPEN',entry_source:'LIVE'});repository.assertRecord(day);const allocation=difference?createRecord({context:'DAY_START',reference_id:day.id,prefilled_odometer:Number(prefilledOdometer),current_odometer:current,difference_km:difference,business_km:Number(businessKm),personal_km:Number(personalKm),occurred_at:occurredAt}):null;await repository.atomic(allocation?['work_days','odometer_allocations']:['work_days'],stores=>{stores.work_days.put(day);if(allocation)stores.odometer_allocations.put(allocation);return true;});await recordTelemetry('START_DAY','WORK_DAY',day.id,{actionMode,direction,occurredAt});await syncTracking();return day;});
  }

  async function startShift({actionMode='SWIPE',direction='RIGHT'}={},operationId=createOperationId()){
    return withIdempotency(repository,operationId,async()=>{const occurredAt=utcNow(),businessDate=localDate(),context=await currentContext(businessDate);if(!canStartShift(context))throw new Error('Shift can only start from the day-ready state');if(context.latest==null)throw new Error('Start day odometer is required before starting a shift');const shift=createRecord({business_date:businessDate,scope:'BUSINESS',status:'OPEN',started_at:occurredAt,ended_at:null,start_odometer:Number(context.latest.odometer),end_odometer:null,break_minutes:0,trip_count:0,toll_paise:0,parking_paise:0,toll_included_in_fare:false,parking_included_in_fare:false});repository.assertRecord(shift);await repository.atomic(['work_sessions'],stores=>{stores.work_sessions.put(shift);return shift;});await recordTelemetry('START_SHIFT','WORK_SESSION',shift.id,{actionMode,direction,occurredAt});await syncTracking();return shift;});
  }

  async function startBusinessTrip({actionMode='SWIPE',direction='RIGHT'}={},operationId=createOperationId()){
    return withIdempotency(repository,operationId,async()=>{const occurredAt=utcNow(),businessDate=localDate(),context=await currentContext(businessDate);if(!canStartBusinessTrip(context))throw new Error('Business trip can only start while a shift is active and no trip is active');const trip=createRecord({scope:'BUSINESS',trip_type:'BUSINESS',shift_id:context.shift.id,status:'OPEN',started_at:occurredAt,ended_at:null,duration_seconds:null,business_date:businessDate,toll_paise:0,parking_paise:0});repository.assertRecord(trip);await repository.atomic(['rides'],stores=>{stores.rides.put(trip);return trip;});await recordTelemetry('START_TRIP','BUSINESS_TRIP',trip.id,{actionMode,direction,occurredAt});await syncTracking();return trip;});
  }

  async function startPersonalTrip({odometer,prefilledOdometer=null,businessKm=0,personalKm=0,actionMode='SWIPE',direction='LEFT'}={},operationId=createOperationId()){
    return withIdempotency(repository,operationId,async()=>{const occurredAt=utcNow(),businessDate=localDate(),context=await currentContext(businessDate);if(!canStartPersonalTrip(context))throw new Error('Personal trip can only start when no business shift or trip is active');const current=whole(odometer,'Start odometer');if(prefilledOdometer!=null)validateWorkOdometer(current,Number(prefilledOdometer));const difference=calculateOdometerDifference(prefilledOdometer,current).difference;validateKmAllocation(difference,{businessKm,personalKm});const trip=createRecord({scope:'PERSONAL',trip_type:'PERSONAL',shift_id:null,status:'OPEN',started_at:occurredAt,ended_at:null,duration_seconds:null,business_date:context.day?.status==='OPEN'?businessDate:null,start_odometer:current,end_odometer:null,toll_paise:0,parking_paise:0});repository.assertRecord(trip);const allocation=difference?createRecord({context:'PERSONAL_TRIP_START',reference_id:trip.id,prefilled_odometer:Number(prefilledOdometer),current_odometer:current,difference_km:difference,business_km:Number(businessKm),personal_km:Number(personalKm),occurred_at:occurredAt}):null;await repository.atomic(allocation?['rides','odometer_allocations']:['rides'],stores=>{stores.rides.put(trip);if(allocation)stores.odometer_allocations.put(allocation);return true;});await recordTelemetry('START_PERSONAL_TRIP','PERSONAL_TRIP',trip.id,{actionMode,direction,occurredAt});await syncTracking();return trip;});
  }

  async function endBusinessTrip({id,actionMode='SWIPE',direction='RIGHT'}={},operationId=createOperationId()){
    return withIdempotency(repository,operationId,async()=>{const existing=await trips.get(id);if(!existing||existing.scope!=='BUSINESS'||existing.status!=='OPEN')throw new Error('Business trip is not active');const shift=await shifts.get(existing.shift_id);if(!shift||shift.status!=='OPEN')throw new Error('Business trip must belong to the active shift');const occurredAt=utcNow();const duration=Math.max(0,Math.floor((Date.parse(occurredAt)-Date.parse(existing.started_at))/1000));const updated=await trips.update(existing,{status:'COMPLETED',ended_at:occurredAt,duration_seconds:duration});validateTripLifecycle(updated,shift);await recordTelemetry('END_TRIP','BUSINESS_TRIP',updated.id,{actionMode,direction,occurredAt});await syncTracking();return updated;});
  }

  async function endPersonalTrip({id,endOdometer,tollPaise=0,parkingPaise=0,actionMode='SWIPE',direction='RIGHT'}={},operationId=createOperationId()){
    return withIdempotency(repository,operationId,async()=>{const existing=await trips.get(id);if(!existing||existing.scope!=='PERSONAL'||existing.status!=='OPEN')throw new Error('Personal trip is not active');const end=whole(endOdometer,'End odometer');validateWorkOdometer(end,Number(existing.start_odometer));const occurredAt=utcNow();const duration=Math.max(0,Math.floor((Date.parse(occurredAt)-Date.parse(existing.started_at))/1000));const updated=await trips.update(existing,{status:'COMPLETED',ended_at:occurredAt,duration_seconds:duration,end_odometer:end,toll_paise:Math.max(0,whole(tollPaise,'Toll')),parking_paise:Math.max(0,whole(parkingPaise,'Parking'))});validateTripLifecycle(updated,null);await recordTelemetry('END_PERSONAL_TRIP','PERSONAL_TRIP',updated.id,{actionMode,direction,occurredAt});await syncTracking();return updated;});
  }

  async function endShift({id,endOdometer,revenuePaise=0,tollPaise=0,parkingPaise=0,tollIncludedInFare=false,parkingIncludedInFare=false,breakMinutes=0,actionMode='SWIPE',direction='RIGHT'}={},operationId=createOperationId()){
    return withIdempotency(repository,operationId,async()=>{const existing=await shifts.get(id);if(!existing||existing.scope!=='BUSINESS'||existing.status!=='OPEN')throw new Error('Shift is not active');const context=await currentContext(existing.business_date||localDate());if(!canEndShift(context)||context.shift?.id!==id)throw new Error('Shift can only end while waiting for a ride');const revenue=whole(revenuePaise,'Revenue');if(revenue<0)throw new RangeError('Revenue must not be negative');const end=whole(endOdometer,'End odometer');validateWorkOdometer(end,Number(existing.start_odometer));const breaks=whole(breakMinutes,'Break minutes');if(breaks<0)throw new RangeError('Break minutes must not be negative');const occurredAt=utcNow();const tripRows=active(await trips.list()).filter(t=>t.scope==='BUSINESS'&&t.shift_id===id&&t.status==='COMPLETED');const updated=repository.updateRecord(existing,{status:'COMPLETED',ended_at:occurredAt,end_odometer:end,break_minutes:breaks,toll_paise:Math.max(0,whole(tollPaise,'Toll')),parking_paise:Math.max(0,whole(parkingPaise,'Parking')),toll_included_in_fare:Boolean(tollIncludedInFare),parking_included_in_fare:Boolean(parkingIncludedInFare),trip_count:tripRows.length});const revenueRecord=createRecord({work_session_id:id,amount_paise:revenue,scope:'BUSINESS',business_date:existing.business_date,recorded_at:occurredAt,entry_source:'SHIFT_CLOSURE'});await repository.atomic(['work_sessions','revenue_records'],stores=>{stores.work_sessions.put(updated);stores.revenue_records.put(revenueRecord);return true;});await recordTelemetry('END_SHIFT','WORK_SESSION',updated.id,{actionMode,direction,occurredAt});await syncTracking();return updated;});
  }

  async function endDay({actionMode='SWIPE',direction='RIGHT'}={},operationId=createOperationId()){
    return withIdempotency(repository,operationId,async()=>{const businessDate=localDate(),context=await currentContext(businessDate);if(!canEndDay(context))throw new Error('Day can only end when no shift or trip is active');const occurredAt=utcNow();const updated=await days.update(context.day,{status:'COMPLETED',ended_at:occurredAt});await recordTelemetry('END_DAY','WORK_DAY',updated.id,{actionMode,direction,occurredAt});await syncTracking();return updated;});
  }

  async function undo(action={},operationId=createOperationId()){
    return withIdempotency(repository,operationId,async()=>{const type=action.type,id=action.id,occurredAt=utcNow();if(!type||!id)throw new Error('Undo action is incomplete');let updated=null;
      if(type==='START_DAY'){const day=await days.get(id);const context=await currentContext(day?.business_date||localDate());if(!day||context.shift||context.trip)throw new Error('Cannot undo day start while another operational session is active');const rows=active(await allocations.list()).filter(x=>x.reference_id===id);updated=await days.update(day,{status:'CANCELLED',ended_at:occurredAt});for(const row of rows)await allocations.softDelete(row);
      }else if(type==='END_DAY'){const day=await days.get(id);if(!day||day.status!=='COMPLETED')throw new Error('Day is not closed');updated=await days.update(day,{status:'OPEN',ended_at:null});
      }else if(type==='START_SHIFT'){const shift=await shifts.get(id);const context=await currentContext(shift?.business_date||localDate());if(!shift||context.trip)throw new Error('Cannot undo shift start while a trip is active');updated=await shifts.update(shift,{status:'CANCELLED',ended_at:occurredAt});
      }else if(type==='END_SHIFT'){const shift=await shifts.get(id);if(!shift||shift.status!=='COMPLETED')throw new Error('Shift is not closed');const revenueRows=active(await revenues.list()).filter(x=>x.work_session_id===id&&x.entry_source==='SHIFT_CLOSURE');const reopened=repository.updateRecord(shift,{status:'OPEN',ended_at:null,end_odometer:null,toll_paise:0,parking_paise:0,toll_included_in_fare:false,parking_included_in_fare:false});updated=reopened;await repository.atomic(['work_sessions','revenue_records'],stores=>{stores.work_sessions.put(reopened);for(const row of revenueRows)stores.revenue_records.put(softDeleteRecord(row));return true;});
      }else if(type==='START_TRIP'||type==='START_PERSONAL_TRIP'){const trip=await trips.get(id);if(!trip||trip.status!=='OPEN')throw new Error('Trip is not active');const rows=active(await allocations.list()).filter(x=>x.reference_id===id);updated=await trips.update(trip,{status:'CANCELLED',ended_at:occurredAt});for(const row of rows)await allocations.softDelete(row);
      }else if(type==='END_TRIP'||type==='END_PERSONAL_TRIP'){const trip=await trips.get(id);if(!trip||trip.status!=='COMPLETED')throw new Error('Trip is not completed');updated=await trips.update(trip,{status:'OPEN',ended_at:null,duration_seconds:null,end_odometer:null,toll_paise:0,parking_paise:0});
      }else throw new Error(`Unsupported undo action: ${type}`);
      await recordTelemetry(`UNDO_${type}`,updated.scope==='BUSINESS'?'BUSINESS':updated.scope==='PERSONAL'?'PERSONAL':'WORK',updated.id,{actionMode:'BUTTON',direction:null,occurredAt});await syncTracking();return updated;
    });
  }

  async function summary(){const businessDate=localDate();const [dayRows,shiftRows,tripRows,revenueRows]=await Promise.all([days.list(),shifts.list(),trips.list(),revenues.list()]);const day=active(dayRows).find(x=>x.business_date===businessDate)||null;const shiftsToday=active(shiftRows).filter(x=>x.business_date===businessDate&&x.scope==='BUSINESS');const tripsToday=active(tripRows).filter(x=>x.business_date===businessDate&&x.scope==='BUSINESS'&&x.status==='COMPLETED');const revenuePaise=active(revenueRows).filter(x=>x.business_date===businessDate&&x.scope==='BUSINESS').reduce((sum,x)=>sum+Number(x.amount_paise||0),0);const shiftSeconds=shiftsToday.reduce((sum,x)=>x.started_at&&x.ended_at?sum+Math.max(0,Math.floor((Date.parse(x.ended_at)-Date.parse(x.started_at))/1000)):sum,0);const breakMinutes=shiftsToday.reduce((sum,x)=>sum+Number(x.break_minutes||0),0);return Object.freeze({businessDate,day,shiftCount:shiftsToday.filter(x=>x.status==='COMPLETED').length,tripCount:tripsToday.length,revenuePaise,shiftSeconds,breakMinutes});}
  return Object.freeze({state,startDay,startShift,startBusinessTrip,startPersonalTrip,endBusinessTrip,endPersonalTrip,endShift,endDay,undo,summary,latestOdometer});
}