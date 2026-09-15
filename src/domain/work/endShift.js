/**
 * Validates the minimum End Shift inputs.
 *
 * KFE intentionally does not make End Shift stricter based on trip count.
 * A shift may close with zero revenue and with the closing odometer equal
 * to the starting odometer, including when completed trips exist.
 */
export function validateEndShiftEntry({ closingOdometer, revenue }) {
  const odometer = Number(closingOdometer)
  const amount = Number(revenue)

  if (!Number.isFinite(odometer)) {
    return { valid: false, reason: 'CLOSING_ODOMETER_REQUIRED' }
  }

  if (!Number.isFinite(amount) || amount < 0) {
    return { valid: false, reason: 'REVENUE_REQUIRED' }
  }

  return { valid: true }
}
