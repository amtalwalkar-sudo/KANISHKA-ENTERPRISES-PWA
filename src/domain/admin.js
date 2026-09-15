const REQUIRED = {
  VEHICLE: ['registrationNumber', 'make', 'model', 'fuelType', 'acquisitionDate'],
  DRIVER: ['name', 'status'],
  COMPLIANCE: ['itemName', 'validFrom', 'expiryDate', 'amount', 'status'],
  MAINTENANCE: ['date', 'odometer', 'type', 'amount'],
  SHIFT: ['start', 'end', 'openingOdometer', 'closingOdometer', 'revenue'],
  TRIP: ['shiftReference', 'operator', 'tripType', 'status', 'start', 'end', 'km', 'kmSource', 'revenue'],
  FUEL: ['odometer', 'pricePerKg', 'amount', 'fillType', 'recordedAt'],
  LOAN_SETUP: ['principal', 'interestRate', 'tenure', 'startDate', 'status'],
  EMI: ['emiNumber', 'dueDate', 'paymentStatus'],
  DELAY: ['delayStatus'],
  PREPAYMENT: ['date', 'amount', 'status'],
  RECOVERY: ['applicability', 'startDate'],
  TARGET: ['driver', 'value']
}

const numeric = (value) => Number.isFinite(Number(value)) && Number(value) >= 0

export function validateAdminForm(kind, data) {
  const required = REQUIRED[kind] || []
  const missing = required.filter((key) => data[key] === undefined || data[key] === null || data[key] === '')
  if (missing.length) return { ok: false, code: 'REQUIRED_FIELDS', fields: missing }

  for (const key of ['amount', 'revenue', 'principal', 'interestRate', 'tenure', 'value', 'odometer', 'openingOdometer', 'closingOdometer', 'km', 'pricePerKg', 'prepaymentAmount']) {
    if (data[key] !== undefined && data[key] !== '' && !numeric(data[key])) return { ok: false, code: 'INVALID_NUMBER', field: key }
  }

  if (data.openingOdometer !== undefined && data.closingOdometer !== undefined && Number(data.closingOdometer) < Number(data.openingOdometer)) {
    return { ok: false, code: 'ODOMETER_REVERSED', fields: ['closingOdometer'] }
  }
  if (data.start && data.end && new Date(data.end) < new Date(data.start)) return { ok: false, code: 'TIME_REVERSED', fields: ['end'] }
  if (data.validFrom && data.expiryDate && new Date(data.expiryDate) < new Date(data.validFrom)) return { ok: false, code: 'DATE_REVERSED', fields: ['expiryDate'] }
  if (data.kmSource && !['GPS', 'ADMIN_CORRECTION', 'VERIFIED_MANUAL_CORRECTION'].includes(data.kmSource)) return { ok: false, code: 'INVALID_KM_SOURCE', field: 'kmSource' }

  const warnings = []
  if (data.amount !== undefined && Number(data.amount) > 100000) warnings.push({ code: 'UNUSUAL_AMOUNT', message: 'This amount is unusually high. KFE will preserve it, but verify the source record.' })
  if (data.revenue !== undefined && Number(data.revenue) > 100000) warnings.push({ code: 'UNUSUAL_REVENUE', message: 'This revenue is unusually high. Verify before saving.' })
  if (data.km !== undefined && Number(data.km) > 1000) warnings.push({ code: 'UNUSUAL_KM', message: 'This trip distance is unusually high. Verify the source or correction.' })
  if (data.closingOdometer !== undefined && data.openingOdometer !== undefined && Number(data.closingOdometer) - Number(data.openingOdometer) > 1000) warnings.push({ code: 'UNUSUAL_SHIFT_DISTANCE', message: 'This shift movement is unusually high. Verify the odometers.' })
  return { ok: true, warnings }
}

export function derivedAdminFields(data) {
  return {
    scheduledEmiAmount: undefined,
    outstandingPrincipalBefore: undefined,
    outstandingPrincipalAfter: undefined,
    prepaymentEffect: undefined,
    quantityKg: data.pricePerKg > 0 && data.amount !== '' ? Number(data.amount) / Number(data.pricePerKg) : undefined
  }
}
