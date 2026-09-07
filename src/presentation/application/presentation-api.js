import { application, actions } from '../../../js/app.js';

const ACTIVE_TRIP_DRAFT_KEY = 'kfe_active_trip_draft';
function readActiveTripDraft() { try { const raw = globalThis.localStorage?.getItem(ACTIVE_TRIP_DRAFT_KEY); if (!raw) return null; return JSON.parse(raw)?.active_trip || null; } catch { return null; } }
function writeActiveTripDraft(activeTrip) { globalThis.localStorage?.setItem(ACTIVE_TRIP_DRAFT_KEY, JSON.stringify({ active_trip: activeTrip })); }
function clearActiveTripDraft() { globalThis.localStorage?.removeItem(ACTIVE_TRIP_DRAFT_KEY); }
function tripBusinessDate(value = new Date()) { const date = new Date(value); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }

export function createKfePresentationApi({ app = application, commandActions = actions } = {}) {
  if (!app || typeof app !== 'object') throw new TypeError('KFE application is required.');

  async function startTrip(payload = {}) {
    const tripType = String(payload.trip_type || payload.tripType || '').toUpperCase();
    if (!['BUSINESS', 'PERSONAL'].includes(tripType)) throw new RangeError('Trip type must be BUSINESS or PERSONAL.');
    const startedAt = payload.started_at || new Date().toISOString();
    const businessDate = payload.business_date || tripBusinessDate(startedAt);
    const startOdometerKm = Number(payload.start_odometer_km ?? payload.odometer);
    if (!Number.isFinite(startOdometerKm) || startOdometerKm < 0) throw new RangeError('Trip start odometer must be valid.');
    const activeTrip = { trip_id: payload.trip_id || `trp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, trip_type: tripType, shift_id: tripType === 'BUSINESS' ? (payload.shift_id || null) : null, business_date: businessDate, start_odometer_km: startOdometerKm, started_at: startedAt };
    writeActiveTripDraft(activeTrip);
    try {
      const result = tripType === 'BUSINESS'
        ? await app.startBusinessTrip({ startOdometer: startOdometerKm, startedAt, businessDate, shiftId: activeTrip.shift_id, actionMode: payload.actionMode || 'SWIPE', direction: payload.direction || 'RIGHT' })
        : await app.startPersonalTrip({ odometer: startOdometerKm, prefilledOdometer: payload.prefilledOdometer ?? null, businessKm: payload.businessKm || 0, personalKm: payload.personalKm || 0, startedAt, businessDate, actionMode: payload.actionMode || 'SWIPE', direction: payload.direction || 'LEFT' });
      const tripId = result?.id || activeTrip.trip_id;
      if (tripType === 'BUSINESS' && typeof app.updateTrip === 'function' && result?.id) await app.updateTrip(result.id, { start_odometer: startOdometerKm, started_at: startedAt, business_date: businessDate, shift_id: activeTrip.shift_id, trip_type: 'BUSINESS' });
      writeActiveTripDraft({ ...activeTrip, trip_id: tripId });
      return result;
    } catch (error) { clearActiveTripDraft(); throw error; }
  }

  async function endTrip(payload = {}) {
    const draft = readActiveTripDraft();
    const tripType = String(payload.trip_type || payload.tripType || draft?.trip_type || '').toUpperCase();
    const tripId = payload.trip_id || payload.id || draft?.trip_id;
    const endOdometerKm = Number(payload.end_odometer_km ?? payload.endOdometer);
    if (!tripId) throw new Error('Active trip id is required.');
    if (!Number.isFinite(endOdometerKm) || endOdometerKm < 0) throw new RangeError('Trip end odometer must be valid.');
    const startOdometerKm = Number(payload.start_odometer_km ?? draft?.start_odometer_km);
    if (Number.isFinite(startOdometerKm) && endOdometerKm < startOdometerKm) throw new RangeError('End odometer cannot be below the trip start odometer.');
    const endedAt = payload.ended_at || new Date().toISOString();
    const tripTotalKm = Number.isFinite(startOdometerKm) ? endOdometerKm - startOdometerKm : null;
    const result = tripType === 'BUSINESS'
      ? await app.endBusinessTrip({ id: tripId, endOdometer: endOdometerKm, tripTotalKm, endedAt, actionMode: payload.actionMode || 'SWIPE', direction: payload.direction || 'RIGHT' })
      : await app.endPersonalTrip({ id: tripId, endOdometer: endOdometerKm, tollPaise: payload.tollPaise || 0, parkingPaise: payload.parkingPaise || 0, endedAt, actionMode: payload.actionMode || 'SWIPE', direction: payload.direction || 'RIGHT' });
    if (tripType === 'BUSINESS' && typeof app.updateTrip === 'function') await app.updateTrip(tripId, { end_odometer: endOdometerKm, trip_total_km: tripTotalKm, ended_at: endedAt });
    clearActiveTripDraft();
    return result;
  }

  const read = {
    getWorkScreenState: (...args) => app.getWorkScreenState(...args),
    getWorkState: async (...args) => {
      try {
        const model = await app.getWorkScreenState(...args) || {};
        const shift = model.shift?.active ? model.shift : null;
        const localTrip = readActiveTripDraft();
        const trip = localTrip || (model.trip?.active ? { trip_id: model.trip.id, trip_type: model.trip.tripType || model.trip.trip_type || (model.trip.scope === 'PERSONAL' ? 'PERSONAL' : 'BUSINESS'), shift_id: model.trip.shiftId ?? model.trip.shift_id ?? null, business_date: model.trip.businessDate ?? model.trip.business_date ?? null, start_odometer_km: Number(model.trip.startOdometer ?? model.trip.start_odometer), started_at: model.trip.startedAt ?? model.trip.started_at } : null);
        const screenState = String(model.state || 'DAY_START');
        return { state: shift ? 'ACTIVE_SHIFT' : 'OFF_SHIFT', rehydrated: true, active_shift: shift ? { shift_id: shift.id, business_date: shift.businessDate ?? shift.business_date ?? null, started_at: shift.startedAt ?? shift.started_at ?? null, break_started_at: shift.breakStartedAt ?? shift.break_started_at ?? null, start_odometer_km: Number(shift.startOdometer ?? shift.start_odometer), previous_odometer_km: shift.previousOdometer == null && shift.previous_odometer_km == null ? null : Number(shift.previousOdometer ?? shift.previous_odometer_km) } : null, active_trip: trip, draft_keys_restored: trip ? [ACTIVE_TRIP_DRAFT_KEY] : [], state_source: trip ? 'LOCAL_STORAGE' : 'LOCAL_DB', screen_state: screenState, state_error: null };
      } catch (error) { return { state: 'OFF_SHIFT', rehydrated: true, active_shift: null, active_trip: null, draft_keys_restored: [], state_source: 'LOCAL_DB', screen_state: 'DAY_START', state_error: 'CORRUPTED', recovery_error: String(error?.message || error) }; }
    },
    getWorkSummary: (...args) => app.workSummary(...args), getPerformance: (...args) => app.getPerformance(...args), getTimeline: (...args) => app.getTimeline(...args), listFuel: (...args) => app.listFuel(...args), getAdminState: (...args) => app.getAdminState(...args), getLoanReadModel: (...args) => app.getLoanReadModel(...args), getSettings: (...args) => app.getSettings(...args),
  };
  const commands = {
    startDay: (...args) => app.startDay(...args), startShift: (...args) => app.startShift(...args), startTrip, endTrip, startBusinessTrip: (...args) => app.startBusinessTrip(...args), endBusinessTrip: (...args) => app.endBusinessTrip(...args), startPersonalTrip: (...args) => app.startPersonalTrip(...args), endPersonalTrip: (...args) => app.endPersonalTrip(...args), endDay: (...args) => app.endDay(...args), undoWorkAction: (...args) => app.undoWorkAction(...args), recordBreakMinutes: (...args) => app.recordBreakMinutes(...args), recordExpense: (...args) => app.recordExpense(...args), recordRevenue: (...args) => app.recordRevenue(...args), recordMaintenance: (...args) => app.recordMaintenance(...args), recordCompliance: (...args) => app.recordCompliance(...args), recordFuel: (...args) => app.recordFuel(...args), updateFuel: (...args) => app.updateFuel(...args), undoFuel: (...args) => app.undoFuel(...args), recordHistoricalDay: (...args) => app.recordHistoricalDay(...args), recordHistoricalFuel: (...args) => app.recordHistoricalFuel(...args), createLoan: (...args) => app.createLoan(...args), recordLoanPayment: (...args) => app.recordLoanPayment(...args), setTheme: (...args) => app.setTheme(...args), exportBackup: (...args) => app.exportBackup(...args), restoreBackup: (...args) => app.restoreBackup(...args), resetAllData: (...args) => app.resetAllData(...args), saveHistoricalCorrection: (...args) => app.saveHistoricalCorrection(...args),
  };
  const administrator = Object.freeze({ listVehicles: (...args) => app.administrator.listVehicles(...args), listAssignments: (...args) => app.administrator.listAssignments(...args), listDrivers: (...args) => app.administrator.listDrivers(...args), createVehicle: (...args) => app.administrator.createVehicle(...args), updateVehicle: (...args) => app.administrator.updateVehicle(...args), retireVehicle: (...args) => app.administrator.retireVehicle(...args), sellVehicle: (...args) => app.administrator.sellVehicle(...args), createDriver: (...args) => app.administrator.createDriver(...args), updateDriver: (...args) => app.administrator.updateDriver(...args), assignDriver: (...args) => app.administrator.assignDriver(...args), endAssignment: (...args) => app.administrator.endAssignment(...args), deactivateDriver: (...args) => app.administrator.deactivateDriver(...args) });
  const fixedExpenses = Object.freeze({ list: (...args) => app.fixedExpenses.list(...args), create: (...args) => app.fixedExpenses.create(...args), update: (...args) => app.fixedExpenses.update(...args), activate: (...args) => app.fixedExpenses.activate(...args), deactivate: (...args) => app.fixedExpenses.deactivate(...args) });
  const dispatch = (...args) => commandActions.dispatch(...args);
  return Object.freeze({ version: '1.0.0', read: Object.freeze(read), commands: Object.freeze(commands), administrator, fixedExpenses, dispatch, getWorkScreenState: read.getWorkScreenState, getWorkState: read.getWorkState, getWorkSummary: read.getWorkSummary, getPerformance: read.getPerformance, getTimeline: read.getTimeline, listFuel: read.listFuel, getAdminState: read.getAdminState, getLoanReadModel: read.getLoanReadModel, getSettings: read.getSettings, ...commands });
}
export const kfePresentationApi = createKfePresentationApi();
