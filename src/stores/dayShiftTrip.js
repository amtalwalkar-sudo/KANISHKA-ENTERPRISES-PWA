import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { DayShiftTripRepository } from '../repositories/dayShiftTripRepository.js'
import { GpsSnapshotRepository } from '../repositories/gpsSnapshotRepository.js'
import { MovementArtifactRepository } from '../repositories/movementArtifactRepository.js'
import { LocationService } from '../services/locationService.js'
import { ShiftValidator } from '../services/shiftValidator.js'
import { MovementAccountingService } from '../services/movementAccountingService.js'
import { RevenueReconciliationService } from '../services/revenueReconciliationService.js'
import { InterShiftOdometerGapService } from '../services/interShiftOdometerGapService.js'
import { TripNotificationService } from '../services/tripNotificationService.js'
import { resolveLocationName } from '../services/locationNameService.js'
import { DiagnosticService } from '../services/diagnosticService.js'

const locationWithin = async (ms = 1200) => Promise.race([LocationService.captureLocation(), new Promise(resolve => setTimeout(() => resolve(null), ms))])
const persistShiftSnapshot = (shiftId, event = 'PERIODIC', periodic = true) => async location => { if (location && shiftId) await GpsSnapshotRepository.create({ entityType: 'SHIFT', entityId: shiftId, event, location, periodic }) }

