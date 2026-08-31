import {result,DATA} from './shared.js';
import {validateWorkOdometer} from './work.js';

export const TRIP_CALCULATION_VERSION=2;

function timestamp(value,name){const t=Date.parse(value);if(!Number.isFinite(t))throw new TypeError(`Invalid ${name}`);return t;}

export function validateTripLifecycle(trip,shift=null){
  if(!trip||typeof trip!=='object')throw new TypeError('Trip is required');
  if(trip.scope!=='BUSINESS'&&trip.scope!=='PERSONAL')throw new RangeError('Trip scope must be BUSINESS or PERSONAL');
  const start=timestamp(trip.started_at||trip.start_at,'trip start');
  const end=timestamp(trip.ended_at||trip.end_at,'trip end');
  if(end<start)throw new RangeError('Trip end cannot precede trip start');
  if(trip.scope==='PERSONAL'){
    validateWorkOdometer(Number(trip.end_odometer),Number(trip.start_odometer));
    if(shift?.status==='OPEN')throw new RangeError('Personal trip cannot overlap an active business shift');
    return true;
  }
  if(!shift||typeof shift!=='object')throw new TypeError('An active or completed business shift context is required');
  const shiftStart=timestamp(shift.started_at||shift.start_at,'shift start');
  const shiftEnd=timestamp(shift.ended_at||shift.end_at||new Date().toISOString(),'shift end');
  if(start<shiftStart||end>shiftEnd)throw new RangeError('Business trip must remain within its business shift');
  return true;
}

export function calculateTrip(trip,shift){
  validateTripLifecycle(trip,shift);
  const startOdometer=trip.scope==='PERSONAL'&&Number.isFinite(Number(trip.start_odometer))?Number(trip.start_odometer):null;
  const endOdometer=trip.scope==='PERSONAL'&&Number.isFinite(Number(trip.end_odometer))?Number(trip.end_odometer):null;
  const tripKm=startOdometer!=null&&endOdometer!=null?endOdometer-startOdometer:null;
  return result({tripKm,scope:trip.scope,startOdometer,endOdometer,startAt:trip.started_at||trip.start_at,endAt:trip.ended_at||trip.end_at,businessDate:trip.scope==='BUSINESS'?(shift.business_date||String(shift.started_at||shift.start_at).slice(0,10)):null},DATA.ACTUAL,[trip.id,shift?.id].filter(Boolean));
}
