import {createRecord, utcNow, softDeleteRecord} from '../core/record.js';
import {withIdempotency, createOperationId} from '../core/idempotency.js';
import {validateWorkOdometer} from '../domain/work.js';
import {deriveWorkScreenState, calculateOdometerDifference, validateKmAllocation, canStartDay, canStartShift, canStartBusinessTrip, canStartPersonalTrip, canEndShift, canEndDay} from '../domain/work-lifecycle.js';
import {validateTripLifecycle} from '../domain/trips.js';

function localDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new TypeError('Invalid date');
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function number(value, name) {
  const result = Number(value);
  if (!Number.isFinite(result)) throw new RangeError(`${name} must be a number`);
  return result;
}
function whole(value, name) {
  const result = number(value, name);
  if (!Number.isInteger(result)) throw new RangeError(`${name} must be a whole number`);
  return result;
}
function reading(value, name) {
  const result = number(value, name);
  if (result < 0) throw new RangeError(`${name} must not be negative`);
  return result;
}
function active(records) {
  return records.filter(record => !record.is_deleted && record.status !== 'CANCELLED');
}

export function createWorkApplication({repository, telemetry}) {
  const days = repository.entity('work_days');
  const shifts = repository.entity('work_sessions');
  const trips = repository.entity('rides');
  const allocations = repository.entity('odometer_allocations');
  const revenues = repository.entity('revenue_records');

  async function latestOdometer() {
    const [dayRows, shiftRows, tripRows] = await Promise.all([days.list(), shifts.list(), trips.list()]);
    const candidates = [];
    for (const day of active(dayRows)) {
      if (Number.isFinite(Number(day.start_odometer))) candidates.push({at: day.started_at, odometer: Number(day.start_odometer)});
    }
    for (const shift of active(shiftRows)) {
      if (Number.isFinite(Number(shift.end_odometer)) && shift.ended_at) candidates.push({at: shift.ended_at, odometer: Number(shift.end_odometer)});
      else if (Number.isFinite(Number(shift.start_odometer)) && shift.started_at) candidates.push({at: shift.started_at, odometer: Number(shift.start_odometer)});
    }
    for (const trip of active(tripRows)) {
      if (trip.scope !== 'PERSONAL') continue;
      if (Number.isFinite(Number(trip.end_odometer)) && trip.ended_at) candidates.push({at: trip.ended_at, odometer: Number(trip.end_odometer)});
      else if (Number.isFinite(Number(trip.start_odometer)) && trip.started_at) candidates.push({at: trip.started_at, odometer: Number(trip.start_odometer)});
    }
    candidates.sort((a, b) => Date.parse(String(b.at || '')) - Date.parse(String(a.at || '')));
    return candidates[0] || null;
  }

  async function currentContext(businessDate = localDate()) {
    const [dayRows, shiftRows, tripRows, revenueRows] = await Promise.all([days.list(), shifts.list(), trips.list(), revenues.list()]);
    const day = active(dayRows).find(row => row.business_date === businessDate && row.status === 'OPEN') || active(dayRows).find(row => row.business_date === businessDate && row.status === 'COMPLETED') || null;
    const shift = active(shiftRows).filter(row => row.scope === 'BUSINESS' && row.business_date === businessDate && row.status === 'OPEN').sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at))[0] || null;
    const trip = active(tripRows).filter(row => row.status === 'OPEN').sort((a, b) => Date.parse(b.started_at || b.start_at) - Date.parse(a.started_at || a.start_at))[0] || null;
    const todayBusinessTrips = active(tripRows).filter(row => row.scope === 'BUSINESS' && String(row.business_date || '') === businessDate && row.status === 'COMPLETED').length;
    const todayRevenuePaise = active(revenueRows).filter(row => row.scope === 'BUSINESS' && String(row.business_date || '') === businessDate).reduce((sum, row) => sum + Number(row.amount_paise || 0), 0);
    return {day, shift, trip, todayBusinessTrips, todayRevenuePaise, latest: await latestOdometer()};
  }

  async function state() {
    const context = await currentContext(localDate());
    return deriveWorkScreenState({day: context.day, shift: context.shift, trip: context.trip, latestOdometer: context.latest?.odometer, todayBusinessTrips: context.todayBusinessTrips, todayRevenuePaise: context.todayRevenuePaise});
  }

  async function telemetryEvent(eventType, entityType, entityId, options = {}) {
    return telemetry?.recordEvent({eventType, entityType, entityId, actionMode: options.actionMode || 'SWIPE', direction: options.direction ?? null, occurredAt: options.occurredAt, context: {business_date: localDate()}}) || null;
  }

  async function syncTracking() {
    const screen = await state();
    telemetry?.setActive(Boolean(screen.day.status === 'OPEN' || screen.shift.active || screen.trip.active));
    return screen;
  }

  async function startDay({odometer, prefilledOdometer = null, businessKm = 0, personalKm = 0, actionMode = 'SWIPE', direction = 'RIGHT'} = {}, operationId = createOperationId()) {
    return withIdempotency(repository, operationId, async () => {
      const occurredAt = utcNow();
      const businessDate = localDate();
      const context = await currentContext(businessDate);
      if (!canStartDay(context)) throw new Error('Day cannot be started while another operational session is active');
      const current = whole(odometer, 'Start odometer');
      if (prefilledOdometer != null) validateWorkOdometer(current, Number(prefilledOdometer));
      const difference = calculateOdometerDifference(prefilledOdometer, current).difference;
      validateKmAllocation(difference, {businessKm, personalKm});
      const day = createRecord({business_date: businessDate, started_at: occurredAt, ended_at: null, start_odometer: current, status: 'OPEN', entry_source: 'LIVE'});
      repository.assertRecord(day);
      const allocation = difference ? createRecord({context: 'DAY_START', reference_id: day.id, prefilled_odometer: Number(prefilledOdometer), current_odometer: current, difference_km: difference, business_km: Number(businessKm), personal_km: Number(personalKm), occurred_at: occurredAt}) : null;
      await repository.atomic(allocation ? ['work_days', 'odometer_allocations'] : ['work_days'], stores => { stores.work_days.put(day); if (allocation) stores.odometer_allocations.put(allocation); return true; });
      await telemetryEvent('START_DAY', 'WORK_DAY', day.id, {actionMode, direction, occurredAt});
      await syncTracking();
      return day;
    });
  }

  async function startShift({startOdometer = null, actionMode = 'SWIPE', direction = 'RIGHT'} = {}, operationId = createOperationId()) {
    return withIdempotency(repository, operationId, async () => {
      const occurredAt = utcNow();
      const businessDate = localDate();
      const context = await currentContext(businessDate);
      if (!canStartShift(context)) throw new Error('Shift can only start from the day-ready state');
      if (context.latest == null) throw new Error('Start day odometer is required before starting a shift');
      const current = startOdometer == null ? Number(context.latest.odometer) : whole(startOdometer, 'Shift start odometer');
      validateWorkOdometer(current, Number(context.latest.odometer));
      const shift = createRecord({business_date: businessDate, scope: 'BUSINESS', status: 'OPEN', started_at: occurredAt, ended_at: null, start_odometer: current, end_odometer: null, trip_count: 0, toll_paise: 0, parking_paise: 0, toll_included_in_fare: false, parking_included_in_fare: false});
      repository.assertRecord(shift);
      await repository.atomic(['work_sessions'], stores => { stores.work_sessions.put(shift); return shift; });
      await telemetryEvent('START_SHIFT', 'WORK_SESSION', shift.id, {actionMode, direction, occurredAt});
      await syncTracking();
      return shift;
    });
  }

  async function startBusinessTrip({startOdometer, startedAt = null, businessDate = null, shiftId = null, actionMode = 'SWIPE', direction = 'RIGHT'} = {}, operationId = createOperationId()) {
    return withIdempotency(repository, operationId, async () => {
      const occurredAt = startedAt || utcNow();
      const date = businessDate || localDate(occurredAt);
      const context = await currentContext(date);
      if (!canStartBusinessTrip(context)) throw new Error('Business trip can only start while a shift is active and no trip is active');
      if (shiftId && context.shift?.id !== shiftId) throw new Error('Business trip shift context does not match the active shift');
      const start = reading(startOdometer ?? context.latest?.odometer, 'Start odometer');
      if (context.latest) validateWorkOdometer(start, Number(context.latest.odometer));
      const trip = createRecord({scope: 'BUSINESS', trip_type: 'BUSINESS', shift_id: context.shift.id, status: 'OPEN', started_at: occurredAt, ended_at: null, duration_seconds: null, business_date: date, start_odometer: start, end_odometer: null, toll_paise: 0, parking_paise: 0});
      repository.assertRecord(trip);
      await repository.atomic(['rides'], stores => { stores.rides.put(trip); return trip; });
      await telemetryEvent('START_TRIP', 'BUSINESS_TRIP', trip.id, {actionMode, direction, occurredAt});
      await syncTracking();
      return trip;
    });
  }

  async function startPersonalTrip({odometer, prefilledOdometer = null, businessKm = 0, personalKm = 0, startedAt = null, businessDate = null, actionMode = 'SWIPE', direction = 'LEFT'} = {}, operationId = createOperationId()) {
    return withIdempotency(repository, operationId, async () => {
      const occurredAt = startedAt || utcNow();
      const date = businessDate || localDate(occurredAt);
      const context = await currentContext(date);
      if (!canStartPersonalTrip(context)) throw new Error('Personal trip can only start when no business shift or trip is active');
      const current = reading(odometer, 'Start odometer');
      if (prefilledOdometer != null) validateWorkOdometer(current, Number(prefilledOdometer));
      const difference = calculateOdometerDifference(prefilledOdometer, current).difference;
      validateKmAllocation(difference, {businessKm, personalKm});
      const trip = createRecord({scope: 'PERSONAL', trip_type: 'PERSONAL', shift_id: null, status: 'OPEN', started_at: occurredAt, ended_at: null, duration_seconds: null, business_date: date, start_odometer: current, end_odometer: null, toll_paise: 0, parking_paise: 0});
      repository.assertRecord(trip);
      const allocation = difference ? createRecord({context: 'PERSONAL_TRIP_START', reference_id: trip.id, prefilled_odometer: Number(prefilledOdometer), current_odometer: current, difference_km: difference, business_km: Number(businessKm), personal_km: Number(personalKm), occurred_at: occurredAt}) : null;
      await repository.atomic(allocation ? ['rides', 'odometer_allocations'] : ['rides'], stores => { stores.rides.put(trip); if (allocation) stores.odometer_allocations.put(allocation); return true; });
      await telemetryEvent('START_PERSONAL_TRIP', 'PERSONAL_TRIP', trip.id, {actionMode, direction, occurredAt});
      await syncTracking();
      return trip;
    });
  }

  async function endBusinessTrip({id, endOdometer, tripTotalKm = null, endedAt = null, actionMode = 'SWIPE', direction = 'RIGHT'} = {}, operationId = createOperationId()) {
    return withIdempotency(repository, operationId, async () => {
      const existing = await trips.get(id);
      if (!existing || existing.scope !== 'BUSINESS' || existing.status !== 'OPEN') throw new Error('Business trip is not active');
      const shift = await shifts.get(existing.shift_id);
      if (!shift || shift.status !== 'OPEN') throw new Error('Business trip must belong to the active shift');
      const occurredAt = endedAt || utcNow();
      const end = reading(endOdometer, 'End odometer');
      validateWorkOdometer(end, Number(existing.start_odometer));
      const duration = Math.max(0, Math.floor((Date.parse(occurredAt) - Date.parse(existing.started_at)) / 1000));
      const total = tripTotalKm == null ? end - Number(existing.start_odometer) : whole(tripTotalKm, 'Trip total km');
      const updated = await trips.update(existing, {status: 'COMPLETED', ended_at: occurredAt, duration_seconds: duration, end_odometer: end, trip_total_km: total});
      validateTripLifecycle(updated, shift);
      await telemetryEvent('END_TRIP', 'BUSINESS_TRIP', updated.id, {actionMode, direction, occurredAt});
      await syncTracking();
      return updated;
    });
  }

  async function endPersonalTrip({id, endOdometer, tollPaise = 0, parkingPaise = 0, endedAt = null, actionMode = 'SWIPE', direction = 'RIGHT'} = {}, operationId = createOperationId()) {
    return withIdempotency(repository, operationId, async () => {
      const existing = await trips.get(id);
      if (!existing || existing.scope !== 'PERSONAL' || existing.status !== 'OPEN') throw new Error('Personal trip is not active');
      const end = reading(endOdometer, 'End odometer');
      validateWorkOdometer(end, Number(existing.start_odometer));
      const occurredAt = endedAt || utcNow();
      const duration = Math.max(0, Math.floor((Date.parse(occurredAt) - Date.parse(existing.started_at)) / 1000));
      const updated = await trips.update(existing, {status: 'COMPLETED', ended_at: occurredAt, duration_seconds: duration, end_odometer: end, toll_paise: Math.max(0, whole(tollPaise, 'Toll')), parking_paise: Math.max(0, whole(parkingPaise, 'Parking'))});
      validateTripLifecycle(updated, null);
      await telemetryEvent('END_PERSONAL_TRIP', 'PERSONAL_TRIP', updated.id, {actionMode, direction, occurredAt});
      await syncTracking();
      return updated;
    });
  }

  async function endShift({id, endOdometer, revenuePaise = 0, tollPaise = 0, parkingPaise = 0, tollIncludedInFare = false, parkingIncludedInFare = false, actionMode = 'SWIPE', direction = 'RIGHT'} = {}, operationId = createOperationId()) {
    return withIdempotency(repository, operationId, async () => {
      const existing = await shifts.get(id);
      if (!existing || existing.scope !== 'BUSINESS' || existing.status !== 'OPEN') throw new Error('Shift is not active');
      const context = await currentContext(existing.business_date || localDate());
      if (!canEndShift(context) || context.shift?.id !== id) throw new Error('Shift can only end while waiting for a ride');
      const revenue = whole(revenuePaise, 'Revenue');
      if (revenue < 0) throw new RangeError('Revenue must not be negative');
      const end = whole(endOdometer, 'End odometer');
      validateWorkOdometer(end, Number(existing.start_odometer));
      const occurredAt = utcNow();
      const tripRows = active(await trips.list()).filter(row => row.scope === 'BUSINESS' && row.shift_id === id && row.status === 'COMPLETED');
      const updated = repository.updateRecord(existing, {status: 'COMPLETED', ended_at: occurredAt, end_odometer: end, toll_paise: Math.max(0, whole(tollPaise, 'Toll')), parking_paise: Math.max(0, whole(parkingPaise, 'Parking')), toll_included_in_fare: Boolean(tollIncludedInFare), parking_included_in_fare: Boolean(parkingIncludedInFare), trip_count: tripRows.length});
      const revenueRecord = createRecord({work_session_id: id, amount_paise: revenue, scope: 'BUSINESS', business_date: existing.business_date, recorded_at: occurredAt, entry_source: 'SHIFT_CLOSURE'});
      await repository.atomic(['work_sessions', 'revenue_records'], stores => { stores.work_sessions.put(updated); stores.revenue_records.put(revenueRecord); return true; });
      await telemetryEvent('END_SHIFT', 'WORK_SESSION', updated.id, {actionMode, direction, occurredAt});
      await syncTracking();
      return updated;
    });
  }

  async function endDay({actionMode = 'SWIPE', direction = 'RIGHT'} = {}, operationId = createOperationId()) {
    return withIdempotency(repository, operationId, async () => {
      const businessDate = localDate();
      const context = await currentContext(businessDate);
      if (!canEndDay(context)) throw new Error('Day can only end when no shift or trip is active');
      const occurredAt = utcNow();
      const updated = await days.update(context.day, {status: 'COMPLETED', ended_at: occurredAt});
      await telemetryEvent('END_DAY', 'WORK_DAY', updated.id, {actionMode, direction, occurredAt});
      await syncTracking();
      return updated;
    });
  }

  async function undo(action = {}, operationId = createOperationId()) {
    return withIdempotency(repository, operationId, async () => {
      const {type, id} = action;
      const occurredAt = utcNow();
      if (!type || !id) throw new Error('Undo action is incomplete');
      let updated = null;
      if (type === 'START_DAY') {
        const day = await days.get(id);
        const context = await currentContext(day?.business_date || localDate());
        if (!day || context.shift || context.trip) throw new Error('Cannot undo day start while another operational session is active');
        const rows = active(await allocations.list()).filter(row => row.reference_id === id);
        updated = await days.update(day, {status: 'CANCELLED', ended_at: occurredAt});
        for (const row of rows) await allocations.softDelete(row);
      } else if (type === 'END_DAY') {
        const day = await days.get(id);
        if (!day || day.status !== 'COMPLETED') throw new Error('Day is not closed');
        updated = await days.update(day, {status: 'OPEN', ended_at: null});
      } else if (type === 'START_SHIFT') {
        const shift = await shifts.get(id);
        const context = await currentContext(shift?.business_date || localDate());
        if (!shift || context.trip) throw new Error('Cannot undo shift start while a trip is active');
        updated = await shifts.update(shift, {status: 'CANCELLED', ended_at: occurredAt});
      } else if (type === 'END_SHIFT') {
        const shift = await shifts.get(id);
        if (!shift || shift.status !== 'COMPLETED') throw new Error('Shift is not closed');
        const revenueRows = active(await revenues.list()).filter(row => row.work_session_id === id && row.entry_source === 'SHIFT_CLOSURE');
        updated = repository.updateRecord(shift, {status: 'OPEN', ended_at: null, end_odometer: null, toll_paise: 0, parking_paise: 0, toll_included_in_fare: false, parking_included_in_fare: false});
        await repository.atomic(['work_sessions', 'revenue_records'], stores => { stores.work_sessions.put(updated); for (const row of revenueRows) stores.revenue_records.put(softDeleteRecord(row)); return true; });
      } else if (type === 'START_TRIP' || type === 'START_PERSONAL_TRIP') {
        const trip = await trips.get(id);
        if (!trip || trip.status !== 'OPEN') throw new Error('Trip is not active');
        const rows = active(await allocations.list()).filter(row => row.reference_id === id);
        updated = await trips.update(trip, {status: 'CANCELLED', ended_at: occurredAt});
        for (const row of rows) await allocations.softDelete(row);
      } else if (type === 'END_TRIP' || type === 'END_PERSONAL_TRIP') {
        const trip = await trips.get(id);
        if (!trip || trip.status !== 'COMPLETED') throw new Error('Trip is not completed');
        updated = await trips.update(trip, {status: 'OPEN', ended_at: null, duration_seconds: null, end_odometer: null, toll_paise: 0, parking_paise: 0});
      } else {
        throw new Error(`Unsupported undo action: ${type}`);
      }
      await telemetryEvent(`UNDO_${type}`, updated.scope || 'WORK', updated.id, {actionMode: 'BUTTON', occurredAt});
      await syncTracking();
      return updated;
    });
  }

  async function summary() {
    const businessDate = localDate();
    const [dayRows, shiftRows, tripRows, revenueRows, allocationRows] = await Promise.all([days.list(), shifts.list(), trips.list(), revenues.list(), allocations.list()]);
    const day = active(dayRows).find(row => row.business_date === businessDate) || null;
    const shiftsToday = active(shiftRows).filter(row => row.business_date === businessDate && row.scope === 'BUSINESS');
    const tripsToday = active(tripRows).filter(row => row.business_date === businessDate && row.scope === 'BUSINESS' && row.status === 'COMPLETED');
    const revenuePaise = active(revenueRows).filter(row => row.business_date === businessDate && row.scope === 'BUSINESS').reduce((sum, row) => sum + Number(row.amount_paise || 0), 0);
    const shiftSeconds = shiftsToday.reduce((sum, row) => row.started_at && row.ended_at ? sum + Math.max(0, Math.floor((Date.parse(row.ended_at) - Date.parse(row.started_at)) / 1000)) : sum, 0);
    const latest = await latestOdometer();
    const startOdometer = day?.start_odometer == null ? null : Number(day.start_odometer);
    const latestValue = latest?.odometer == null ? null : Number(latest.odometer);
    const kmsRun = startOdometer != null && latestValue != null ? Math.max(0, latestValue - startOdometer) : null;
    const businessAllocatedKm = active(allocationRows).filter(row => row.context === 'DAY_START' && row.reference_id === day?.id).reduce((sum, row) => sum + Number(row.business_km || 0), 0);
    const deadKms = kmsRun == null ? null : Math.max(0, kmsRun - businessAllocatedKm);
    return Object.freeze({businessDate, day, shiftCount: shiftsToday.filter(row => row.status === 'COMPLETED').length, tripCount: tripsToday.length, revenuePaise, shiftSeconds, kmsRun, deadKms, targetPaise: null});
  }

  return Object.freeze({state, startDay, startShift, startBusinessTrip, startPersonalTrip, endBusinessTrip, endPersonalTrip, endShift, endDay, undo, summary, latestOdometer});
}
