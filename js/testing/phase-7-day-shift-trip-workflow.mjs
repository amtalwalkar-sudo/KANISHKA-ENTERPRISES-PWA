import fs from 'node:fs'
import assert from 'node:assert/strict'

const read = (p) => fs.readFileSync(p, 'utf8')
const db = read('src/utils/indexedDB.js')
const repo = read('src/repositories/dayShiftTripRepository.js')
const store = read('src/stores/dayShiftTrip.js')
const app = read('src/App.vue')
const gps = read('src/services/locationService.js')
const movement = read('src/services/movementAccountingService.js')
const notification = read('src/services/tripNotificationService.js')

assert.match(db, /CANONICAL_DB_VERSION = 3/)
for (const name of ['days','trips','gps_snapshots']) assert.match(db, new RegExp(`createObjectStore\\('${name}'`))
assert.match(repo, /saveMutation.*record.id,'DAY','CREATE'/); assert.match(repo, /saveMutation.*record.id,'SHIFT','CREATE'/); assert.match(repo, /saveMutation.*record.id,'TRIP','CREATE'/)
assert.match(repo, /businessKm:null/); assert.match(repo, /deadKm:null/); assert.match(repo, /movementReconciliationStatus:'PENDING'/)
assert.match(store, /isDayOnline/); assert.match(store, /isShiftActive/); assert.match(store, /isTripActive/)
assert.match(store, /recordMissedTrip/); assert.match(store, /LocationService\.startActiveShiftSnapshots/); assert.match(store, /entityType:'SHIFT'/); assert.match(store, /getForEntity\(shift.value.id\)/)
assert.match(app, /SHIFT: \{\{ store\.headerShiftStatus \}\}/); assert.match(app, /TRIP: \{\{ store\.headerTripStatus \}\}/)
assert.match(gps, /5 \* 60 \* 1000/); assert.match(gps, /startActiveShiftSnapshots/); assert.match(gps, /foregroundServiceType/) 
assert.match(movement, /gpsSnapshots/); assert.match(movement, /ROUTED_TRACE/); assert.match(movement, /pointsBetween/)
assert.match(notification, /START_TRIP/); assert.match(notification, /END_TRIP/)
console.log('Phase 7 Day/Shift/Trip whole-shift GPS contract passed.')
