const MAINTENANCE_RATE_PER_BUSINESS_KM = 2

const asNumber = value => Number.isFinite(Number(value)) ? Number(value) : 0
const asDate = value => value ? new Date(value) : null
const validDate = value => { const d = asDate(value); return d && !Number.isNaN(d.getTime()) ? d : null }
const dateKey = value => { const d = validDate(value); return d ? d.toISOString().slice(0, 10) : null }
const inRange = (value, range) => { const d = validDate(value); return !!d && d >= range.from && d <= range.to }
const daysBetween = (from, to) => Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86400000) + 1)
const hoursBetween = (from, to) => { const a = validDate(from); const b = validDate(to); return a && b && b >= a ? (b.getTime() - a.getTime()) / 3600000 : 0 }
const money = v => Number.isFinite(v) ? `₹${Math.round(v).toLocaleString('en-IN')}` : '—'
const num = v => Number.isFinite(v) ? v.toLocaleString('en-IN', { maximumFractionDigits: 1 }) : '—'
const pct = v => Number.isFinite(v) ? `${v.toFixed(1)}%` : '—'

export function previousRange(range) {
  const length = Math.max(1, range.to.getTime() - range.from.getTime() + 1)
  return { from: new Date(range.from.getTime() - length), to: new Date(range.from.getTime() - 1) }
}

const activeInputs = (inputs, kind, range) => (inputs || []).filter(input => {
  if (input.kind !== kind || input.status === 'INACTIVE') return false
  const from = validDate(input.effectiveFrom) || new Date(0)
  const to = validDate(input.effectiveTo) || new Date('9999-12-31T23:59:59.999Z')
  return from <= range.to && to >= range.from
})

const targetFor = (inputs, range) => {
  const candidates = activeInputs(inputs, 'TARGET', range)
    .filter(input => Number.isFinite(Number(input.amount ?? input.target)))
    .sort((a, b) => String(b.effectiveFrom || '').localeCompare(String(a.effectiveFrom || '')))
  return candidates.length ? Number(candidates[0].amount ?? candidates[0].target) : null
}

const loanFor = (inputs, range) => {
  const loans = activeInputs(inputs, 'LOAN', range)
  if (!loans.length) return { available: false, amount: NaN, emi: NaN, principal: NaN, interest: NaN }
  const loan = [...loans].sort((a, b) => String(b.effectiveFrom || '').localeCompare(String(a.effectiveFrom || '')))[0]
  const principal = asNumber(loan.principal)
  const annualRate = asNumber(loan.annualInterestRate)
  const tenureMonths = Math.max(1, asNumber(loan.tenureMonths))
  const start = validDate(loan.startDate || loan.effectiveFrom)
  if (!principal || !start) return { available: false, amount: NaN, emi: NaN, principal: NaN, interest: NaN }
  const monthlyRate = annualRate / 1200
  const emi = monthlyRate ? principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / (Math.pow(1 + monthlyRate, tenureMonths) - 1) : principal / tenureMonths
  let balance = principal
  let principalPaid = 0
  let interestPaid = 0
  for (let i = 0; i < tenureMonths; i += 1) {
    const due = new Date(start.getFullYear(), start.getMonth() + i, 1)
    if (due > range.to) break
    const interest = monthlyRate ? balance * monthlyRate : 0
    const principalPart = Math.min(balance, emi - interest)
    const inPeriod = due >= range.from && due <= range.to
    if (inPeriod) { principalPaid += principalPart; interestPaid += interest }
    balance = Math.max(0, balance - principalPart)
    if (!balance) break
  }
  const monthsInPeriod = Math.max(0, Math.round(principalPaid || interestPaid ? (principalPaid + interestPaid) / emi : 0))
  return { available: true, amount: monthsInPeriod * emi, emi, principal: principalPaid, interest: interestPaid }
}

const renewalProvisionFor = (inputs, range) => {
  const days = daysBetween(range.from, range.to)
  return activeInputs(inputs, 'RENEWAL', range).reduce((sum, input) => {
    const annual = asNumber(input.annualAmount ?? input.amount)
    return sum + (annual ? annual * days / 365 : 0)
  }, 0)
}

