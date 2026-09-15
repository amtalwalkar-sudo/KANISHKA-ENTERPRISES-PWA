import { validateEndShiftEntry } from '../../domain/work/endShift.js'
import { ShiftTripRepository } from '../../repositories/shiftTripRepository.js'

/**
 * Complete the End Shift operation as one application action.
 * Optional trip corrections and shift closure are persisted in one
 * IndexedDB transaction so the shift cannot close without its corrections.
 */
export async function completeEndShift({ shiftId, closingOdometer, revenue, toll, parking, tollParkingRevenueTreatment, trips = [] }) {
  const validation = validateEndShiftEntry({ closingOdometer, revenue })
  if (!validation.valid) return { ok: false, reason: validation.reason }

  try {
    await ShiftTripRepository.completeShift({
      id: shiftId,
      endOdometer: Number(closingOdometer),
      revenue: Number(revenue),
      toll,
      parking,
      tollParkingRevenueTreatment,
      trips
    })
    return { ok: true }
  } catch (error) {
    return { ok: false, reason: error?.message || 'END_SHIFT_FAILED' }
  }
}
