const text = value => value == null ? '' : String(value).trim()
const number = value => value === '' || value == null ? null : Number(value)

export const normalizeRideExtraction = input => ({
  shiftId: text(input?.shiftId) || null,
  operator: text(input?.operator),
  pickupAddress: text(input?.pickupAddress),
  dropAddress: text(input?.dropAddress),
  fare: number(input?.fare),
  durationMinutes: number(input?.durationMinutes),
  rideStartAt: text(input?.rideStartAt),
  rideEndAt: text(input?.rideEndAt),
  rideKm: number(input?.rideKm ?? input?.tripKm),
  cancellation: text(input?.cancellation || input?.status),
})

export const validateRideExtraction = record => {
  const errors = []
  if (!record.operator) errors.push('Operator is required.')
  if (!record.pickupAddress) errors.push('Pickup address is required.')
  if (!record.dropAddress) errors.push('Drop address is required.')
  if (record.fare == null || !Number.isFinite(record.fare) || record.fare < 0) errors.push('Fare must be a non-negative number.')
  if (record.durationMinutes == null || !Number.isFinite(record.durationMinutes) || record.durationMinutes < 0) errors.push('Duration must be a non-negative number.')
  if (!record.rideStartAt || Number.isNaN(Date.parse(record.rideStartAt))) errors.push('Ride start time is required and must be a valid date/time.')
  if (!record.rideEndAt || Number.isNaN(Date.parse(record.rideEndAt))) errors.push('Ride end time is required and must be a valid date/time.')
  if (record.rideStartAt && record.rideEndAt && Date.parse(record.rideEndAt) < Date.parse(record.rideStartAt)) errors.push('Ride end time cannot precede ride start time.')
  if (record.rideKm == null || !Number.isFinite(record.rideKm) || record.rideKm < 0) errors.push('Ride KM must be a non-negative number.')
  return { valid: errors.length === 0, errors, value: record }
}
