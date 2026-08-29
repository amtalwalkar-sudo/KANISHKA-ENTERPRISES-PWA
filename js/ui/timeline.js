/** KFE 2.0 Phase 6 — timeline presentation helpers.
 * Presentation-only: preserves authoritative event identity and chronology.
 */

export const TIMELINE_EVENT_TYPES = Object.freeze([
  'Day Start', 'Shift Start', 'Ride Start', 'Pause', 'Resume', 'Ride End',
  'Shift End', 'Personal Trip Start', 'Personal Trip End', 'Fuel', 'Maintenance',
  'Toll', 'Parking', 'Other', 'Day End',
]);

export function normalizeTimelineEvent(event = {}) {
  return Object.freeze({
    id: event.id ?? null,
    type: event.type ?? 'Other',
    occurredAt: event.occurredAt ?? null,
    recordedAt: event.recordedAt ?? null,
    description: event.description ?? '',
    amount: event.amount ?? null,
    odometer: event.odometer ?? null,
    workDayId: event.workDayId ?? null,
    shiftId: event.shiftId ?? null,
    rideId: event.rideId ?? null,
    locationName: event.locationName ?? null,
    gpsAvailable: Boolean(event.gpsAvailable),
  });
}

export function projectTimeline(events = []) {
  return events
    .map(normalizeTimelineEvent)
    .sort((a, b) => {
      const left = a.occurredAt ? Date.parse(a.occurredAt) : Number.POSITIVE_INFINITY;
      const right = b.occurredAt ? Date.parse(b.occurredAt) : Number.POSITIVE_INFINITY;
      return left - right;
    });
}
