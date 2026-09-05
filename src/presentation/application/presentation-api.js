import { application, actions, backup } from '../../../js/app.js';

/**
 * Stable presentation-facing capability boundary.
 * Shells consume this object instead of importing the application singleton directly.
 * Business rules and persistence remain owned by the application/domain layers.
 */
export function createKfePresentationApi({ app = application, commandActions = actions, backupEngine = backup } = {}) {
  if (!app || typeof app !== 'object') throw new TypeError('KFE application is required.');
  if (!backupEngine || typeof backupEngine !== 'object') throw new TypeError('KFE backup engine is required.');

  const read = {
    getWorkScreenState: (...args) => app.getWorkScreenState(...args),
    getPerformance: (...args) => app.getPerformance(...args),
    getTimeline: (...args) => app.getTimeline(...args),
    listFuel: (...args) => app.listFuel(...args),
    getAdminState: (...args) => app.getAdminState(...args),
    getLoanReadModel: (...args) => app.getLoanReadModel(...args),
    getSettings: (...args) => app.getSettings(...args),
    getBackupStatus: (...args) => backupEngine.getStatus(...args),
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
    exportBackup: (...args) => backupEngine.createPortableBackup(...args),
    restoreBackup: (...args) => backupEngine.restorePackage(...args),
    exportPortableBackupFile: (...args) => backupEngine.exportPortableFile(...args),
    restorePortableBackupText: (...args) => backupEngine.restorePortableText(...args),
    refreshLocalBackup: (...args) => backupEngine.refreshLocal(...args),
    resetAllData: async (...args) => { backupEngine.stop?.(); return app.resetAllData(...args); },
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

  const backupApi = Object.freeze({
    status: (...args) => backupEngine.getStatus(...args),
    refreshLocal: (...args) => backupEngine.refreshLocal(...args),
    createPortableBackup: (...args) => backupEngine.createPortableBackup(...args),
    exportPortableFile: (...args) => backupEngine.exportPortableFile(...args),
    restorePackage: (...args) => backupEngine.restorePackage(...args),
    restorePortableText: (...args) => backupEngine.restorePortableText(...args),
    cloud: Object.freeze({
      list: (...args) => backupEngine.listCloud(...args),
      get: (...args) => backupEngine.getCloud(...args),
      remove: (...args) => backupEngine.removeCloud(...args),
    }),
  });

  const dispatch = (...args) => commandActions.dispatch(...args);

  return Object.freeze({
    version: '1.1.0',
    read: Object.freeze(read),
    commands: Object.freeze(commands),
    backup: backupApi,
    administrator,
    fixedExpenses,
    dispatch,
    getWorkScreenState: read.getWorkScreenState,
    getPerformance: read.getPerformance,
    getTimeline: read.getTimeline,
    listFuel: read.listFuel,
    getAdminState: read.getAdminState,
    getLoanReadModel: read.getLoanReadModel,
    getSettings: read.getSettings,
    getBackupStatus: read.getBackupStatus,
    ...commands,
  });
}

export const kfePresentationApi = createKfePresentationApi();
