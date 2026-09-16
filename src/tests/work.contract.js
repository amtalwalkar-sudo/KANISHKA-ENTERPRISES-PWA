import assert from 'node:assert/strict'
import { validateShiftStartOdometer, validateGapAllocation } from '../domain/work/shift.js'
import { validateEndShiftEntry } from '../domain/work/endShift.js'
import { WORK_TRIP_OPERATORS, validateTripOperator, validateTripCorrection, calculateShiftRevenue } from '../domain/work/trip.js'
import { calculateFuelQuantity } from '../domain/work/fuel.js'

assert.deepEqual(validateShiftStartOdometer(100, 90), { valid: true, gapKm: 10 })
assert.equal(validateShiftStartOdometer(89, 90).valid, false)
assert.equal(validateGapAllocation(10, 4.1, 5.9).valid, true)
assert.equal(validateGapAllocation(10, 4, 5.5).valid, false)
assert.equal(validateEndShiftEntry({ closingOdometer: 100, startOdometer: 100 }).valid, true)
assert.equal(validateEndShiftEntry({ closingOdometer: 99, startOdometer: 100 }).valid, false)
assert.deepEqual(WORK_TRIP_OPERATORS, ['Uber', 'One way', 'Rapido', 'Ola', 'Savaari'])
assert.equal(validateTripOperator('Uber').valid, true)
assert.equal(validateTripOperator('Unknown').valid, false)
assert.equal(validateTripCorrection({ operator: 'Ola', tripKm: '12.5', revenue: '300' }).valid, true)
assert.equal(calculateShiftRevenue([{ status: 'COMPLETED', revenue: 100 }, { status: 'CANCELLED', revenue: 500 }, { status: 'COMPLETED', revenue: null }]), 100)
assert.equal(calculateFuelQuantity({ pricePerKg: 82, amount: 410 }).quantityKg, 5)

console.log('KFE Work contract tests: PASS')
