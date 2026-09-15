const MAINTENANCE_RATE_PER_KM = 1.6

const asNumber = value => Number.isFinite(Number(value)) ? Number(value) : 0
const asDate = value => value ? new Date(value) : null
const dateKey = value => {
  const d = asDate(value)
  return d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : null
}

const daysBetween = (from, to) => Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86400000) + 1)

export function previousRange(range) {
  const length = Math.max(1, range.to.getTime() - range.from.getTime() + 1)
  return { from: new Date(range.from.getTime() - length), to: new Date(range.from.getTime() - 1) }
}

export function derivePerformance(snapshot, range, previous) {
  const shifts = snapshot.shifts || []
  const trips = snapshot.trips || []
  const fuelLogs = snapshot.fuelLogs || []
  const inRange = value => {
    const d = asDate(value)
    return d && !Number.isNaN(d.getTime()) && d >= range.from && d <= range.to
  }
  const inPrevious = value => {
    const d = asDate(value)
    return d && !Number.isNaN(d.getTime()) && d >= previous.from && d <= previous.to
  }

  const periodShifts = shifts.filter(s => inRange(s.shiftEndAt || s.shiftStartAt))
  const periodTrips = trips.filter(t => t.status === 'COMPLETED' && inRange(t.tripEndAt || t.tripStartAt))
  const periodFuel = fuelLogs.filter(f => inRange(f.capturedAt || f.createdAt))
  const previousShifts = shifts.filter(s => inPrevious(s.shiftEndAt || s.shiftStartAt))
  const previousTrips = trips.filter(t => t.status === 'COMPLETED' && inPrevious(t.tripEndAt || t.tripStartAt))
  const previousFuel = fuelLogs.filter(f => inPrevious(f.capturedAt || f.createdAt))

  const revenue = periodTrips.reduce((sum, t) => sum + (Number.isFinite(Number(t.revenue)) ? Number(t.revenue) : 0), 0)
  const previousRevenue = previousTrips.reduce((sum, t) => sum + (Number.isFinite(Number(t.revenue)) ? Number(t.revenue) : 0), 0)
  const vehicleKm = periodShifts.reduce((sum, s) => sum + Math.max(0, asNumber(s.totalDistance)), 0)
  const previousVehicleKm = previousShifts.reduce((sum, s) => sum + Math.max(0, asNumber(s.totalDistance)), 0)
  const businessKm = periodTrips.reduce((sum, t) => sum + Math.max(0, asNumber(t.tripKm)), 0)
  const previousBusinessKm = previousTrips.reduce((sum, t) => sum + Math.max(0, asNumber(t.tripKm)), 0)
  const fuelCost = periodFuel.reduce((sum, f) => sum + asNumber(f.amount), 0)
  const previousFuelCost = previousFuel.reduce((sum, f) => sum + asNumber(f.amount), 0)
  const fuelQty = periodFuel.reduce((sum, f) => sum + asNumber(f.quantityKg ?? f.kg), 0)
  const toll = periodShifts.reduce((sum, s) => sum + asNumber(s.toll), 0)
  const parking = periodShifts.reduce((sum, s) => sum + asNumber(s.parking), 0)
  const previousToll = previousShifts.reduce((sum, s) => sum + asNumber(s.toll), 0)
  const previousParking = previousShifts.reduce((sum, s) => sum + asNumber(s.parking), 0)

  const actualOperatingCost = fuelCost + toll + parking
  const previousActualOperatingCost = previousFuelCost + previousToll + previousParking
  const maintenanceProvision = vehicleKm * MAINTENANCE_RATE_PER_KM
  const previousMaintenanceProvision = previousVehicleKm * MAINTENANCE_RATE_PER_KM
  const actualProfit = revenue - actualOperatingCost
  const previousActualProfit = previousRevenue - previousActualOperatingCost
  const provisionSetAside = maintenanceProvision
  const availableProfit = revenue - actualOperatingCost - provisionSetAside
  const previousAvailableProfit = previousRevenue - previousActualOperatingCost - previousMaintenanceProvision
  const activeFinancialDays = new Set(periodTrips.map(t => dateKey(t.tripEndAt || t.tripStartAt)).filter(Boolean)).size
  const previousActiveFinancialDays = new Set(previousTrips.map(t => dateKey(t.tripEndAt || t.tripStartAt)).filter(Boolean)).size
  const workingDays = daysBetween(range.from, range.to)
  const elapsedDays = Math.max(1, Math.min(workingDays, Math.ceil((Math.min(new Date(), range.to).getTime() - range.from.getTime()) / 86400000)))
  const daysRemaining = Math.max(0, workingDays - elapsedDays)
  const revenuePerActiveDay = activeFinancialDays ? revenue / activeFinancialDays : NaN
  const projectedRevenue = activeFinancialDays ? revenuePerActiveDay * workingDays : NaN
  const revenueGrowth = previousRevenue ? ((revenue - previousRevenue) / previousRevenue) * 100 : NaN
  const profitGrowth = previousActualProfit ? ((actualProfit - previousActualProfit) / Math.abs(previousActualProfit)) * 100 : NaN
  const revenuePerKm = businessKm ? revenue / businessKm : NaN
  const revenuePerHour = NaN
  const profitPerKm = businessKm ? actualProfit / businessKm : NaN
  const profitPerHour = NaN
  const costPerKm = vehicleKm ? actualOperatingCost / vehicleKm : NaN
  const breakEvenRevenue = revenue + (availableProfit < 0 ? Math.abs(availableProfit) : 0)

  return {
    period: { from: range.from, to: range.to, previousFrom: previous.from, previousTo: previous.to },
    authority: {
      revenue: 'COMPLETED_TRIP_RECORDS',
      actualCosts: 'FUEL_LOGS_PLUS_SHIFT_TOLL_PARKING',
      maintenanceProvision: 'KFE_PREDICTIVE_MAINTENANCE_RATE',
      target: 'NOT_CONFIGURED',
      loanProvision: 'NOT_AVAILABLE',
      complianceProvision: 'NOT_AVAILABLE'
    },
    completeness: { loan: false, compliance: false, target: false, hourlyData: false },
    counts: { trips: periodTrips.length, activeFinancialDays, workingDays, elapsedDays, daysRemaining },
    previousCounts: { trips: previousTrips.length, activeFinancialDays: previousActiveFinancialDays },
    revenue,
    previousRevenue,
    vehicleKm,
    previousVehicleKm,
    businessKm,
    previousBusinessKm,
    fuelCost,
    fuelQty,
    toll,
    parking,
    actualOperatingCost,
    previousActualOperatingCost,
    maintenanceProvision,
    previousMaintenanceProvision,
    provisionSetAside,
    availableProfit,
    previousAvailableProfit,
    actualProfit,
    previousActualProfit,
    breakEvenRevenue,
    revenuePerKm,
    revenuePerTrip: periodTrips.length ? revenue / periodTrips.length : NaN,
    revenuePerHour,
    costPerKm,
    profitPerKm,
    profitPerHour,
    revenueGrowth,
    profitGrowth,
    revenuePerActiveDay,
    projectedRevenue,
    target: null,
    pace: { currentRevenuePerActiveDay: revenuePerActiveDay, requiredRevenuePerActiveDay: NaN, paceVariance: NaN, projectedRevenue, targetGap: NaN },
    trips: periodTrips,
    shifts: periodShifts,
    fuelLogs: periodFuel,
    previous: { revenue: previousRevenue, cost: previousActualOperatingCost, profit: previousActualProfit, businessKm: previousBusinessKm, vehicleKm: previousVehicleKm }
  }
}