const provisionFor = (inputs, range) => {
  const days = daysBetween(range.from, range.to)
  return activeInputs(inputs, 'PROVISION', range).reduce((sum, input) => {
    if (Number.isFinite(Number(input.periodAmount))) return sum + Number(input.periodAmount)
    if (Number.isFinite(Number(input.monthlyAmount))) return sum + Number(input.monthlyAmount) * days / 30
    if (Number.isFinite(Number(input.annualAmount))) return sum + Number(input.annualAmount) * days / 365
    return sum + asNumber(input.amount)
  }, 0)
}

export function derivePerformance(snapshot, range, previous) {
  const shifts = snapshot.shifts || []
  const trips = snapshot.trips || []
  const fuelLogs = snapshot.fuelLogs || []
  const inputs = snapshot.financialInputs || []
  const periodShifts = shifts.filter(s => inRange(s.shiftEndAt || s.shiftStartAt, range))
  const periodTrips = trips.filter(t => t.status === 'COMPLETED' && inRange(t.tripEndAt || t.tripStartAt, range))
  const periodFuel = fuelLogs.filter(f => inRange(f.capturedAt || f.createdAt, range))
  const previousShifts = shifts.filter(s => inRange(s.shiftEndAt || s.shiftStartAt, previous))
  const previousTrips = trips.filter(t => t.status === 'COMPLETED' && inRange(t.tripEndAt || t.tripStartAt, previous))
  const previousFuel = fuelLogs.filter(f => inRange(f.capturedAt || f.createdAt, previous))

  const revenue = periodTrips.reduce((sum, t) => sum + asNumber(t.revenue), 0)
  const previousRevenue = previousTrips.reduce((sum, t) => sum + asNumber(t.revenue), 0)
  const vehicleKm = periodShifts.reduce((sum, s) => sum + Math.max(0, asNumber(s.totalDistance || (asNumber(s.endOdometer) - asNumber(s.startOdometer)))), 0)
  const previousVehicleKm = previousShifts.reduce((sum, s) => sum + Math.max(0, asNumber(s.totalDistance || (asNumber(s.endOdometer) - asNumber(s.startOdometer)))), 0)
  const businessKm = periodTrips.reduce((sum, t) => sum + Math.max(0, asNumber(t.tripKm)), 0)
  const previousBusinessKm = previousTrips.reduce((sum, t) => sum + Math.max(0, asNumber(t.tripKm)), 0)
  const fuelCost = periodFuel.reduce((sum, f) => sum + asNumber(f.amount), 0)
  const previousFuelCost = previousFuel.reduce((sum, f) => sum + asNumber(f.amount), 0)
  const fuelQty = periodFuel.reduce((sum, f) => sum + asNumber(f.quantityKg ?? f.kg), 0)
  const toll = periodShifts.reduce((sum, s) => sum + asNumber(s.toll), 0)
  const parking = periodShifts.reduce((sum, s) => sum + asNumber(s.parking), 0)
  const previousToll = previousShifts.reduce((sum, s) => sum + asNumber(s.toll), 0)
  const previousParking = previousShifts.reduce((sum, s) => sum + asNumber(s.parking), 0)
  const workingHours = periodShifts.reduce((sum, s) => sum + hoursBetween(s.shiftStartAt, s.shiftEndAt), 0)
  const previousWorkingHours = previousShifts.reduce((sum, s) => sum + hoursBetween(s.shiftStartAt, s.shiftEndAt), 0)

  const maintenanceProvision = businessKm * MAINTENANCE_RATE_PER_BUSINESS_KM
  const previousMaintenanceProvision = previousBusinessKm * MAINTENANCE_RATE_PER_BUSINESS_KM
  const runningCost = fuelCost + toll + parking + maintenanceProvision
  const previousRunningCost = previousFuelCost + previousToll + previousParking + previousMaintenanceProvision
  const loan = loanFor(inputs, range)
  const previousLoan = loanFor(inputs, previous)
  const renewalProvision = renewalProvisionFor(inputs, range)
  const previousRenewalProvision = renewalProvisionFor(inputs, previous)
  const otherProvision = provisionFor(inputs, range)
  const previousOtherProvision = provisionFor(inputs, previous)
  const provisionRequired = (loan.available ? loan.amount : 0) + renewalProvision + otherProvision
  const previousProvisionRequired = (previousLoan.available ? previousLoan.amount : 0) + previousRenewalProvision + previousOtherProvision
  const actualProfit = revenue - runningCost
  const previousActualProfit = previousRevenue - previousRunningCost
  const availableProfit = actualProfit - provisionRequired
  const previousAvailableProfit = previousActualProfit - previousProvisionRequired
  const target = targetFor(inputs, range)
  const activeFinancialDays = new Set(periodTrips.map(t => dateKey(t.tripEndAt || t.tripStartAt)).filter(Boolean)).size
  const previousActiveFinancialDays = new Set(previousTrips.map(t => dateKey(t.tripEndAt || t.tripStartAt)).filter(Boolean)).size
  const workingDays = daysBetween(range.from, range.to)
  const elapsedDays = Math.max(1, Math.min(workingDays, Math.ceil((Math.min(Date.now(), range.to.getTime()) - range.from.getTime()) / 86400000)))
  const daysRemaining = Math.max(0, workingDays - elapsedDays)
  const revenuePerActiveDay = activeFinancialDays ? revenue / activeFinancialDays : NaN
  const projectedRevenue = activeFinancialDays ? revenuePerActiveDay * workingDays : NaN
  const requiredRevenuePerDay = target != null ? target / workingDays : NaN
  const paceVariance = Number.isFinite(requiredRevenuePerDay) && Number.isFinite(revenuePerActiveDay) ? revenuePerActiveDay - requiredRevenuePerDay : NaN
  const targetGap = target != null && Number.isFinite(projectedRevenue) ? projectedRevenue - target : NaN
  const revenueGrowth = previousRevenue ? ((revenue - previousRevenue) / previousRevenue) * 100 : NaN
  const profitGrowth = previousActualProfit ? ((actualProfit - previousActualProfit) / Math.abs(previousActualProfit)) * 100 : NaN
  const revenuePerKm = businessKm ? revenue / businessKm : NaN
  const revenuePerTrip = periodTrips.length ? revenue / periodTrips.length : NaN
  const revenuePerHour = workingHours ? revenue / workingHours : NaN
  const profitPerKm = businessKm ? actualProfit / businessKm : NaN
  const profitPerHour = workingHours ? actualProfit / workingHours : NaN
  const costPerKm = vehicleKm ? runningCost / vehicleKm : NaN
  const breakEvenComplete = loan.available && renewalProvision >= 0
  const breakEvenRevenue = breakEvenComplete ? runningCost + provisionRequired : NaN

  return {
    period: { from: range.from, to: range.to, previousFrom: previous.from, previousTo: previous.to },
    authority: { revenue: 'COMPLETED_TRIP_RECORDS', costs: 'FUEL_LOGS_PLUS_SHIFT_TOLL_PARKING_PLUS_BUSINESS_KM_MAINTENANCE', maintenanceRate: MAINTENANCE_RATE_PER_BUSINESS_KM, target: target == null ? 'NOT_CONFIGURED' : 'FINANCIAL_INPUTS', loan: loan.available ? 'FINANCIAL_INPUTS' : 'NOT_CONFIGURED', renewal: renewalProvision ? 'FINANCIAL_INPUTS' : 'NOT_CONFIGURED', hourly: 'SHIFT_START_END_TIMESTAMPS' },
    completeness: { target: target != null, loan: loan.available, renewal: renewalProvision > 0, hourlyData: workingHours > 0, breakEven: breakEvenComplete },
    counts: { trips: periodTrips.length, activeFinancialDays, workingDays, elapsedDays, daysRemaining },
    previousCounts: { trips: previousTrips.length, activeFinancialDays: previousActiveFinancialDays },
    revenue, previousRevenue, vehicleKm, previousVehicleKm, businessKm, previousBusinessKm, fuelCost, fuelQty, toll, parking, workingHours, previousWorkingHours,
    maintenanceProvision, previousMaintenanceProvision, runningCost, previousRunningCost, actualOperatingCost: runningCost, previousActualOperatingCost: previousRunningCost,
    loanProvision: loan.available ? loan.amount : NaN, loanPrincipal: loan.available ? loan.principal : NaN, loanInterest: loan.available ? loan.interest : NaN,
    renewalProvision, otherProvision, provisionRequired, previousProvisionRequired, provisionSetAside: maintenanceProvision + provisionRequired,
    availableProfit, previousAvailableProfit, actualProfit, previousActualProfit, breakEvenRevenue,
    revenuePerKm, revenuePerTrip, revenuePerHour, costPerKm, profitPerKm, profitPerHour, revenueGrowth, profitGrowth, revenuePerActiveDay, projectedRevenue, target,
    pace: { currentRevenuePerActiveDay: revenuePerActiveDay, requiredRevenuePerActiveDay: requiredRevenuePerDay, paceVariance, projectedRevenue, targetGap },
    trips: periodTrips, shifts: periodShifts, fuelLogs: periodFuel,
    previous: { revenue: previousRevenue, cost: previousRunningCost, profit: previousActualProfit, businessKm: previousBusinessKm, vehicleKm: previousVehicleKm, workingHours: previousWorkingHours }
  }
}

