/** KFE 2.0 Phase 6 — secondary module navigation map. */
export const MORE_MODULES = Object.freeze({
  VEHICLE: ['Vehicle', 'Driver'],
  MONEY: ['Fuel', 'Expenses', 'Revenue', 'Loans'],
  'VEHICLE OPERATIONS': ['Maintenance', 'Compliance'],
  BUSINESS: ['Dashboard', 'Profitability'],
  SYSTEM: ['Settings'],
});

export function moduleGroup(name) {
  return Object.prototype.hasOwnProperty.call(MORE_MODULES, name)
    ? MORE_MODULES[name]
    : [];
}
