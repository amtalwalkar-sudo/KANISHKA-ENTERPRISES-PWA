import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ShiftTripRepository } from '../repositories/shiftTripRepository.js'
import { completeEndShift } from '../application/work/endShift.js'

export const useShiftTripStore = defineStore('shiftTrip', () => {
  const shift = ref(null)
  const trip = ref(null)
  const completedTrips = ref([])
  const lastKnownOdometer = ref(null)
  const defaultOperator = ref('Uber')
  const initialized = ref(false)

  const operators = ['Uber', 'One way', 'Rapido', 'Ola', 'Savaari']
  const isShiftActive = computed(() => shift.value?.status === 'ACTIVE')
  const isTripActive = computed(() => trip.value?.status === 'ACTIVE')
  const isOnline = isShiftActive
  const isFinancialDayActive = computed(() => isShiftActive.value && completedTrips.value.length > 0)
  const headerShiftStatus = computed(() => isShiftActive.value ? 'ONLINE' : 'OFFLINE')
  const headerTripStatus = computed(() => isTripActive.value ? 'ON' : 'OFF')
  const startOdometer = computed(() => shift.value?.startOdometer ?? lastKnownOdometer.value)

  const refresh = async () => {
    const active = await ShiftTripRepository.getActive()
    shift.value = active.shift
    trip.value = active.trip
    if (shift.value) completedTrips.value = await ShiftTripRepository.getCompletedTripsForShift(shift.value.id)
    else completedTrips.value = []
    const previous = await ShiftTripRepository.getLastCompletedShift()
    lastKnownOdometer.value = previous?.endOdometer ?? null
    const previousTrip = await ShiftTripRepository.getLastCompletedTrip()
    if (previousTrip?.operator && operators.includes(previousTrip.operator)) defaultOperator.value = previousTrip.operator
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
    if (check.gapKm > 0) {
      const personal = Number(allocation?.personalKm || 0)
      const dead = Number(allocation?.deadKm || 0)
      if (personal < 0 || dead < 0 || personal + dead !== check.gapKm) return { ok: false, requiresGapAllocation: true, gapKm: check.gapKm }
    }
    const record = await ShiftTripRepository.createShift({ startOdometer: Number(odo) })
    shift.value = record
    await refresh()
    return { ok: true }
  }

  const startTrip = async operator => {
    if (!isShiftActive.value) return { ok: false, reason: 'Go Online before starting a Trip.' }
    if (isTripActive.value) return { ok: false, reason: 'A Trip is already active.' }
    const selected = operators.includes(operator) ? operator : defaultOperator.value
    const record = await ShiftTripRepository.createTrip({ shiftId: shift.value.id, operator: selected })
    trip.value = record
    defaultOperator.value = selected
    return { ok: true, trip: record }
  }

  const endTrip = async () => {
    if (!isTripActive.value) return false
    await ShiftTripRepository.completeTrip({ id: trip.value.id })
    await refresh()
    return true
  }

  const cancelTrip = async () => {
    if (!isTripActive.value) return false
    await ShiftTripRepository.cancelTrip(trip.value.id)
    await refresh()
    return true
  }

  const updateTrip = async data => {
    await ShiftTripRepository.updateTrip(data)
    await refresh()
    return true
  }

  const endShift = async data => {
    if (!isShiftActive.value) return { ok: false, reason: 'No active Shift.' }
    if (isTripActive.value) return { ok: false, reason: 'End the active Trip before going Offline.' }
    const result = await completeEndShift({ shiftId: shift.value.id, ...data })
    if (!result.ok) return result
    await refresh()
    return result
  }

  return { shift, trip, completedTrips, operators, defaultOperator, lastKnownOdometer, startOdometer, isShiftActive, isTripActive, isOnline, isFinancialDayActive, headerShiftStatus, headerTripStatus, initialize, refresh, calculateGap, startShift, startTrip, endTrip, cancelTrip, updateTrip, endShift }
})
