import { application, actions } from '../../../js/app.js';

/**
 * Stable presentation-facing capability boundary.
 * Shells consume this object instead of importing the application singleton directly.
 * Business rules and persistence remain owned by the application/domain layers.
 */
export function createKfePresentationApi({ app = application, commandActions = actions } = {}) {
  if (!app || typeof app !== 'object') throw new TypeError('KFE application is required.');

  const read = {
    getWorkScreenState: (...args) => app.getWorkScreenState(...args),
    getWorkState: async (...args) => {
      try {
        const model = await app.getWorkScreenState(...args) || {};
        const shift = model.shift?.active ? model.shift : null;
        const screenState = String(model.state || 'DAY_START');
        const state = shift ? 'ACTIVE_SHIFT' : 'OFF_SHIFT';
        let draftKeysRestored = [];
        try {
          const prefix = 'kfe:form-draft:v1:';
          for (let i = 0; i < localStorage.length; i += 1) {
            const key = localStorage.key(i);
            if (!key?.startsWith(prefix)) continue;
            const suffix = key.slice(prefix.length);
            const draftKey = suffix.includes('|') ? suffix.split('|').pop() : suffix;
            if (draftKey) draftKeysRestored.push(draftKey);
          }
        } catch { draftKeysRestored = []; }
        return {
          state,
          rehydrated: true,
          active_shift: shift ? {
            shift_id: shift.id,
            business_date: shift.businessDate ?? shift.business_date ?? null,
            started_at: shift.startedAt ?? shift.started_at ?? null,
            break_started_at: shift.breakStartedAt ?? shift.break_started_at ?? null,
            start_odometer_km: Number(shift.startOdometer ?? shift.start_odometer),
            previous_odometer_km: shift.previousOdometer == null && shift.previous_odometer_km == null ? null : Number(shift.previousOdometer ?? shift.previous_odometer_km),
            opening_cash_float_paise: Number(shift.openingCashFloatPaise ?? shift.opening_cash_float_paise ?? 0),
          } : null,
          draft_keys_restored: [...new Set(draftKeysRestored)],
          state_source: 'LOCAL_DB',
          screen_state: screenState,
          state_error: null,
        };
      } catch (error) {
        return { state: 'OFF_SHIFT', rehydrated: true, active_shift: null, draft_keys_restored: [], state_source: 'LOCAL_DB', screen_state: 'DAY_START', state_error: 'CORRUPTED', recovery_error: String(error?.message || error) };
      }
    },
    getWorkSummary: (...args) => app.workSummary(...args),
    getPerformance: (...args) => app.getPerformance(...args),
    getTimeline: (...args) => app.getTimeline(...args),
    listFuel: (...args) => app.listFuel(...args),
    getAdminState: (...args) => app.getAdminState(...args),
    getLoanReadModel: (...args) => app.getLoanReadModel(...args),
    getSettings: (...args) => app.getSettings(...args),
  };

  const commands = {
    startDay: (...args) => app.startDay(...args),
    startShift: (...args) => app.startShift(...args),
    endShift: (...args) => app.endShift(...args),
    startBusinessTrip: (...args) => app.startBusinessTrip(...args),
    endBusinessTrip: (...args) => app.endBusinessTrip(...args),
    startPersonalTrip: (...args) => app.startPersonalTrip(...args),
    endPersonalTrip: (...args) => app.endPersonalTrip(...args),
    endDay: (...args) => app.endDay(...args),
    undoWorkAction: (...args) => app.undoWorkAction(...args),
    recordBreakMinutes: (...args) => app.recordBreakMinutes(...args),
    recordExpense: (...args) => app.recordExpense(...args),
    recordRevenue: (...args) => app.recordRevenue(...args),
    recordMaintenance: (...args) => app.recordMaintenance(...args),
    recordCompliance: (...args) => app.recordCompliance(...args),
    recordFuel: (...args) => app.recordFuel(...args),
    updateFuel: (...args) => app.updateFuel(...args),
    undoFuel: (...args) => app.undoFuel(...args),
    recordHistoricalDay: (...args) => app.recordHistoricalDay(...args),
    recordHistoricalFuel: (...args) => app.recordHistoricalFuel(...args),
    createLoan: (...args) => app.createLoan(...args),
    recordLoanPayment: (...args) => app.recordLoanPayment(...args),
    setTheme: (...args) => app.setTheme(...args),
    exportBackup: (...args) => app.exportBackup(...args),
    restoreBackup: (...args) => app.restoreBackup(...args),
    resetAllData: (...args) => app.resetAllData(...args),
    saveHistoricalCorrection: (...args) => app.saveHistoricalCorrection(...args),
  };

  const administrator = Object.freeze({
    listVehicles: (...args) => app.administrator.listVehicles(...args),
    listAssignments: (...args) => app.administrator.listAssignments(...args),
    listDrivers: (...args) => app.administrator.listDrivers(...args),
    createVehicle: (...args) => app.administrator.createVehicle(...args),
    updateVehicle: (...args) => app.administrator.updateVehicle(...args),
    retireVehicle: (...args) => app.administrator.retireVehicle(...args),
    sellVehicle: (...args) => app.administrator.sellVehicle(...args),
    createDriver: (...args) => app.administrator.createDriver(...args),
    updateDriver: (...args) => app.administrator.updateDriver(...args),
    assignDriver: (...args) => app.administrator.assignDriver(...args),
    endAssignment: (...args) => app.administrator.endAssignment(...args),
    deactivateDriver: (...args) => app.administrator.deactivateDriver(...args),
  });

  const fixedExpenses = Object.freeze({
    list: (...args) => app.fixedExpenses.list(...args),
    create: (...args) => app.fixedExpenses.create(...args),
    update: (...args) => app.fixedExpenses.update(...args),
    activate: (...args) => app.fixedExpenses.activate(...args),
    deactivate: (...args) => app.fixedExpenses.deactivate(...args),
  });

  const dispatch = (...args) => commandActions.dispatch(...args);

  return Object.freeze({
    version: '1.0.0',
    read: Object.freeze(read),
    commands: Object.freeze(commands),
    administrator,
    fixedExpenses,
    dispatch,
    getWorkScreenState: read.getWorkScreenState,
    getWorkState: read.getWorkState,
    getWorkSummary: read.getWorkSummary,
    getPerformance: read.getPerformance,
    getTimeline: read.getTimeline,
    listFuel: read.listFuel,
    getAdminState: read.getAdminState,
    getLoanReadModel: read.getLoanReadModel,
    getSettings: read.getSettings,
    ...commands,
  });
}

export const kfePresentationApi = createKfePresentationApi();
