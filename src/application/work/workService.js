import { ShiftTripRepository } from '../../repositories/shiftTripRepository.js'
import { LocationRepository } from '../../repositories/locationRepository.js'
import { completeEndShift } from './endShift.js'
import { recordFuelEntry } from './fuel.js'

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
  async getLocations(entityType, entityId) {
    return LocationRepository.forEntity(entityType, entityId)
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

export const WorkReadService = WorkService
