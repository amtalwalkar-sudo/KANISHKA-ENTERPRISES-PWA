import { ShiftTripRepository } from '../../repositories/shiftTripRepository.js'
import { FuelRepository } from '../../repositories/fuelRepository.js'
import { LocationRepository } from '../../repositories/locationRepository.js'
import { captureLifecycleLocation } from './location.js'
import { completeEndShift } from './endShift.js'
import { recordFuelEntry } from './fuel.js'
import { validateShiftStartOdometer, validateGapAllocation } from '../../domain/work/shift.js'
import { calculateFuelQuantity } from '../../domain/work/fuel.js'

export const WorkService = Object.freeze({
  async getActiveState() {
    return ShiftTripRepository.getActive()
  },
  async getTripsForShift(shiftId) {
    return ShiftTripRepository.getTripsForShift(shiftId)
  },
  async getLastCompletedShift() {
    return ShiftTripRepository.getLastCompletedShift()
  },
  async getLastCompletedTrip() {
    return ShiftTripRepository.getLastCompletedTrip()
  },
  async getFuelLogs() {
    return FuelRepository.getAll()
  },
  async getLocations(entityType, entityId) {
    return LocationRepository.forEntity(entityType, entityId)
  },
  async captureLocation(data) {
    return captureLifecycleLocation(data)
  },
  validateShiftStartOdometer(currentOdometer, previousOdometer) {
    return validateShiftStartOdometer(currentOdometer, previousOdometer)
  },
  validateGapAllocation(gapKm, personalKm, deadKm) {
    return validateGapAllocation(gapKm, personalKm, deadKm)
  },
  calculateFuelQuantity(pricePerKg, amount) {
    return calculateFuelQuantity({ pricePerKg, amount })
  },
  async startShift(data) {
    return ShiftTripRepository.createShift(data)
  },
  async startTrip(data) {
    return ShiftTripRepository.createTrip(data)
  },
  async completeTrip(data) {
    return ShiftTripRepository.completeTrip(data)
  },
  async cancelTrip(data) {
    return ShiftTripRepository.cancelTrip(data)
  },
  async updateTrip(data) {
    return ShiftTripRepository.updateTrip(data)
  },
  async endShift(data) {
    return completeEndShift(data)
  },
  async recordFuel(data) {
    return recordFuelEntry(data)
  },
})
