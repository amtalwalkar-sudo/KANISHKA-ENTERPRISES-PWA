import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ShiftTripRepository } from '../repositories/shiftTripRepository.js'
import { LocationRepository } from '../repositories/locationRepository.js'
import { captureLifecycleLocation } from '../application/work/location.js'
import { completeEndShift } from '../application/work/endShift.js'

export const useShiftTripStore = defineStore('shiftTrip', () => {
  const shift = ref(null)
  const trip = ref(null)
  const registeredTrips = ref([])
  const completedTrips = ref([])
  const lifecycleLocations = ref([])
  const tripLocations = ref([])
  const lastKnownOdometer = ref(null)
  const defaultOperator = ref('Uber')
  const initialized = ref(false)

  const operators = ['Uber', 'One way', 'Rapido', 'Ola', 'Savaari']
  const isShiftActive = computed(() => shift.value?.status === 'ACTIVE')
  const isTripActive = computed(() => trip.value?.status === 'ACTIVE')
  const isOnline = isShiftActive
  const isFinancialDayActive = computed(() => isShiftActive.value && registeredTrips.value.length > 0)
  const headerShiftStatus = computed(() => isShiftActive.value ? 'ONLINE' : 'OFFLINE')
  const headerTripStatus = computed(() => isTripActive.value ? 'ON' : 'OFF')
  const startOdometer = computed(() => shift.value?.startOdometer ?? lastKnownOdometer.value)

  const loadLifecycleLocations = async () => {
    lifecycleLocations.value = shift.value ? await LocationRepository.forEntity('SHIFT', shift.value.id) : []
    tripLocations.value = trip.value ? await LocationRepository.forEntity('TRIP', trip.value.id) : []
  }

  const refresh = async () => {
    const active = await ShiftTripRepository.getActive()
    shift.value = active.shift
    trip.value = active.trip
    if (shift.value) {
      registeredTrips.value = await ShiftTripRepository.getTripsForShift(shift.value.id)
      completedTrips.value = registeredTrips.value.filter(item => item.status === 'COMPLETED')
    } else {
      registeredTrips.value = []
      completedTrips.value = []
    }
    const previous = await ShiftTripRepository.getLastCompletedShift()
    lastKnownOdometer.value = previous?.endOdometer ?? null
    const previousTrip = await ShiftTripRepository.getLastCompletedTrip()
    if (previousTrip?.operator && operators.includes(previousTrip.operator)) defaultOperator.value = previousTrip.operator
    await loadLifecycleLocations()
    initialized.value = true
  }

  const initialize = async () => { if (!initialized.value) await refresh() }

  const calculateGap = odo => {
    const current = Number(odo)
    const previous = Number(lastKnownOdometer.value)
    if (!Number.isFinite(current) || current <= 0) return { valid: false, reason: 'Enter a valid current odometer.' }
    if (!Number.isFinite(previous)) return { valid: true, gapKm: 0 }
    if (current < previous) return { valid: false, reason: 'Current odometer cannot be lower than the last recorded odometer.' }
    return { valid: true, gapKm: current - previous }
  }

  const startShift = async (odo, allocation = null) => {
    if (isShiftActive.value) return { ok: false, reason: 'A Shift is already active.' }
    const check = calculateGap(odo)
    if (!check.valid) return { ok: false, reason: check.reason }
    let personalKm = 0
    let deadKm = 0
    if (check.gapKm > 0) {
      personalKm = Number(allocation?.personalKm || 0)
      deadKm = Number(allocation?.deadKm || 0)
      if (personalKm < 0 || deadKm < 0 || personalKm + deadKm !== check.gapKm) return { ok: false, requiresGapAllocation: true, gapKm: check.gapKm }
    }
    const record = await ShiftTripRepository.createShift({ startOdometer: Number(odo), openingPersonalKm: personalKm, openingDeadKm: deadKm, openingPersonalToll: Number(allocation?.personalToll || 0), openingPersonalParking: Number(allocation?.personalParking || 0) })
    shift.value = record
    await refresh()
    void captureLifecycleLocation({ entityType: 'SHIFT', entityId: record.id, eventType: 'ONLINE' }).then(loadLifecycleLocations)
    return { ok: true }
  }

  const startTrip = async operator => {
    if (!isShiftActive.value) return { ok: false, reason: 'Go Online before starting a Trip.' }
    if (isTripActive.value) return { ok: false, reason: 'A Trip is already active.' }
    const selected = operators.includes(operator) ? operator : defaultOperator.value
    const record = await ShiftTripRepository.createTrip({ shiftId: shift.value.id, operator: selected })
    trip.value = record
    defaultOperator.value = selected
    registeredTrips.value = [...registeredTrips.value, record]
    void captureLifecycleLocation({ entityType: 'TRIP', entityId: record.id, eventType: 'START' }).then(loadLifecycleLocations)
    return { ok: true, trip: record }
  }

  const endTrip = async () => {
    if (!isTripActive.value) return false
    const tripId = trip.value.id
    await ShiftTripRepository.completeTrip({ id: tripId })
    await refresh()
    void captureLifecycleLocation({ entityType: 'TRIP', entityId: tripId, eventType: 'END' }).then(loadLifecycleLocations)
    return true
  }

  const cancelTrip = async ({ reason = 'DRIVER_MISTAKE', revenue = '' } = {}) => {
    if (!isTripActive.value) return false
    const tripId = trip.value.id
    await ShiftTripRepository.cancelTrip({ id: tripId, reason, revenue })
    await refresh()
    void captureLifecycleLocation({ entityType: 'TRIP', entityId: tripId, eventType: 'CANCELLED' }).then(loadLifecycleLocations)
    return true
  }

  const updateTrip = async data => { await ShiftTripRepository.updateTrip(data); await refresh(); return true }

  const endShift = async data => {
    if (!isShiftActive.value) return { ok: false, reason: 'No active Shift.' }
    if (isTripActive.value) return { ok: false, reason: 'Cannot go Offline while a Trip is active. End the active Trip first.' }
    const shiftId = shift.value.id
    const result = await completeEndShift({ shiftId, ...data })
    if (!result.ok) return result
    await refresh()
    void captureLifecycleLocation({ entityType: 'SHIFT', entityId: shiftId, eventType: 'OFFLINE' }).then(loadLifecycleLocations)
    return result
  }

  return { shift, trip, registeredTrips, completedTrips, lifecycleLocations, tripLocations, operators, defaultOperator, lastKnownOdometer, startOdometer, isShiftActive, isTripActive, isOnline, isFinancialDayActive, headerShiftStatus, headerTripStatus, initialize, refresh, calculateGap, startShift, startTrip, endTrip, cancelTrip, updateTrip, endShift }
})
