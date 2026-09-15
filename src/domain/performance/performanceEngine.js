const asNumber = value => Number.isFinite(Number(value)) ? Number(value) : 0
const validDate = value => { const d = value ? new Date(value) : null; return d && !Number.isNaN(d.getTime()) ? d : null }
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

const activeByDate = (records, range, fromKey = 'effectiveFrom', toKey = 'effectiveUntil') => (records || []).filter(record => {
  if (record.active === false || record.status === 'Inactive' || record.status === 'INACTIVE' || record.status === 'Closed') return false
  const from = validDate(record[fromKey]) || new Date(0)
  const to = validDate(record[toKey]) || new Date('9999-12-31T23:59:59.999Z')
  return from <= range.to && to >= range.from
})

const targetFor = (targets, range) => {
  const candidates = activeByDate(targets, range).filter(t => Number.isFinite(Number(t.targetRevenue)))
    .sort((a, b) => String(b.effectiveFrom || '').localeCompare(String(a.effectiveFrom || '')))
  return candidates.length ? Number(candidates[0].targetRevenue) : null
}

const loanFor = (loans, payments, prepayments, range) => {
  const loan = activeByDate(loans, range, 'startDate', 'endDate').sort((a, b) => String(b.startDate || '').localeCompare(String(a.startDate || '')))[0]
  if (!loan) return { available: false, amount: NaN, emi: NaN, principal: NaN, interest: NaN, balance: NaN }
  const principal = asNumber(loan.principal)
  const annualRate = asNumber(loan.annualInterestRate)
  const tenureMonths = Math.max(1, asNumber(loan.tenureMonths))
  const start = validDate(loan.startDate)
  if (!principal || !start) return { available: false, amount: NaN, emi: NaN, principal: NaN, interest: NaN, balance: NaN }
  const monthlyRate = annualRate / 1200
  const emi = monthlyRate ? principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / (Math.pow(1 + monthlyRate, tenureMonths) - 1) : principal / tenureMonths
  let balance = principal
  let principalPaid = 0
  let interestPaid = 0
  let scheduledPaid = 0
  for (let i = 0; i < tenureMonths; i += 1) {
    const due = new Date(start.getFullYear(), start.getMonth() + i, 1)
    if (due > range.to) break
    const interest = monthlyRate ? balance * monthlyRate : 0
    const scheduledPrincipal = Math.min(balance, Math.max(0, emi - interest))
    if (due >= range.from && due <= range.to) {
      const payment = (payments || []).find(p => p.loanId === loan.id && p.status !== 'Reversed' && validDate(p.paidOn)?.getFullYear() === due.getFullYear() && validDate(p.paidOn)?.getMonth() === due.getMonth())
      const principalComponent = payment && Number.isFinite(Number(payment.principalComponent)) ? Number(payment.principalComponent) : scheduledPrincipal
      const interestComponent = payment && Number.isFinite(Number(payment.interestComponent)) ? Number(payment.interestComponent) : interest
      principalPaid += Math.min(balance, Math.max(0, principalComponent))
      interestPaid += Math.max(0, interestComponent)
      scheduledPaid += payment ? asNumber(payment.amount) : emi
    }
    balance = Math.max(0, balance - scheduledPrincipal)
    const extra = (prepayments || []).filter(p => p.loanId === loan.id && inRange(p.paidOn, range) && validDate(p.paidOn)?.getFullYear() === due.getFullYear() && validDate(p.paidOn)?.getMonth() === due.getMonth()).reduce((sum, p) => sum + asNumber(p.amount), 0)
    balance = Math.max(0, balance - extra)
    if (!balance) break
  }
  const actualAmount = (payments || []).filter(p => p.loanId === loan.id && p.status !== 'Reversed' && inRange(p.paidOn, range)).reduce((sum, p) => sum + asNumber(p.amount), 0) + (prepayments || []).filter(p => p.loanId === loan.id && inRange(p.paidOn, range)).reduce((sum, p) => sum + asNumber(p.amount), 0)
  return { available: true, amount: actualAmount || scheduledPaid, emi, principal: principalPaid, interest: interestPaid, balance }
}