export function layerRows(card, layer, metrics) {
  if (card === 'target') {
    if (layer === 0) return [['Achieved revenue', money(metrics.revenue)], ['Target', metrics.target == null ? 'Not configured' : money(metrics.target)], ['Achievement', metrics.target != null ? pct(metrics.revenue / metrics.target * 100) : '—'], ['Remaining', metrics.target != null ? money(Math.max(0, metrics.target - metrics.revenue)) : '—'], ['Status', metrics.target == null ? 'Target not configured' : 'Calculated']]
    if (layer === 1) return [['Current pace / active day', money(metrics.pace.currentRevenuePerActiveDay)], ['Required pace', money(metrics.pace.requiredRevenuePerActiveDay)], ['Pace variance', money(metrics.pace.paceVariance)], ['Projected revenue', money(metrics.pace.projectedRevenue)], ['Expected target gap', money(metrics.pace.targetGap)]]
    if (layer === 2) return [['Working days', num(metrics.counts.workingDays)], ['Days elapsed', num(metrics.counts.elapsedDays)], ['Days remaining', num(metrics.counts.daysRemaining)], ['Active financial days', num(metrics.counts.activeFinancialDays)], ['Revenue per active day', money(metrics.revenuePerActiveDay)]]
    if (layer === 3) return [['Previous period revenue', money(metrics.previous.revenue)], ['Current revenue', money(metrics.revenue)], ['Revenue variance', money(metrics.revenue - metrics.previous.revenue)], ['Growth', pct(metrics.revenueGrowth)], ['Previous active days', num(metrics.previousCounts.activeFinancialDays)]]
    return metrics.shifts.map(s => [`Shift ${String(s.id || '').slice(0, 8)}`, `${s.shiftStartAt || '—'} → ${s.shiftEndAt || '—'}`, `KM ${num(s.totalDistance)}`, `Revenue ${money(asNumber(s.revenue))}`])
  }
  if (card === 'revenue') {
    if (layer === 0) return [['Total revenue', money(metrics.revenue)], ['Previous period', money(metrics.previous.revenue)], ['Variance', money(metrics.revenue - metrics.previous.revenue)], ['Growth', pct(metrics.revenueGrowth)], ['Authority', 'Completed trip records']]
    if (layer === 1) { const byOperator = {}; metrics.trips.forEach(t => { const key = t.operator || 'Unknown'; byOperator[key] = (byOperator[key] || 0) + asNumber(t.revenue) }); return [['Ride revenue', money(metrics.revenue)], ...Object.entries(byOperator).map(([key, value]) => [key, money(value)]), ['Revenue / trip', money(metrics.revenuePerTrip)]] }
    if (layer === 2) return [['Revenue / KM', money(metrics.revenuePerKm)], ['Revenue / trip', money(metrics.revenuePerTrip)], ['Revenue / hour', money(metrics.revenuePerHour)], ['Business KM', num(metrics.businessKm)], ['Working hours', num(metrics.workingHours)], ['Trips', num(metrics.counts.trips)]]
    if (layer === 3) return [['Current period', money(metrics.revenue)], ['Previous period', money(metrics.previous.revenue)], ['Current active days', num(metrics.counts.activeFinancialDays)], ['Current revenue / day', money(metrics.revenuePerActiveDay)], ['Projected period revenue', money(metrics.projectedRevenue)]]
    return metrics.trips.map(t => [`${t.operator || 'Trip'}`, `${t.tripStartAt || '—'} → ${t.tripEndAt || '—'}`, `KM ${num(asNumber(t.tripKm))}`, `Revenue ${money(asNumber(t.revenue))}`])
  }
  if (card === 'cost') {
    if (layer === 0) return [['Running cost', money(metrics.runningCost)], ['Break-even revenue', money(metrics.breakEvenRevenue)], ['Cost / KM', money(metrics.costPerKm)], ['Loan provision', money(metrics.loanProvision)], ['Renewal provision', money(metrics.renewalProvision)], ['Status', metrics.completeness.breakEven ? 'Complete' : 'Incomplete fixed-cost inputs']]
    if (layer === 1) return [['Fuel', money(metrics.fuelCost)], ['Maintenance allocation', money(metrics.maintenanceProvision)], ['Toll', money(metrics.toll)], ['Parking', money(metrics.parking)], ['Loan', money(metrics.loanProvision)], ['Renewals / compliance', money(metrics.renewalProvision)], ['Other provisions', money(metrics.otherProvision)]]
    if (layer === 2) return [['Fuel cost', money(metrics.fuelCost)], ['Fuel quantity', `${num(metrics.fuelQty)} kg`], ['Cost / KM', money(metrics.costPerKm)], ['Vehicle KM', num(metrics.vehicleKm)], ['Running cost', money(metrics.runningCost)], ['Previous running cost', money(metrics.previous.runningCost || metrics.previous.cost)]]
    if (layer === 3) return [['Break-even revenue', money(metrics.breakEvenRevenue)], ['Running cost', money(metrics.runningCost)], ['Loan provision', money(metrics.loanProvision)], ['Renewal provision', money(metrics.renewalProvision)], ['Other provision', money(metrics.otherProvision)], ['Completeness', metrics.completeness.breakEven ? 'Complete' : 'Waiting for authoritative fixed-cost inputs']]
    return [...metrics.fuelLogs.map(f => [`Fuel ${f.capturedAt || f.createdAt}`, money(asNumber(f.amount)), `${num(asNumber(f.quantityKg ?? f.kg))} kg`, `Odo ${num(asNumber(f.odometer))}`]), ...metrics.shifts.map(s => [`Shift ${s.shiftEndAt || s.shiftStartAt}`, `Toll ${money(asNumber(s.toll))}`, `Parking ${money(asNumber(s.parking))}`, `KM ${num(asNumber(s.totalDistance))}`])]
  }
  if (layer === 0) return [['Revenue', money(metrics.revenue)], ['Running cost', money(metrics.runningCost)], ['Profit', money(metrics.actualProfit)], ['Profit / KM', money(metrics.profitPerKm)], ['Profit / hour', money(metrics.profitPerHour)], ['Status', metrics.completeness.hourlyData ? 'Calculated from shift timestamps' : 'Hourly source timestamps unavailable']]
  if (layer === 1) return [['Maintenance allocation', money(metrics.maintenanceProvision)], ['Loan provision', money(metrics.loanProvision)], ['Renewal provision', money(metrics.renewalProvision)], ['Other provisions', money(metrics.otherProvision)], ['Total provision requirement', money(metrics.provisionRequired)], ['Coverage', metrics.completeness.breakEven ? 'Configured' : 'Partial']]
  if (layer === 2) return [['Loan principal paid', money(metrics.loanPrincipal)], ['Loan interest paid', money(metrics.loanInterest)], ['Maintenance', money(metrics.maintenanceProvision)], ['Renewals / compliance', money(metrics.renewalProvision)], ['Other obligations', money(metrics.otherProvision)]]
  if (layer === 3) return [['Revenue', money(metrics.revenue)], ['Running cost', money(metrics.runningCost)], ['Provision requirement', money(metrics.provisionRequired)], ['Available profit', money(metrics.availableProfit)], ['Actual profit', money(metrics.actualProfit)], ['Fuel treatment', 'Fuel is already an actual expense']]
  if (layer === 4) return [['Current profit', money(metrics.actualProfit)], ['Previous period profit', money(metrics.previous.profit)], ['Profit variance', money(metrics.actualProfit - metrics.previous.profit)], ['Growth', pct(metrics.profitGrowth)], ['Profit / KM', money(metrics.profitPerKm)], ['Profit / hour', money(metrics.profitPerHour)]]
  return metrics.trips.map(t => [`${t.operator || 'Trip'}`, `${t.tripStartAt || '—'} → ${t.tripEndAt || '—'}`, `Revenue ${money(asNumber(t.revenue))}`, `KM ${num(asNumber(t.tripKm))}`])
}
