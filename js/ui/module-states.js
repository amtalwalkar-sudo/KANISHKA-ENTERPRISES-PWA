/** KFE 2.0 Phase 6 — common module UI states. */
export const MODULE_STATES = Object.freeze([
  'normal',
  'empty',
  'loading',
  'error',
  'offline',
  'saving',
  'saved',
  'validation',
  'no-data',
]);

export function isModuleState(value) {
  return MODULE_STATES.includes(value);
}
