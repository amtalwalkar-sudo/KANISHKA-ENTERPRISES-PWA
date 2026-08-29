export const CONFLICT_STATES = Object.freeze({
  NONE: 'NONE',
  DETECTED: 'DETECTED',
  REVIEW: 'REVIEW',
  RESOLVED: 'RESOLVED',
  DISMISSED: 'DISMISSED',
});

export function createConflictState({ entityType, entityId, local, remote, detectedAt = new Date().toISOString() } = {}) {
  if (!entityType || !entityId) throw new Error('Conflict entity identity is required');
  return Object.freeze({
    state: CONFLICT_STATES.DETECTED,
    entityType: String(entityType),
    entityId: String(entityId),
    detectedAt,
    local,
    remote,
  });
}

export function reviewConflict(conflict) {
  if (!conflict || conflict.state !== CONFLICT_STATES.DETECTED) throw new Error('Conflict must be detected before review');
  return Object.freeze({ ...conflict, state: CONFLICT_STATES.REVIEW });
}

export function resolveConflict(conflict, resolution) {
  if (!conflict || conflict.state !== CONFLICT_STATES.REVIEW) throw new Error('Conflict must be in review before resolution');
  if (!resolution || !['local', 'remote', 'merged'].includes(resolution.strategy)) throw new Error('Conflict resolution strategy is required');
  return Object.freeze({ ...conflict, state: CONFLICT_STATES.RESOLVED, resolution });
}

export function dismissConflict(conflict, reason = '') {
  if (!conflict || ![CONFLICT_STATES.DETECTED, CONFLICT_STATES.REVIEW].includes(conflict.state)) throw new Error('Conflict cannot be dismissed from its current state');
  return Object.freeze({ ...conflict, state: CONFLICT_STATES.DISMISSED, dismissalReason: String(reason) });
}
