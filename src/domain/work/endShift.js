export function validateEndShiftEntry({ closingOdometer, startOdometer }) {
  const odometer = Number(closingOdometer)
  const start = Number(startOdometer)

  if (!Number.isFinite(odometer) || odometer < 0) {
    return { valid: false, reason: 'CLOSING_ODOMETER_REQUIRED' }
  }

  if (Number.isFinite(start) && odometer < start) {
    return { valid: false, reason: 'Closing odometer cannot be lower than the shift opening odometer.' }
  }

  return { valid: true, closingOdometer: odometer }
}
