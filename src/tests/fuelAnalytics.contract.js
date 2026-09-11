import { FuelAnalyticsService } from '../services/fuelAnalyticsService.js'
import { ShiftRepository } from '../repositories/shiftRepository.js'
import { FuelRepository } from '../repositories/fuelRepository.js'

let mockShifts = []
let mockFuelLogs = []

ShiftRepository.getAll = async () => mockShifts
FuelRepository.getAll = async () => mockFuelLogs

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const assertFiniteMetrics = (metrics, label) => {
  const numericMetrics = [
    'totalDistance',
    'totalRevenue',
    'totalFuelQty',
    'totalFuelCost',
    'netRevenue',
    'efficiencyKmPerUnit',
    'fuelCostPerKm',
    'netProfitPerKm'
  ]

  for (const key of numericMetrics) {
    assert(Number.isFinite(metrics[key]), `${label}: ${key} is not finite`)
  }
}

async function runContractTests() {
  console.log('--- Running Phase 4 FuelAnalyticsService Contract Tests ---')

  mockShifts = []
  mockFuelLogs = []
  let m = await FuelAnalyticsService.getPerformanceMetrics()
  assert(m.totalDistance === 0 && m.efficiencyKmPerUnit === 0 && m.fuelCostPerKm === 0, 'Case 1 Failed: Empty dataset')
  assertFiniteMetrics(m, 'Case 1')

  mockShifts = [{ startOdometer: 1000, endOdometer: 1200, revenue: 1500 }]
  mockFuelLogs = []
  m = await FuelAnalyticsService.getPerformanceMetrics()
  assert(m.totalDistance === 200 && m.efficiencyKmPerUnit === 0 && m.netProfitPerKm === 7.5, 'Case 2 Failed: Shifts without fuel')
  assertFiniteMetrics(m, 'Case 2')

  mockShifts = []
  mockFuelLogs = [{ quantity: 10, totalCost: 800 }]
  m = await FuelAnalyticsService.getPerformanceMetrics()
  assert(m.totalFuelQty === 10 && m.efficiencyKmPerUnit === 0 && m.netProfitPerKm === 0, 'Case 3 Failed: Fuel without shifts')
  assertFiniteMetrics(m, 'Case 3')

  mockShifts = [{ startOdometer: 1000, endOdometer: 1300, revenue: 3000 }]
  mockFuelLogs = [{ quantity: 15, totalCost: 1200 }]
  m = await FuelAnalyticsService.getPerformanceMetrics()
  assert(m.totalDistance === 300, `Case 4 Distance Failed: Got ${m.totalDistance}`)
  assert(m.efficiencyKmPerUnit === 20, `Case 4 Efficiency Failed: Got ${m.efficiencyKmPerUnit}`)
  assert(m.fuelCostPerKm === 4, `Case 4 Cost/KM Failed: Got ${m.fuelCostPerKm}`)
  assert(m.netProfitPerKm === 6, `Case 4 Profit/KM Failed: Got ${m.netProfitPerKm}`)
  assertFiniteMetrics(m, 'Case 4')

  mockShifts = [{ startOdometer: '1000', endOdometer: '1100', revenue: '1000' }]
  mockFuelLogs = [{ quantity: '5', totalCost: '400' }]
  m = await FuelAnalyticsService.getPerformanceMetrics()
  assert(m.totalDistance === 100 && m.efficiencyKmPerUnit === 20 && m.fuelCostPerKm === 4 && m.netProfitPerKm === 6, 'Case 5 Failed: String numbers')
  assertFiniteMetrics(m, 'Case 5')

  mockShifts = [{ startOdometer: 'invalid', endOdometer: null, totalDistance: -50, revenue: -100 }]
  mockFuelLogs = [{ quantity: -10, totalCost: -500 }]
  m = await FuelAnalyticsService.getPerformanceMetrics()
  assertFiniteMetrics(m, 'Case 6')
  assert(m.totalDistance === 0 && m.totalRevenue === 0 && m.totalFuelQty === 0 && m.totalFuelCost === 0, 'Case 6 Failed: Invalid values were not sanitized')

  console.log('✅ All Phase 4 Contract Tests Passed Successfully!')
}

runContractTests().catch((error) => {
  console.error('❌ Phase 4 Contract Tests Failed:', error)
  process.exitCode = 1
})
