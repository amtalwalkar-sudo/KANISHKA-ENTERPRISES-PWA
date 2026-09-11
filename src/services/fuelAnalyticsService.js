import { ShiftRepository } from '../repositories/shiftRepository'
import { FuelRepository } from '../repositories/fuelRepository'

const toFiniteNonNegativeNumber = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const getVehicleDistance = (shift) => {
  const startOdometer = Number(shift?.startOdometer)
  const endOdometer = Number(shift?.endOdometer)

  // Canonical Phase 4 distance semantics: vehicle movement is the odometer delta.
  if (Number.isFinite(startOdometer) && Number.isFinite(endOdometer)) {
    const delta = endOdometer - startOdometer
    return delta > 0 ? delta : 0
  }

  // Compatibility fallback for older persisted shift records that only expose
  // totalDistance. This value is accepted only after explicit numeric sanitation.
  return toFiniteNonNegativeNumber(shift?.totalDistance)
}

export const FuelAnalyticsService = {
  /**
   * Calculates lifetime fuel efficiency and financial metrics.
   * Pure calculation layer — non-mutative, safe against empty or invalid datasets.
   */
  async getPerformanceMetrics() {
    const shifts = await ShiftRepository.getAll()
    const fuelLogs = await FuelRepository.getAll()

    const safeShifts = Array.isArray(shifts) ? shifts : []
    const safeFuelLogs = Array.isArray(fuelLogs) ? fuelLogs : []

    const totalDistance = safeShifts.reduce(
      (acc, shift) => acc + getVehicleDistance(shift),
      0
    )

    const totalRevenue = safeShifts.reduce(
      (acc, shift) => acc + toFiniteNonNegativeNumber(shift?.revenue),
      0
    )

    const totalFuelQty = safeFuelLogs.reduce(
      (acc, fuelLog) => acc + toFiniteNonNegativeNumber(fuelLog?.quantity),
      0
    )

    const totalFuelCost = safeFuelLogs.reduce((acc, fuelLog) => {
      const totalCost = toFiniteNonNegativeNumber(fuelLog?.totalCost)
      const cost = toFiniteNonNegativeNumber(fuelLog?.cost)
      return acc + (totalCost || cost)
    }, 0)

    const efficiencyKmPerUnit = totalFuelQty > 0 ? totalDistance / totalFuelQty : 0
    const fuelCostPerKm = totalDistance > 0 ? totalFuelCost / totalDistance : 0
    const netRevenue = totalRevenue - totalFuelCost
    const netProfitPerKm = totalDistance > 0 ? netRevenue / totalDistance : 0

    return {
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalFuelQty: Math.round(totalFuelQty * 100) / 100,
      totalFuelCost: Math.round(totalFuelCost * 100) / 100,
      netRevenue: Math.round(netRevenue * 100) / 100,
      efficiencyKmPerUnit: Math.round(efficiencyKmPerUnit * 100) / 100,
      fuelCostPerKm: Math.round(fuelCostPerKm * 100) / 100,
      netProfitPerKm: Math.round(netProfitPerKm * 100) / 100,
      shiftCount: safeShifts.length,
      fuelLogCount: safeFuelLogs.length
    }
  }
}
