import assert from 'node:assert/strict'
import { validateAdminForm, inspectAdminImpact } from '../domain/adminRules.js'

const field = (name, required = false) => ({ name, type: 'text', required })

const shiftFields = [field('shiftStart', true), field('shiftEnd'), field('openingOdometer', true), field('closingOdometer', true), field('shiftRevenue')]
const validShift = { shiftStart: '2026-09-15T08:00', shiftEnd: '2026-09-15T20:00', openingOdometer: '65000', closingOdometer: '65400', shiftRevenue: '5000' }

assert.equal(validateAdminForm(shiftFields, validShift).valid, true)
assert.equal(validateAdminForm(shiftFields, { ...validShift, closingOdometer: '64000' }).valid, false)
assert.equal(validateAdminForm([field('amount', true)], { amount: '-1' }).valid, false)
assert.equal(validateAdminForm([field('amount', true)], {}).valid, false)

const warningFields = [field('tripKm')]
assert.equal(validateAdminForm(warningFields, { tripKm: '1200' }).valid, true)
assert.ok(inspectAdminImpact('TRIP', { tripKm: '1200' }, null).length > 0)
assert.ok(inspectAdminImpact('SHIFT', { closingOdometer: '64000' }, { endOdometer: '65000' }).length > 0)

console.log('Admin safety contracts passed.')
