import { application, actions } from '../../../js/app.js';

export function createKfePresentationApi({ app = application, commandActions = actions } = {}) {
  if (!app || typeof app !== 'object') throw new TypeError('KFE application is required.');

  const getWorkScreenState = async (...args) => {
    const value = typeof app.getWorkScreenState === 'function'
      ? await app.getWorkScreenState(...args)
      : app.work && typeof app.work.getWorkScreenState === 'function'
        ? await app.work.getWorkScreenState(...args)
        : app.work && typeof app.work.state === 'function'
          ? await app.work.state(...args)
          : null;
    if (value == null) throw new TypeError('KFE work state read model is unavailable.');
    const state = typeof value === 'string' ? value : value.state;
    if (!state) throw new TypeError('KFE work state read model is invalid.');
    return state === 'DAY_START' ? 'SHIFT_WAITING' : state;
  };

  const getActiveShift = async (...args) => {
    if (app.work && typeof app.work.currentContext === 'function') {
      const context = await app.work.currentContext(...args);
      return context?.shift ?? null;
    }
    throw new TypeError('KFE active shift read model is unavailable.');
  };

  const getActiveTripDraft = async (...args) => {
    const cached = app.activeTripDraft && typeof app.activeTripDraft.read === 'function'
      ? await app.activeTripDraft.read(...args)
      : null;
    if (app.work && typeof app.work.currentContext === 'function') {
      const context = await app.work.currentContext(...args);
      const trip = context?.trip ?? null;
      if (!trip) return null;
      if (cached?.trip_id && cached.trip_id !== trip.id) return null;
      return cached && cached.trip_id === trip.id
        ? cached
        : { trip_id: trip.id, trip_type: String(trip.trip_type || trip.scope || '').toUpperCase(), shift_id: trip.shift_id ?? null, business_date: trip.business_date ?? null, start_odometer_km: Number(trip.start_odometer), started_at: trip.started_at ?? null };
    }
    return cached;
  };

  const startShift = async (...args) => {
    const payload = args[0] || {};
    if (app.work && typeof app.work.startShift === 'function') {
      if (typeof app.work.currentContext === 'function' && typeof app.work.startDay === 'function') {
        const context = await app.work.currentContext();
        if (!context?.day) {
          const odometer = Number(payload.startOdometer);
          if (!Number.isFinite(odometer) || odometer < 0) throw new RangeError('A valid start odometer is required');
          await app.work.startDay({ odometer });
        }
      }
      return app.work.startShift(...args);
    }
    if (typeof app.startShift === 'function') return app.startShift(...args);
    throw new TypeError('KFE shift start command is unavailable.');
  };

  const startTrip = async (...args) => {
    const payload = args[0] || {};
    const type = String(payload.trip_type || payload.tripType || '').toUpperCase();
    if (type === 'BUSINESS' && typeof app.work?.currentContext === 'function' && typeof app.work?.startDay === 'function') {
      const context = await app.work.currentContext();
      if (!context?.day) {
        const odometer = Number(payload.start_odometer_km ?? payload.odometer);
        if (!Number.isFinite(odometer) || odometer < 0) throw new RangeError('A valid start odometer is required');
        await app.work.startDay({ odometer });
      }
    }
    return app.startTrip(...args);
  };

  const endShift = (...args) => {
    if (app.work && typeof app.work.endShift === 'function') return app.work.endShift(...args);
    if (typeof app.endShift === 'function') return app.endShift(...args);
    throw new TypeError('KFE shift end command is unavailable.');
  };
  const endDay = (...args) => {
    if (app.work && typeof app.work.endDay === 'function') return app.work.endDay(...args);
    if (typeof app.endDay === 'function') return app.endDay(...args);
    throw new TypeError('KFE day end command is unavailable.');
  };
  const getWorkSummary = (...args) => {
    if (app.work && typeof app.work.workSummary === 'function') return app.work.workSummary(...args);
    if (typeof app.workSummary === 'function') return app.workSummary(...args);
    throw new TypeError('KFE work summary read model is unavailable.');
  };
  const getCompletedShiftSummary = async (...args) => {
    const model = await app.getPerformance(...args);
    if (!model || typeof model.getCompletedShiftSummary !== 'function') throw new TypeError('KFE completed shift summary read model is unavailable.');
    return model.getCompletedShiftSummary();
  };
  const getDailyOperationalReport = async (...args) => {
    const model = await app.getPerformance(...args);
    if (!model || typeof model.getDailyOperationalReport !== 'function') throw new TypeError('KFE daily operational report read model is unavailable.');
    return model.getDailyOperationalReport();
  };

  const read = {
    getPerformance: (...args) => app.getPerformance(...args), listFuel: (...args) => app.listFuel(...args), getAdminState: (...args) => app.getAdminState(...args),
    getLoanReadModel: (...args) => app.getLoanReadModel(...args), getSettings: (...args) => app.getSettings(...args), getWorkScreenState,
    getActiveTripDraft, getActiveShift, getWorkSummary, getCompletedShiftSummary, getDailyOperationalReport, latestWorkOdometer: (...args) => app.latestWorkOdometer(...args),
  };
  const commands = {
    recordExpense: (...args) => app.recordExpense(...args), recordRevenue: (...args) => app.recordRevenue(...args), recordMaintenance: (...args) => app.recordMaintenance(...args), recordCompliance: (...args) => app.recordCompliance(...args),
    recordFuel: (...args) => app.recordFuel(...args), updateFuel: (...args) => app.updateFuel(...args), undoFuel: (...args) => app.undoFuel(...args), recordHistoricalDay: (...args) => app.recordHistoricalDay(...args), recordHistoricalFuel: (...args) => app.recordHistoricalFuel(...args),
    createLoan: (...args) => app.createLoan(...args), recordLoanPayment: (...args) => app.recordLoanPayment(...args), setTheme: (...args) => app.setTheme(...args), exportBackup: (...args) => app.exportBackup(...args), restoreBackup: (...args) => app.restoreBackup(...args), resetAllData: (...args) => app.resetAllData(...args),
    saveHistoricalCorrection: (...args) => app.saveHistoricalCorrection(...args), startTrip, endTrip: (...args) => app.endTrip(...args), startShift, endShift, endDay,
  };
  const administrator = Object.freeze({
    listVehicles: (...args) => app.administrator.listVehicles(...args), listAssignments: (...args) => app.administrator.listAssignments(...args), listDrivers: (...args) => app.administrator.listDrivers(...args), createVehicle: (...args) => app.administrator.createVehicle(...args), updateVehicle: (...args) => app.administrator.updateVehicle(...args), retireVehicle: (...args) => app.administrator.retireVehicle(...args), sellVehicle: (...args) => app.administrator.sellVehicle(...args), createDriver: (...args) => app.administrator.createDriver(...args), updateDriver: (...args) => app.administrator.updateDriver(...args), assignDriver: (...args) => app.administrator.assignDriver(...args), endAssignment: (...args) => app.administrator.endAssignment(...args), deactivateDriver: (...args) => app.administrator.deactivateDriver(...args),
  });
  const fixedExpenses = Object.freeze({ list: (...args) => app.fixedExpenses.list(...args), create: (...args) => app.fixedExpenses.create(...args), update: (...args) => app.fixedExpenses.update(...args), activate: (...args) => app.fixedExpenses.activate(...args), deactivate: (...args) => app.fixedExpenses.deactivate(...args) });
  const dispatch = (...args) => commandActions.dispatch(...args);
  return Object.freeze({ version: '1.0.0', read: Object.freeze(read), commands: Object.freeze(commands), administrator, fixedExpenses, dispatch, getPerformance: read.getPerformance, listFuel: read.listFuel, getAdminState: read.getAdminState, getLoanReadModel: read.getLoanReadModel, getSettings: read.getSettings, getWorkScreenState: read.getWorkScreenState, getActiveTripDraft: read.getActiveTripDraft, getActiveShift: read.getActiveShift, getWorkSummary: read.getWorkSummary, getCompletedShiftSummary: read.getCompletedShiftSummary, getDailyOperationalReport: read.getDailyOperationalReport, latestWorkOdometer: read.latestWorkOdometer, ...commands });
}

export const kfePresentationApi = createKfePresentationApi();
