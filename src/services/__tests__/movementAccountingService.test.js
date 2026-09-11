import assert from 'node:assert/strict'
import { MovementAccountingService, haversineDistanceKm } from '../movementAccountingService.js'

const garage = { latitude: 19.0000, longitude: 72.0000, accuracy: 5 }
const pickup1 = { latitude: 19.0100, longitude: 72.0000, accuracy: 5 }
const drop1 = { latitude: 19.0200, longitude: 72.0000, accuracy: 5 }
const pickup2 = { latitude: 19.0300, longitude: 72.0000, accuracy: 5 }
const drop2 = { latitude: 19.0400, longitude: 72.0000, accuracy: 5 }

const trips = [
  { status: 'COMPLETED', tripStartAt: '2026-09-12T08:00:00Z', tripEndAt: '2026-09-12T08:30:00Z', tripStartLocation: pickup1, tripEndLocation: drop1 },
  { status: 'COMPLETED', tripStartAt: '2026-09-12T09:00:00Z', tripEndAt: '2026-09-12T09:30:00Z', tripStartLocation: pickup2, tripEndLocation: drop2 }
]

const result = await MovementAccountingService.calculateDeadMiles({ garageLocation: garage, trips })

assert.equal(result.segments.length, 5)
assert.deepEqual(result.segments.map((s) => s.label), [
  'GARAGE_TO_FIRST_PICKUP',
  'TRIP_1_BUSINESS',
  'TRIP_1_END_TO_TRIP_2_START',
  'TRIP_2_BUSINESS',
  'LAST_TRIP_TO_GARAGE'
])
assert.equal(result.segments.filter((s) => s.classification === 'DEAD').length, 3)
assert.ok(result.deadMilesKm > 0)
assert.ok(result.businessMilesKm > 0)
assert.ok(haversineDistanceKm(garage, pickup1) > 0)

const missing = await MovementAccountingService.calculateDeadMiles({
  garageLocation: garage,
  trips: [{ ...trips[0], tripEndLocation: null }]
})
assert.equal(missing.segments[1].distanceKm, null)
assert.ok(missing.deadMilesKm >= 0)
console.log('Movement accounting contract passed.')
