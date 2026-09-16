import { ShiftTripRepository } from '../../repositories/shiftTripRepository.js'
import { FuelRepository } from '../../repositories/fuelRepository.js'
import { LocationRepository } from '../../repositories/locationRepository.js'
import { captureLifecycleLocation } from './location.js'
import { completeEndShift } from './endShift.js'
import { recordFuelEntry } from './fuel.js'
import { validateShiftStartOdometer, validateGapAllocation } from '../../domain/work/shift.js'
import { calculateFuelQuantity } from '../../domain/work/fuel.js'
import { WORK_TRIP_OPERATORS, validateTripOperator, validateTripCorrection } from '../../domain/work/trip.js'

export const WorkService = Object.freeze({
  getTripOperators() { return WORK_TRIP_OPERATORS },
  validateTripOperator(operator) { return validateTripOperator(operator) },
  validateTripCorrection(data) { return validateTripCorrection(data) },
  async getActiveState() { return ShiftTripRepository.getActive() },
  async getTripsForShift(shiftId) { return ShiftTripRepository.getTripsForShift(shiftId) },
  async getLastCompletedShift() { return ShiftTripRepository.getLastCompletedShift() },
  async getLastCompletedTrip() { return ShiftTripRepository.getLastCompletedTrip() },
  async getFuelLogs() { return FuelRepository.getAll() },
  async getLocations(entityType, entityId) { return LocationRepository.forEntity(entityType, entityId) },
  async captureLocation(data) { return captureLifecycleLocation(data) },
  validateShiftStartOdometer(currentOdometer, previousOdometer) { return validateShiftStartOdometer(currentOdometer, previousOdometer) },
  validateGapAllocation(gapKm, personalKm, deadKm) { return validateGapAllocation(gapKm, personalKm, deadKm) },
  calculateFuelQuantity(pricePerKg, amount) { return calculateFuelQuantity({ pricePerKg, amount }) },
  async startShift(data) { return ShiftTripRepository.createShift(data) },
  async startTrip(data) {
    const validation = validateTripOperator(data?.operator)
    if (!validation.valid) return { ok: false, reason: validation.reason }
    return ShiftTripRepository.createTrip({ ...data, operator: validation.operator })
  },
  async completeTrip(data) { return ShiftTripRepository.completeTrip(data) },
  async cancelTrip(data) { return ShiftTripRepository.cancelTrip(data) },
  async updateTrip(data) {
    const validation = validateTripCorrection(data)
    if (!validation.valid) return { ok: false, reason: validation.reason }
    return ShiftTripRepository.updateTrip({ ...data, ...validation })
  },
  async endShift(data) { return completeEndShift(data) },
  async recordFuel(data) { return recordFuelEntry(data) },
})