export function layerRows(card, layer, metrics) {
  const money = v => Number.isFinite(v) ? `₹${Math.round(v).toLocaleString('en-IN')}` : '—'
  const num = v => Number.isFinite(v) ? v.toLocaleString('en-IN', { maximumFractionDigits: 1 }) : '—'
  const pct = v => Number.isFinite(v) ? `${v.toFixed(1)}%` : '—'
  const status = metrics.completeness
  if (card === 'target') {
    if (layer === 0) return [['Achieved revenue', money(metrics.revenue)], ['Target', metrics.target == null ? 'Not configured' : money(metrics.target)], ['Achievement', metrics.target ? pct(metrics.revenue / metrics.target * 100) : '—'], ['Remaining', metrics.target ? money(Math.max(0, metrics.target - metrics.revenue)) : '—'], ['Status', metrics.target == null ? 'Target not configured' : 'Calculated']]
    if (layer === 1) return [['Current pace / active day', money(metrics.pace.currentRevenuePerActiveDay)], ['Required pace', '—'], ['Pace variance', '—'], ['Projected revenue', money(metrics.pace.projectedRevenue)], ['Expected target gap', '—'], ['Reason', 'Target configuration is not currently persisted']]
    if (layer === 2) return [['Working days', num(metrics.counts.workingDays)], ['Days elapsed', num(metrics.counts.elapsedDays)], ['Days remaining', num(metrics.counts.daysRemaining)], ['Active financial days', num(metrics.counts.activeFinancialDays)], ['Revenue per active day', money(metrics.revenuePerActiveDay)]]
    if (layer === 3) return [['Previous period revenue', money(metrics.previous.revenue)], ['Current revenue', money(metrics.revenue)], ['Revenue variance', money(metrics.revenue - metrics.previous.revenue)], ['Growth', pct(metrics.revenueGrowth)], ['Previous active days', num(metrics.previousCounts.activeFinancialDays)]]
    return metrics.shifts.map(s => [`Shift ${s.id.slice(0, 8)}`, `${s.shiftStartAt || '—'} → ${s.shiftEndAt || '—'}`, `KM ${num(s.totalDistance)}`, `Revenue ${money(s.revenue)}`])
  }
  if (card === 'revenue') {
    if (layer === 0) return [['Total revenue', money(metrics.revenue)], ['Previous period', money(metrics.previous.revenue)], ['Variance', money(metrics.revenue - metrics.previous.revenue)], ['Growth', pct(metrics.revenueGrowth)], ['Authority', 'Completed trip records']]
    if (layer === 1) {
      const byOperator = {}
      metrics.trips.forEach(t => { const k = t.operator || 'Unknown'; byOperator[k] = (byOperator[k] || 0) + asNumber(t.revenue) })
      return [['Ride revenue', money(metrics.revenue)], ...Object.entries(byOperator).map(([k, v]) => [k, money(v)]), ['Revenue/trip', money(metrics.revenuePerTrip)]]
    }
    if (layer === 2) return [['Revenue/KM', money(metrics.revenuePerKm)], ['Revenue/trip', money(metrics.revenuePerTrip)], ['Business KM', num(metrics.businessKm)], ['Vehicle KM', num(metrics.vehicleKm)], ['Trips', num(metrics.counts.trips)]]
    if (layer === 3) return [['Current period', money(metrics.revenue)], ['Previous period', money(metrics.previous.revenue)], ['Current active days', num(metrics.counts.activeFinancialDays)], ['Current revenue/day', money(metrics.revenuePerActiveDay)], ['Projected period revenue', money(metrics.projectedRevenue)]]
    return metrics.trips.map(t => [`${t.operator || 'Trip'}`, `${t.tripStartAt || '—'} → ${t.tripEndAt || '—'}`, `KM ${num(t.tripKm)}`, `Revenue ${money(t.revenue)}`])
  }
  if (card === 'cost') {
    if (layer === 0) return [['Actual operating cost', money(metrics.actualOperatingCost)], ['Maintenance provision', money(metrics.maintenanceProvision)], ['Break-even / set-aside basis', money(metrics.actualOperatingCost + metrics.maintenanceProvision)], ['Loan provision', status.loan ? 'Calculated' : 'Not available'], ['Compliance provision', status.compliance ? 'Calculated' : 'Not available']]
    if (layer === 1) return [['Fuel', money(metrics.fuelCost)], ['Maintenance provision', money(metrics.maintenanceProvision)], ['Toll', money(metrics.toll)], ['Parking', money(metrics.parking)], ['Loan', status.loan ? 'Calculated' : 'Not available'], ['Compliance', status.compliance ? 'Calculated' : 'Not available']]
    if (layer === 2) return [['Fuel cost', money(metrics.fuelCost)], ['Fuel quantity', `${num(metrics.fuelQty)} kg`], ['Cost/KM', money(metrics.costPerKm)], ['Vehicle KM', num(metrics.vehicleKm)], ['Previous operating cost', money(metrics.previous.actualOperatingCost || metrics.previous.cost)]]
    if (layer === 3) return [['Break-even basis', money(metrics.actualOperatingCost + metrics.maintenanceProvision)], ['Actual operating cost', money(metrics.actualOperatingCost)], ['Maintenance provision', money(metrics.maintenanceProvision)], ['Loan provision', status.loan ? 'Calculated' : 'Not available'], ['Compliance provision', status.compliance ? 'Calculated' : 'Not available'], ['Completeness', status.loan && status.compliance ? 'Complete' : 'Incomplete inputs']]
    return [...metrics.fuelLogs.map(f => [`Fuel ${f.capturedAt || f.createdAt}`, money(f.amount), `${num(f.quantityKg ?? f.kg)} kg`, `Odo ${num(f.odometer)}`]), ...metrics.shifts.map(s => [`Shift ${s.shiftEndAt || s.shiftStartAt}`, `Toll ${money(s.toll)}`, `Parking ${money(s.parking)}`, `KM ${num(s.totalDistance)}`])]
  }
  if (layer === 0) return [['Revenue', money(metrics.revenue)], ['Actual operating cost', money(metrics.actualOperatingCost)], ['Actual profit/loss', money(metrics.actualProfit)], ['Profit/KM', money(metrics.profitPerKm)], ['Profit/hour', '—'], ['Data status', 'Hourly data not persisted']]
  if (layer === 1) return [['EMI provision', status.loan ? 'Calculated' : 'Not available'], ['Maintenance provision', money(metrics.maintenanceProvision)], ['Compliance provision', status.compliance ? 'Calculated' : 'Not available'], ['Provision set aside', money(metrics.provisionSetAside)], ['Coverage', 'Maintenance only']]
  if (layer === 2) return [['EMI', status.loan ? 'Calculated' : 'Not available'], ['Maintenance', money(metrics.maintenanceProvision)], ['Compliance', status.compliance ? 'Calculated' : 'Not available'], ['Rule', 'Three primary provision buckets']]
  if (layer === 3) return [['Revenue', money(metrics.revenue)], ['Set Aside — Costs & Obligations', money(metrics.actualOperatingCost + metrics.provisionSetAside)], ['Available Profit', money(metrics.availableProfit)], ['Actual Profit/Loss', money(metrics.actualProfit)], ['Fuel treatment', 'Fuel already paid is actual expense']]
  if (layer === 4) return [['Current profit', money(metrics.actualProfit)], ['Previous period profit', money(metrics.previous.actualProfit || metrics.previous.profit)], ['Profit variance', money(metrics.actualProfit - (metrics.previous.actualProfit || metrics.previous.profit))], ['Growth', pct(metrics.profitGrowth)], ['Profit/KM', money(metrics.profitPerKm)]]
  return metrics.trips.map(t => [`${t.operator || 'Trip'}`, `${t.tripStartAt || '—'} → ${t.tripEndAt || '—'}`, `Revenue ${money(t.revenue)}`, `KM ${num(t.tripKm)}`])
}