const renewalProvisionFor = (compliance, range) => {
  const days = daysBetween(range.from, range.to)
  return activeByDate(compliance, range, 'validFrom', 'validUntil').reduce((sum, item) => {
    const annual = asNumber(item.annualAmount ?? item.cost)
    return sum + (annual ? annual * days / 365 : 0)
  }, 0)
}

const actualMaintenanceFor = (maintenance, range) => (maintenance || []).filter(m => inRange(m.performedOn, range)).reduce((sum, m) => sum + asNumber(m.cost), 0)

const breakEvenFor = (inputs, range) => {
  const candidate = activeByDate(inputs, range).sort((a, b) => String(b.effectiveFrom || '').localeCompare(String(a.effectiveFrom || '')))[0]
  if (!candidate) return { configured: false, revenue: NaN, perKm: NaN, perHour: NaN }
  const fixed = asNumber(candidate.fixedCosts)
  const variableKm = asNumber(candidate.variableCostPerKm)
  const variableHour = asNumber(candidate.variableCostPerHour)
  const revenueKm = asNumber(candidate.expectedRevenuePerKm)
  const revenueHour = asNumber(candidate.expectedRevenuePerHour)
  const perKm = revenueKm > variableKm ? fixed / (revenueKm - variableKm) : NaN
  const perHour = revenueHour > variableHour ? fixed / (revenueHour - variableHour) : NaN
  const revenue = Number.isFinite(perKm) || Number.isFinite(perHour) ? fixed : NaN
  return { configured: true, revenue, perKm, perHour }
}

