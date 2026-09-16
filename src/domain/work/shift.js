export function validateShiftStartOdometer(currentOdometer, previousOdometer = null) {
  const current = Number(currentOdometer)
  const previous = Number(previousOdometer)

  if (!Number.isFinite(current) || current <= 0) {
    return { valid: false, reason: 'Enter a valid current odometer.' }
  }
  if (!Number.isFinite(previous)) {
    return { valid: true, gapKm: 0 }
  }
  if (current < previous) {
    return { valid: false, reason: 'Current odometer cannot be lower than the last recorded odometer.' }
  }
  return { valid: true, gapKm: current - previous }
}

export function validateGapAllocation(gapKm, personalKm = 0, deadKm = 0) {
  const personal = Number(personalKm || 0)
  const dead = Number(deadKm || 0)
  if (!Number.isFinite(personal) || !Number.isFinite(dead) || personal < 0 || dead < 0 || personal + dead !== gapKm) {
    return { valid: false, requiresGapAllocation: true, gapKm }
  }
  return { valid: true, personalKm: personal, deadKm: dead }
}