export const useDayShiftTripStore = defineStore('dayShiftTrip', () => {
  const day = ref(null), shift = ref(null), trip = ref(null), interShiftGap = ref(null), initialized = ref(false), reconciliationTrips = ref([]), movementReconciliation = ref(null), revenueReconciliation = ref(null)
  let routingEngine = null; let locationNameResolver = null
  const isDayOnline = computed(() => day.value?.status === 'ACTIVE'), isShiftActive = computed(() => shift.value?.status === 'ACTIVE'), isTripActive = computed(() => trip.value?.status === 'ACTIVE')
  const headerShiftStatus = computed(() => isShiftActive.value ? 'ON' : 'OFF'), headerTripStatus = computed(() => isTripActive.value ? 'ON' : 'OFF')
  const configureRoutingEngine = engine => { if (!engine || typeof engine.routeTrace !== 'function') throw new Error('A compatible Routing Engine is required.'); routingEngine = engine }
  const configureLocationNameResolver = resolver => { if (!resolver || typeof resolver.resolve !== 'function') throw new Error('A compatible Location Name Resolver is required.'); locationNameResolver = resolver }
  const enrichLocation = async location => { if (!location) return null; const name = await resolveLocationName(location, locationNameResolver); return name ? { ...location, name } : location }
  const startShiftGps = shiftId => { LocationService.startActiveShiftSnapshots(persistShiftSnapshot(shiftId)); return true }
  const stopShiftGps = () => LocationService.stopActiveShiftSnapshots()
  const refresh = async () => { const a = await DayShiftTripRepository.getActive(); day.value = a.day; shift.value = a.shift; trip.value = a.trip; interShiftGap.value = shift.value ? await DayShiftTripRepository.getOpenInterShiftGap(shift.value.id) : null; reconciliationTrips.value = shift.value ? await DayShiftTripRepository.getCompletedTripsForShift(shift.value.id) : []; initialized.value = true; if (shift.value) startShiftGps(shift.value.id); else stopShiftGps() }
  const tag = async (type, id, event) => { const location = await locationWithin(); if (location) void GpsSnapshotRepository.create({ entityType: type, entityId: id, event, location, periodic: false }); return location }
  const startDay = async () => { if (isDayOnline.value) return false; const r = await DayShiftTripRepository.createDay({}); day.value = r; void tag('DAY', r.id, 'DAY_START'); return true }
  const endDay = async () => { if (!isDayOnline.value) return false; if (isTripActive.value || isShiftActive.value) { alert('End the active Trip and Shift before ending the Day.'); return false } if (!day.value.hasCompletedBusinessTrip) { alert('A financial Day requires at least one completed Business Trip.'); return false } void tag('DAY', day.value.id, 'DAY_END'); await DayShiftTripRepository.endDay(day.value.id); await refresh(); return true }
  const startShift = async odo => { if (!isDayOnline.value) await startDay(); if (isShiftActive.value) { alert('A Shift is already active.'); return false } const n = Number(odo); if (!Number.isFinite(n) || n <= 0) { alert('Please enter a valid positive Start Odometer reading.'); return false } const previous = await DayShiftTripRepository.getLastCompletedShift(); let gap = null; if (previous) { try { const gapKm = InterShiftOdometerGapService.calculate(previous.endOdometer, n); if (gapKm > 0) gap = { previousShiftId: previous.id, previousShiftEndOdometer: Number(previous.endOdometer), currentShiftStartOdometer: n, gapKm } } catch (error) { alert(error.message); return false } } const r = await DayShiftTripRepository.createShift({ dayId: day.value.id, startOdometer: n }); shift.value = r; if (gap) interShiftGap.value = await DayShiftTripRepository.createInterShiftGap({ ...gap, currentShiftId: r.id }); const location = await locationWithin(); if (location) void GpsSnapshotRepository.create({ entityType: 'SHIFT', entityId: r.id, event: 'SHIFT_START', location, periodic: false }); LocationService.setState('WAITING'); startShiftGps(r.id); void TripNotificationService.showReady(); return true }
  const captureShiftEndLocation = async () => locationWithin(5000)
  const allocateInterShiftGap = async allocation => { if (!interShiftGap.value) return false; const v = InterShiftOdometerGapService.validateAllocation({ gapKm: interShiftGap.value.gapKm, ...allocation }); if (!v.valid) { alert(v.error); return false } await DayShiftTripRepository.allocateInterShiftGap({ id: interShiftGap.value.id, ...v.values }); interShiftGap.value = null; return true }
  const endShift = async (odo, revenue, garageLocation = null) => {
    DiagnosticService.start('END SHIFT')
    if (!isShiftActive.value) { DiagnosticService.error('Validate active Shift', new Error('No active Shift.')); return false }
    if (isTripActive.value) { DiagnosticService.error('Validate active Trip', new Error('End the active Trip before ending the Shift.')); alert('End the active Trip before ending the Shift.'); return false }
    DiagnosticService.checkpoint('Validate Shift submission')
    const v = ShiftValidator.validateSubmission({ startOdometer: shift.value.startOdometer, endOdometer: odo, revenue })
    if (!v.valid) { DiagnosticService.error('Validate Shift submission', new Error(v.errors[0])); alert(v.errors[0]); return false }
    const id = shift.value.id
    try {
      if (garageLocation) { DiagnosticService.waiting('Save SHIFT_END GPS'); await GpsSnapshotRepository.create({ entityType: 'SHIFT', entityId: id, event: 'SHIFT_END', location: garageLocation, periodic: false }); DiagnosticService.checkpoint('Save SHIFT_END GPS') }
      DiagnosticService.waiting('Load completed Trips'); const trips = await DayShiftTripRepository.getCompletedTripsForShift(id); DiagnosticService.checkpoint('Load completed Trips', `${trips.length} completed trip(s)`)
      DiagnosticService.waiting('Load GPS snapshots'); const gpsSnapshots = await GpsSnapshotRepository.getForEntity(id); DiagnosticService.checkpoint('Load GPS snapshots', `${gpsSnapshots.length} snapshot(s)`)
      const manualBusinessKmByTripId = Object.fromEntries(trips.filter(t => t.uberBusinessKmAuthority === 'MANUAL_UBER' && t.uberBusinessKm !== null).map(t => [t.id, t.uberBusinessKm]))
      let reconciliation
      try { DiagnosticService.waiting('Movement reconciliation'); reconciliation = await MovementAccountingService.reconcileShiftMovement({ garageLocation, trips, startOdometer: shift.value.startOdometer, endOdometer: v.values.endOdometer, manualBusinessKmByTripId, gpsSnapshots, router: routingEngine }); DiagnosticService.checkpoint('Movement reconciliation') } catch (error) { DiagnosticService.error('Movement reconciliation', error); alert(`Movement reconciliation could not be completed: ${error.message}`); return false }
      let revenueResult
      try { DiagnosticService.waiting('Revenue reconciliation'); revenueResult = RevenueReconciliationService.reconcileShiftRevenue({ shiftRevenue: v.values.revenue, trips }); DiagnosticService.checkpoint('Revenue reconciliation') } catch (error) { DiagnosticService.error('Revenue reconciliation', error); alert(`Revenue reconciliation could not be completed: ${error.message}`); return false }
      try { DiagnosticService.waiting('Save movement artifact'); await MovementArtifactRepository.create({ shiftId: id, generatedAt: new Date().toISOString(), segments: reconciliation.segments, gpsTracePoints: reconciliation.gpsTracePoints, routing: { provenance: reconciliation.routingProvenance, geometry: reconciliation.roadMatchedGeometry, traceGeometry: reconciliation.traceGeometry } }); DiagnosticService.checkpoint('Save movement artifact') } catch (error) { DiagnosticService.error('Save movement artifact', error); alert(`Movement artifact could not be persisted: ${error.message}`); return false }
      DiagnosticService.checkpoint('Stop Shift GPS'); stopShiftGps()
      DiagnosticService.waiting('Persist completed Shift'); await DayShiftTripRepository.endShift({ id, endOdometer: v.values.endOdometer, revenue: v.values.revenue, businessKm: reconciliation.businessMilesKm, deadKm: reconciliation.deadMilesKm, unclassifiedKm: reconciliation.unclassifiedKm, movementReconciliation: reconciliation, movementReconciliationStatus: reconciliation.reconciliationStatus, revenueReconciliation: revenueResult }); DiagnosticService.checkpoint('Persist completed Shift')
      DiagnosticService.waiting('Clear notifications'); await TripNotificationService.clear(); DiagnosticService.checkpoint('Clear notifications')
      movementReconciliation.value = reconciliation; revenueReconciliation.value = revenueResult
      DiagnosticService.waiting('Refresh active state'); await refresh(); DiagnosticService.complete('END SHIFT', 'Shift reconciliation completed')
      return true
    } catch (error) {
      DiagnosticService.error('END SHIFT', error)
      throw error
    }
  }
  const startTrip = async () => { if (!isShiftActive.value) { alert('Start a Shift before starting a Trip.'); return false } if (isTripActive.value) { alert('A Trip is already active.'); return false } const location = await enrichLocation(await locationWithin()); const r = await DayShiftTripRepository.createTrip({ dayId: day.value.id, shiftId: shift.value.id, tripStartLocation: location }); trip.value = r; LocationService.setState('TRIP_ACTIVE'); if (location) void GpsSnapshotRepository.create({ entityType: 'TRIP', entityId: r.id, event: 'TRIP_START', location, periodic: false }); void TripNotificationService.showTripActive(r.tripStartAt); return true }
  const endTrip = async () => { if (!isTripActive.value) return false; const id = trip.value.id; const location = await enrichLocation(await locationWithin()); await DayShiftTripRepository.endTrip({ id, tripEndLocation: location }); if (location) void GpsSnapshotRepository.create({ entityType: 'TRIP', entityId: id, event: 'TRIP_END', location, periodic: false }); LocationService.setState('BETWEEN_TRIPS_STATIONARY'); void TripNotificationService.showReady(); await refresh(); return true }
  const recordMissedTrip = async (startAt, endAt) => { if (!isShiftActive.value) { alert('Start a Shift before recording a missed Trip.'); return false } if (isTripActive.value) { alert('End the active Trip first.'); return false } const start = new Date(startAt), end = new Date(endAt); if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) { alert('Enter valid Trip start and end times.'); return false } const location = await enrichLocation(await locationWithin()); const r = await DayShiftTripRepository.createTrip({ dayId: day.value.id, shiftId: shift.value.id, tripStartAt: start.toISOString(), tripStartLocation: location }); await DayShiftTripRepository.endTrip({ id: r.id, tripEndAt: end.toISOString(), tripEndLocation: null }); await refresh(); return true }
  const openUberReconciliation = async () => { if (!shift.value) return false; reconciliationTrips.value = await DayShiftTripRepository.getCompletedTripsForShift(shift.value.id); return true }
  const saveUberReconciliation = async entries => { if (!shift.value) return false; for (const entry of entries) { const payload = { id: entry.id }; if (entry.uberBusinessKm !== '' && entry.uberBusinessKm !== null && entry.uberBusinessKm !== undefined) payload.uberBusinessKm = entry.uberBusinessKm; if (entry.uberRevenue !== '' && entry.uberRevenue !== null && entry.uberRevenue !== undefined) payload.uberRevenue = entry.uberRevenue; if (payload.uberBusinessKm !== undefined || payload.uberRevenue !== undefined) await DayShiftTripRepository.updateTripReconciliation(payload) } reconciliationTrips.value = await DayShiftTripRepository.getCompletedTripsForShift(shift.value.id); return true }
  const calculateDeadMiles = async (garageLocation, router = routingEngine) => { const trips = await DayShiftTripRepository.getCompletedTrips(day.value?.id); return MovementAccountingService.calculateDeadMiles({ garageLocation, trips, router }) }
  const initialize = async () => { if (!initialized.value) await refresh() }
  return { day, shift, trip, interShiftGap, reconciliationTrips, movementReconciliation, revenueReconciliation, initialized, isDayOnline, isShiftActive, isTripActive, headerShiftStatus, headerTripStatus, initialize, refresh, configureRoutingEngine, configureLocationNameResolver, startDay, endDay, startShift, captureShiftEndLocation, allocateInterShiftGap, endShift, startTrip, endTrip, recordMissedTrip, openUberReconciliation, saveUberReconciliation, calculateDeadMiles }
})