export function derivePerformance(snapshot, range, previous) {
  const shifts = snapshot.shifts || []
  const trips = snapshot.trips || []
  const fuelLogs = snapshot.fuelLogs || []
  const maintenance = snapshot.maintenance || []
  const compliance = snapshot.compliance || []
  const loans = snapshot.loans || []
  const loanPayments = snapshot.loanPayments || []
  const prepayments = snapshot.prepayments || []
  const targets = snapshot.driverTargets || []
  const breakEvenInputs = snapshot.breakEvenInputs || []
  const periodShifts = shifts.filter(s => inRange(s.shiftEndAt || s.shiftStartAt, range))
  const periodTrips = trips.filter(t => t.status === 'COMPLETED' && inRange(t.tripEndAt || t.tripStartAt, range))
  const periodFuel = fuelLogs.filter(f => inRange(f.capturedAt || f.createdAt, range))
  const previousShifts = shifts.filter(s => inRange(s.shiftEndAt || s.shiftStartAt, previous))
  const previousTrips = trips.filter(t => t.status === 'COMPLETED' && inRange(t.tripEndAt || t.tripStartAt, previous))
  const previousFuel = fuelLogs.filter(f => inRange(f.capturedAt || f.createdAt, previous))
  const revenue = periodTrips.reduce((sum, t) => sum + asNumber(t.revenue), 0)
  const previousRevenue = previousTrips.reduce((sum, t) => sum + asNumber(t.revenue), 0)
  const vehicleKm = periodShifts.reduce((sum, s) => sum + Math.max(0, asNumber(s.endOdometer) - asNumber(s.startOdometer)), 0)
  const previousVehicleKm = previousShifts.reduce((sum, s) => sum + Math.max(0, asNumber(s.endOdometer) - asNumber(s.startOdometer)), 0)
  const businessKm = periodTrips.reduce((sum, t) => sum + Math.max(0, asNumber(t.tripKm)), 0)
  const previousBusinessKm = previousTrips.reduce((sum, t) => sum + Math.max(0, asNumber(t.tripKm)), 0)
  const deadKm = Math.max(0, vehicleKm - businessKm)
  const previousDeadKm = Math.max(0, previousVehicleKm - previousBusinessKm)
  const fuelCost = periodFuel.reduce((sum, f) => sum + asNumber(f.amount), 0)
  const previousFuelCost = previousFuel.reduce((sum, f) => sum + asNumber(f.amount), 0)
  const fuelQty = periodFuel.reduce((sum, f) => sum + asNumber(f.quantityKg ?? f.kg), 0)
  const toll = periodShifts.reduce((sum, s) => sum + asNumber(s.toll), 0)
  const parking = periodShifts.reduce((sum, s) => sum + asNumber(s.parking), 0)
  const previousToll = previousShifts.reduce((sum, s) => sum + asNumber(s.toll), 0)
  const previousParking = previousShifts.reduce((sum, s) => sum + asNumber(s.parking), 0)
  const workingHours = periodShifts.reduce((sum, s) => sum + hoursBetween(s.shiftStartAt, s.shiftEndAt), 0)
  const previousWorkingHours = previousShifts.reduce((sum, s) => sum + hoursBetween(s.shiftStartAt, s.shiftEndAt), 0)
  const maintenanceCost = actualMaintenanceFor(maintenance, range)
  const previousMaintenanceCost = actualMaintenanceFor(maintenance, previous)
  const runningCost = fuelCost + toll + parking + maintenanceCost
  const previousRunningCost = previousFuelCost + previousToll + previousParking + previousMaintenanceCost
  const loan = loanFor(loans, loanPayments, prepayments, range)
  const previousLoan = loanFor(loans, loanPayments, prepayments, previous)
  const renewalProvision = renewalProvisionFor(compliance, range)
  const previousRenewalProvision = renewalProvisionFor(compliance, previous)
  const target = targetFor(targets, range)
  const breakEven = breakEvenFor(breakEvenInputs, range)
  const provisionRequired = (loan.available ? loan.amount : 0) + renewalProvision
  const previousProvisionRequired = (previousLoan.available ? previousLoan.amount : 0) + previousRenewalProvision
  const actualProfit = revenue - runningCost
  const previousActualProfit = previousRevenue - previousRunningCost
  const availableProfit = actualProfit - provisionRequired
  const previousAvailableProfit = previousActualProfit - previousProvisionRequired
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
  return {
    period: { from: range.from, to: range.to, previousFrom: previous.from, previousTo: previous.to },
    authority: { revenue: 'COMPLETED_TRIP_RECORDS', vehicleKm: 'SHIFT_ODOMETER_DELTA', businessKm: 'COMPLETED_TRIP_RECORDS', deadKm: 'VEHICLE_KM_MINUS_BUSINESS_KM', costs: 'FUEL_PLUS_SHIFT_TOLL_PARKING_PLUS_MAINTENANCE_RECORDS', maintenance: 'MAINTENANCE_RECORDS', target: target == null ? 'NOT_CONFIGURED' : 'DRIVER_TARGET_RECORDS', loan: loan.available ? 'LOAN_AND_PAYMENT_RECORDS' : 'NOT_CONFIGURED', renewal: renewalProvision ? 'COMPLIANCE_RECORDS' : 'NOT_CONFIGURED', breakEven: breakEven.configured ? 'BREAK_EVEN_INPUT_RECORDS' : 'NOT_CONFIGURED', hourly: 'SHIFT_START_END_TIMESTAMPS' },
    completeness: { target: target != null, loan: loan.available, renewal: renewalProvision > 0, hourlyData: workingHours > 0, breakEven: breakEven.configured },
    counts: { trips: periodTrips.length, activeFinancialDays, workingDays, elapsedDays, daysRemaining }, previousCounts: { trips: previousTrips.length, activeFinancialDays: previousActiveFinancialDays },
    revenue, previousRevenue, vehicleKm, previousVehicleKm, businessKm, previousBusinessKm, deadKm, previousDeadKm, fuelCost, fuelQty, toll, parking, workingHours, previousWorkingHours,
    maintenanceProvision: maintenanceCost, previousMaintenanceProvision: previousMaintenanceCost, runningCost, previousRunningCost, actualOperatingCost: runningCost, previousActualOperatingCost: previousRunningCost,
    loanProvision: loan.available ? loan.amount : NaN, loanPrincipal: loan.available ? loan.principal : NaN, loanInterest: loan.available ? loan.interest : NaN, loanBalance: loan.available ? loan.balance : NaN,
    renewalProvision, otherProvision: 0, provisionRequired, previousProvisionRequired, provisionSetAside: maintenanceCost + provisionRequired, availableProfit, previousAvailableProfit, actualProfit, previousActualProfit,
    breakEvenRevenue: breakEven.revenue, breakEvenPerKm: breakEven.perKm, breakEvenPerHour: breakEven.perHour, revenuePerKm, revenuePerTrip, revenuePerHour, costPerKm, profitPerKm, profitPerHour, revenueGrowth, profitGrowth, revenuePerActiveDay, projectedRevenue, target,
    pace: { currentRevenuePerActiveDay: revenuePerActiveDay, requiredRevenuePerActiveDay: requiredRevenuePerDay, paceVariance, projectedRevenue, targetGap }, trips: periodTrips, shifts: periodShifts, fuelLogs: periodFuel,
    previous: { revenue: previousRevenue, cost: previousRunningCost, profit: previousActualProfit, businessKm: previousBusinessKm, vehicleKm: previousVehicleKm, deadKm: previousDeadKm, workingHours: previousWorkingHours }
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
    if (layer === 3) return [['Previous revenue', money(metrics.previous.revenue)], ['Current revenue', money(metrics.revenue)], ['Revenue growth', pct(metrics.revenueGrowth)], ['Vehicle KM', num(metrics.vehicleKm)], ['Dead KM', num(metrics.deadKm)]]
    return metrics.trips.map(t => [`${t.operator || 'Ride'} ${String(t.id || '').slice(0, 8)}`, `${t.tripStartAt || '—'} → ${t.tripEndAt || '—'}`, `KM ${num(asNumber(t.tripKm))}`, money(asNumber(t.revenue))])
  }
  if (card === 'cost') {
    if (layer === 0) return [['Running cost', money(metrics.runningCost)], ['Break-even revenue', money(metrics.breakEvenRevenue)], ['Cost / vehicle KM', money(metrics.costPerKm)], ['Maintenance', money(metrics.maintenanceProvision)]]
    if (layer === 1) return [['Fuel', money(metrics.fuelCost)], ['Toll', money(metrics.toll)], ['Parking', money(metrics.parking)], ['Maintenance', money(metrics.maintenanceProvision)], ['Loan provision', money(metrics.loanProvision)]]
    if (layer === 2) return [['Previous running cost', money(metrics.previous.cost)], ['Current running cost', money(metrics.runningCost)], ['Fuel quantity', num(metrics.fuelQty)], ['Vehicle KM', num(metrics.vehicleKm)]]
    if (layer === 3) return [['Break-even revenue', money(metrics.breakEvenRevenue)], ['Break-even / KM', money(metrics.breakEvenPerKm)], ['Break-even / hour', money(metrics.breakEvenPerHour)], ['Configured inputs', metrics.completeness.breakEven ? 'Yes' : 'No']]
    return metrics.fuelLogs.map(f => [`Fuel ${String(f.id || '').slice(0, 8)}`, f.createdAt || '—', `Qty ${num(asNumber(f.quantityKg ?? f.kg))}`, money(asNumber(f.amount))])
  }
  if (card === 'profit') {
    if (layer === 0) return [['Actual profit', money(metrics.actualProfit)], ['Available profit', money(metrics.availableProfit)], ['Provision requirement', money(metrics.provisionRequired)], ['Revenue', money(metrics.revenue)]]
    if (layer === 1) return [['Loan', money(metrics.loanProvision)], ['Renewal provision', money(metrics.renewalProvision)], ['Maintenance actual', money(metrics.maintenanceProvision)], ['Total provision', money(metrics.provisionRequired)]]
    if (layer === 2) return [['Loan', money(metrics.loanProvision)], ['Renewals', money(metrics.renewalProvision)], ['Other provisions', money(metrics.otherProvision)], ['Loan balance', money(metrics.loanBalance)]]
    if (layer === 3) return [['Actual profit', money(metrics.actualProfit)], ['Provision requirement', money(metrics.provisionRequired)], ['Available profit', money(metrics.availableProfit)], ['Profit / KM', money(metrics.profitPerKm)], ['Profit / hour', money(metrics.profitPerHour)]]
    if (layer === 4) return [['Previous profit', money(metrics.previous.profit)], ['Current profit', money(metrics.actualProfit)], ['Growth', pct(metrics.profitGrowth)], ['Revenue growth', pct(metrics.revenueGrowth)]]
    return [['Revenue', money(metrics.revenue)], ['Running cost', money(metrics.runningCost)], ['Actual profit', money(metrics.actualProfit)], ['Available profit', money(metrics.availableProfit)], ['Loan balance', money(metrics.loanBalance)]]
  }
  return []
}
