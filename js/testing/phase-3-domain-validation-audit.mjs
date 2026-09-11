import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ShiftValidator } from '../../src/services/shiftValidator.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')

const valid = ShiftValidator.validateSubmission({
  startOdometer: 100000,
  endOdometer: 100250,
  revenue: 1200
})
assert.equal(valid.valid, true)
assert.equal(valid.values.totalDistance, 250)

const overDistance = ShiftValidator.validateSubmission({
  startOdometer: 100000,
  endOdometer: 101001,
  revenue: 1200
})
assert.equal(overDistance.valid, false)
assert.match(overDistance.errors[0], /1000 km/)

const overRevenue = ShiftValidator.validateSubmission({
  startOdometer: 100000,
  endOdometer: 100100,
  revenue: 5001
})
assert.equal(overRevenue.valid, false)
assert.match(overRevenue.errors[0], /₹0 and ₹5,000/)

const invalidEnd = ShiftValidator.validateSubmission({
  startOdometer: 100000,
  endOdometer: 99999,
  revenue: 500
})
assert.equal(invalidEnd.valid, false)
assert.match(invalidEnd.errors[0], /strictly greater/)

const workCycle = fs.readFileSync(path.join(repoRoot, 'src/stores/workCycle.js'), 'utf8')
assert.match(workCycle, /ShiftValidator\.validateSubmission/)
assert.match(workCycle, /OdometerAuditService\.auditShiftBoundary/)
assert.match(workCycle, /void OdometerAuditService\.auditShiftBoundary/)
assert.doesNotMatch(workCycle, /from ['"].*utils\/indexedDB['"]/) 

const auditService = fs.readFileSync(path.join(repoRoot, 'src/services/odometerAuditService.js'), 'utf8')
assert.match(auditService, /UNEXPLAINED_DISCREPANCY/)
assert.match(auditService, /OdoGapRepository\.create/)
assert.match(auditService, /catch \(error\)/)

console.log('Phase 3 domain validation and odometer audit contract: PASS')
