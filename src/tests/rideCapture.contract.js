import assert from 'node:assert/strict'
import { normalizeRideExtraction, validateRideExtraction } from '../domain/rideCapture/rideRecord.js'
import { createRideCaptureProvider } from '../application/rideCapture/rideCaptureProvider.js'

const valid = normalizeRideExtraction({
  shiftId: 'shift-1', operator: 'Uber', pickupAddress: 'Andheri East', dropAddress: 'BKC',
  fare: '327', durationMinutes: '42', rideStartAt: '2026-09-16T10:15:00+05:30', rideEndAt: '2026-09-16T10:57:00+05:30', rideKm: '18.4', cancellation: ''
})
const result = validateRideExtraction(valid)
assert.equal(result.valid, true)
assert.equal(result.value.fare, 327)
assert.equal(result.value.rideKm, 18.4)
assert.equal(result.value.shiftId, 'shift-1')

const invalid = validateRideExtraction(normalizeRideExtraction({ ...valid, fare: -1 }))
assert.equal(invalid.valid, false)
assert.ok(invalid.errors.some(error => error.includes('Fare')))

const reversed = validateRideExtraction(normalizeRideExtraction({ ...valid, rideEndAt: '2026-09-16T10:10:00+05:30' }))
assert.equal(reversed.valid, false)
assert.ok(reversed.errors.some(error => error.includes('end time')))

const provider = createRideCaptureProvider({ async extractRide(image) { assert.equal(image.mimeType, 'image/png'); return valid } })
const extracted = await provider.extractRide({ mimeType: 'image/png' })
assert.equal(extracted.operator, 'Uber')

await assert.rejects(() => createRideCaptureProvider().extractRide({ mimeType: 'image/png' }), /not configured/i)
console.log('Ride Capture contract passed: canonical fields, validation and provider independence are intact.')
