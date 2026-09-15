const NUMERIC = new Set(['number','money'])
const ALLOW_NEGATIVE_CORRECTION = new Set(['loanDelayAdjustment'])

export function validateAdminForm(fields, values) {
  const errors = {}
  for (const field of fields) {
    if (field.derived || field.readOnly) continue
    const value = values[field.name]
    if (field.required && (value === undefined || value === null || String(value).trim() === '')) errors[field.name] = 'Required.'
    if (NUMERIC.has(field.type) && value !== '' && value != null) {
      const n = Number(value)
      if (!Number.isFinite(n) || (!ALLOW_NEGATIVE_CORRECTION.has(field.name) && n < 0)) errors[field.name] = 'Must be a valid number.'
    }
  }
  return { valid: Object.keys(errors).length === 0, errors }
}

export function inspectAdminImpact(kind, values, existing) {
  const warnings = []
  const start = values.shiftStart || values.tripStart
  const end = values.shiftEnd || values.tripEnd
  if (start && end && new Date(end) < new Date(start)) warnings.push('This correction makes the recorded end time earlier than the start time. KFE will retain the correction and dependent timeline calculations may change.')
  if (values.openingOdometer !== '' && values.closingOdometer !== '' && Number(values.closingOdometer) < Number(values.openingOdometer)) warnings.push('This correction moves the closing odometer below the opening odometer. Vehicle KM, dead KM and performance results may change.')
  if (values.amountPaid !== '' && values.amount !== '' && Number(values.amountPaid) > Number(values.amount)) warnings.push('Amount paid exceeds the recorded amount. This historical correction may affect payment and financial reporting.')
  if (values.complianceAmountPaid !== '' && values.complianceAmount !== '' && Number(values.complianceAmountPaid) > Number(values.complianceAmount)) warnings.push('Compliance amount paid exceeds the recorded amount. This historical correction may affect financial reporting.')
  if (values.maintenanceAmountPaid !== '' && values.maintenanceAmount !== '' && Number(values.maintenanceAmountPaid) > Number(values.maintenanceAmount)) warnings.push('Maintenance amount paid exceeds the recorded amount. This historical correction may affect financial reporting.')
  if (existing && kind === 'SHIFT' && values.closingOdometer !== '' && Number(values.closingOdometer) < Number(existing.endOdometer ?? existing.startOdometer)) warnings.push('This correction moves the recorded odometer backwards relative to the existing source record and can change vehicle KM, dead KM and performance results.')
  if (kind === 'TRIP' && values.tripKm !== '' && Number(values.tripKm) > 1000) warnings.push('This trip KM is unusually large. Saving it will affect KM, revenue/KM and profitability calculations.')
  if (kind === 'TRIP' && values.tripRevenue !== '' && Number(values.tripRevenue) > 100000) warnings.push('This trip revenue is unusually large and will affect revenue and target calculations.')
  if (kind === 'LOAN' && values.loanPrincipal !== '' && Number(values.loanPrincipal) > 10000000) warnings.push('This loan principal is unusually large and will materially change EMI and break-even calculations.')
  if (kind === 'MAINTENANCE' && values.maintenanceAmount !== '' && Number(values.maintenanceAmount) > 500000) warnings.push('This maintenance amount is unusually large and will affect financial reporting.')
  if (kind === 'LOAN' && values.loanDelayAdjustment !== '' && Number(values.loanDelayAdjustment) < 0) warnings.push('This negative charges / adjustment is a correction credit or reversal and will affect the loan financial history.')
  return warnings
}

export const derivedAdminFields = new Set(['scheduledEmiAmount','prepaymentPrincipalBefore','prepaymentPrincipalAfter','prepaymentEffect'])
