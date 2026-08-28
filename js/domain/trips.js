import {result,DATA} from './shared.js';
import {validateWorkOdometer} from './work.js';

export const TRIP_CALCULATION_VERSION=1;

function timestamp(value,name){const t=Date.parse(value);if(!Number.isFinite(t))throw new TypeError(`Invalid ${name}`);return t;}

export function validateTripLifecycle(trip,shift=null){
  if(!trip||typeof trip!=='object')throw new TypeError('Trip is required');
  if(trip.scope!=='BUSINESS'&&trip.scope!=='PERSONAL')throw new RangeError('Trip scope must be BUSINESS or PERSONAL');
  const start=timestamp(trip.start_at,'trip start');
  const end=timestamp(trip.end_at,'trip end');
  if(end<start)throw new RangeError('Trip end cannot precede trip start');
  validateWorkOdometer(Number(trip.end_odometer),Number(trip.start_odometer));
  if(!shift||typeof shift!=='object')throw new TypeError('A closed business shift context is required');
  const shiftStart=timestamp(shift.start_at,'shift start');
  const shiftEnd=timestamp(shift.end_at,'shift end');
  if(shiftEnd<shiftStart)throw new RangeError('Shift end cannot precede shift start');
  if(trip.scope==='BUSINESS'){
    if(start<shiftStart||end>shiftEnd)throw new RangeError('Business trip must remain within its business shift');
  }else{
    if(shift.status!=='CLOSED')throw new RangeError('Personal trip requires a closed business shift');
    if(start<shiftEnd)throw new RangeError('Personal trip can start only after the business shift is closed');
  }
  return true;
}

export function calculateTrip(trip,shift){
  validateTripLifecycle(trip,shift);
  return result({tripKm:Number(trip.end_odometer)-Number(trip.start_odometer),scope:trip.scope,startOdometer:Number(trip.start_odometer),endOdometer:Number(trip.end_odometer),startAt:trip.start_at,endAt:trip.end_at,businessDate:trip.scope==='BUSINESS'?(shift.business_date||shift.start_at?.slice(0,10)):null},DATA.ACTUAL,[trip.id,shift.id]);
}
