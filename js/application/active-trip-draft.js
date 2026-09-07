const KEY = 'kfe_active_trip_draft';

export function createActiveTripDraftStore(storage = globalThis.localStorage) {
  function read() {
    try { return JSON.parse(storage?.getItem(KEY) || 'null')?.active_trip || null; } catch { return null; }
  }
  function write(activeTrip) { storage?.setItem(KEY, JSON.stringify({ active_trip: activeTrip })); return activeTrip; }
  function clear() { storage?.removeItem(KEY); }
  return Object.freeze({ key: KEY, read, write, clear });
}
