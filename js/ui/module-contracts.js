/** KFE 2.0 Phase 6 — shared module presentation contracts.
 * Presentation only: no business calculations or persistence.
 */
export const MODULE_CONTRACTS = Object.freeze({
  vehicle: {
    title: 'Vehicle',
    lifecycle: ['Acquisition Date', 'Retirement Date'],
    history: 'Common Timeline',
  },
  driver: {
    title: 'Driver',
    flow: ['Driver attached to vehicle'],
    analytics: false,
  },
  compliance: {
    title: 'Compliance',
    flow: ['Renewal Type', 'Cost', 'Validity Start', 'Validity End', 'Save'],
    history: true,
  },
  settings: {
    title: 'Settings',
    flow: ['System preferences', 'Device/offline status'],
  },
});

export function moduleContract(name) {
  return MODULE_CONTRACTS[name] ?? null;
}
