const NUMERIC = new Set(['number','money'])

export function validateAdminForm(fields, values) {
  const errors = {}
  for (const field of fields) {
    if (field.derived || field.readOnly) continue
    const value = values[field.name]
    if (field.required && (value === undefined || value === null || String(value).trim() === '')) errors[field.name] = 'Required.'
    if (NUMERIC.has(field.type) && value !== '' && value != null) {
      const n = Number(value)
      if (!Number.isFinite(n) || n < 0) errors[field.name] = 'Must be a non-negative number.'
    }
  }
  const start = values.shiftStart || values.tripStart
  const end = values.shiftEnd || values.tripEnd
  if (start && end && new Date(end) < new Date(start)) errors.shiftEnd = errors.tripEnd = 'End cannot be before start.'
  if (values.openingOdometer !== '' && values.closingOdometer !== '' && Number(values.closingOdometer) < Number(values.openingOdometer)) errors.closingOdometer = 'Closing odometer cannot be below opening odometer.'
  if (values.amountPaid !== '' && values.amount !== '' && Number(values.amountPaid) > Number(values.amount)) errors.amountPaid = 'Amount paid exceeds recorded amount.'
  if (values.complianceAmountPaid !== '' && values.complianceAmount !== '' && Number(values.complianceAmountPaid) > Number(values.complianceAmount)) errors.complianceAmountPaid = 'Amount paid exceeds amount.'
  if (values.maintenanceAmountPaid !== '' && values.maintenanceAmount !== '' && Number(values.maintenanceAmountPaid) > Number(values.maintenanceAmount)) errors.maintenanceAmountPaid = 'Amount paid exceeds amount.'
  return { valid: Object.keys(errors).length === 0, errors }
}

export function inspectAdminImpact(kind, values, existing) {
  const warnings = []
  if (existing && kind === 'SHIFT' && values.closingOdometer !== '' && Number(values.closingOdometer) < Number(existing.endOdometer ?? existing.startOdometer)) warnings.push('This correction moves the recorded odometer backwards and can change vehicle KM, dead KM and performance results.')
  if (kind === 'TRIP' && values.tripKm !== '' && Number(values.tripKm) > 1000) warnings.push('This trip KM is unusually large. Saving it will affect KM, revenue/KM and profitability calculations.')
  if (kind === 'TRIP' && values.tripRevenue !== '' && Number(values.tripRevenue) > 100000) warnings.push('This trip revenue is unusually large and will affect revenue and target calculations.')
  if (kind === 'LOAN' && values.loanPrincipal !== '' && Number(values.loanPrincipal) > 10000000) warnings.push('This loan principal is unusually large and will materially change EMI and break-even calculations.')
  if (kind === 'MAINTENANCE' && values.maintenanceAmount !== '' && Number(values.maintenanceAmount) > 500000) warnings.push('This maintenance amount is unusually large and will affect financial reporting.')
  return warnings
}

export const derivedAdminFields = new Set(['scheduledEmiAmount','prepaymentPrincipalBefore','prepaymentPrincipalAfter','prepaymentEffect'])
