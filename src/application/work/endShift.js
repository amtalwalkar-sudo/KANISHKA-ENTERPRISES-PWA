import { validateEndShiftEntry } from '../../domain/work/endShift.js'
import { ShiftTripRepository } from '../../repositories/shiftTripRepository.js'

/**
 * Complete End Shift as one application action.
 * Trip corrections and shift closure are persisted atomically.
 * Shift revenue is derived from completed trip records; it is not a
 * second manually-entered revenue authority.
 */
export async function completeEndShift({ shiftId, closingOdometer, toll, parking, tollParkingRevenueTreatment, trips = [] }) {
  const active = await ShiftTripRepository.getActive()
  if (!active.shift || active.shift.id !== shiftId) return { ok: false, reason: 'Active shift not found.' }

  const validation = validateEndShiftEntry({ closingOdometer, startOdometer: active.shift.startOdometer })
  if (!validation.valid) return { ok: false, reason: validation.reason }

  try {
    await ShiftTripRepository.completeShift({
      id: shiftId,
      endOdometer: validation.closingOdometer,
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
