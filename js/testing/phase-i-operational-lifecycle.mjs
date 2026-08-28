import assert from 'node:assert/strict';
import {calculateWorkSession,businessDateFromShiftStart} from '../domain/work.js';
import {calculateTrip,validateTripLifecycle} from '../domain/trips.js';

const shift={id:'shift-1',scope:'BUSINESS',status:'CLOSED',start_at:'2026-08-28T23:00:00+05:30',end_at:'2026-08-29T02:00:00+05:30',start_odometer:1000,end_odometer:1120,business_date:'2026-08-28'};

assert.equal(businessDateFromShiftStart(shift.start_at),'2026-08-28');
assert.equal(calculateWorkSession(shift).value.businessDate,'2026-08-28');
assert.equal(calculateWorkSession(shift).value.workKm,120);

const businessTrip={id:'trip-business',scope:'BUSINESS',start_at:'2026-08-28T23:10:00+05:30',end_at:'2026-08-29T01:30:00+05:30',start_odometer:1000,end_odometer:1080};
assert.equal(calculateTrip(businessTrip,shift).value.tripKm,80);
assert.equal(calculateTrip(businessTrip,shift).value.businessDate,'2026-08-28');

const personalTrip={id:'trip-personal',scope:'PERSONAL',start_at:'2026-08-29T02:05:00+05:30',end_at:'2026-08-29T02:35:00+05:30',start_odometer:1120,end_odometer:1130};
const personal=calculateTrip(personalTrip,shift);
assert.equal(personal.value.tripKm,10);
assert.equal(personal.value.businessDate,null);

assert.throws(()=>validateTripLifecycle({...businessTrip,start_at:'2026-08-28T22:50:00+05:30'},shift),/within its business shift/);
assert.throws(()=>validateTripLifecycle({...personalTrip,start_at:'2026-08-29T01:50:00+05:30'},shift),/only after the business shift is closed/);
assert.throws(()=>validateTripLifecycle({...businessTrip,end_odometer:999},shift),/Odometer cannot decrease/);

const secondShift={...shift,id:'shift-2',start_at:'2026-08-29T09:00:00+05:30',end_at:'2026-08-29T13:00:00+05:30',start_odometer:1130,end_odometer:1210,business_date:'2026-08-29'};
assert.equal(calculateWorkSession(secondShift).value.businessDate,'2026-08-29');
assert.equal(calculateWorkSession(secondShift).value.workKm,80);

console.log('KFE Phase I operational lifecycle: PASS');
