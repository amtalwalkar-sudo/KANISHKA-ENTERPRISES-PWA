import { OdoGapRepository, ODO_GAP_CATEGORIES } from '../repositories/odoGapRepository'
import { ShiftRepository } from '../repositories/shiftRepository'

const toFiniteNonNegative = (value) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0
}

export const calculateMileageAccounting = (shifts = [], gaps = []) => {
  const recordedShiftDistance = shifts.reduce(
    (total, shift) => total + toFiniteNonNegative(shift.totalDistance ?? (Number(shift.endOdometer) - Number(shift.startOdometer))),
    0
  )

  const normalizedGaps = gaps.map((gap) => ({
    ...gap,
    gapDistance: toFiniteNonNegative(gap.gapDistance),
    category: gap.category || null
  }))

  const interShiftDistance = normalizedGaps.reduce((total, gap) => total + gap.gapDistance, 0)
  const deadMiles = normalizedGaps
    .filter((gap) => gap.category === ODO_GAP_CATEGORIES.DEAD_MILES)
    .reduce((total, gap) => total + gap.gapDistance, 0)
  const personalTrips = normalizedGaps
    .filter((gap) => gap.category === ODO_GAP_CATEGORIES.PERSONAL_TRIPS)
    .reduce((total, gap) => total + gap.gapDistance, 0)
  const unclassifiedKm = normalizedGaps
    .filter((gap) => !gap.category)
    .reduce((total, gap) => total + gap.gapDistance, 0)

  return {
    recordedShiftDistance,
    interShiftDistance,
    deadMiles,
    personalTrips,
    unclassifiedKm,
    totalVehicleDistance: recordedShiftDistance + interShiftDistance,
    reconciledInterShiftDistance: deadMiles + personalTrips,
    gapCount: normalizedGaps.length,
    unclassifiedGapCount: normalizedGaps.filter((gap) => !gap.category).length
  }
}

export const MileageAccountingService = {
  async getMileageAccounting() {
    const [shifts, gaps] = await Promise.all([
      ShiftRepository.getAll(),
      OdoGapRepository.getAll()
    ])

    return calculateMileageAccounting(shifts, gaps)
  },

  async classifyGap(gapId, category) {
    return OdoGapRepository.classify(gapId, category)
  },

  async getUnclassifiedGaps() {
    const gaps = await OdoGapRepository.getAll()
    return gaps
      .filter((gap) => !gap.category)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
  }
}
