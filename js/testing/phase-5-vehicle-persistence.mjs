import assert from 'node:assert/strict';
import {DB_VERSION,STORES} from '../core/hardened-db.js';
assert.equal(DB_VERSION,8);
for(const name of ['vehicles','vehicle_lifecycle_events','drivers','vehicle_driver_assignments','vehicle_odometer_readings','vehicle_disposal_records'])assert.ok(STORES[name],`Missing ${name}`);
assert.equal(STORES.vehicles.keyPath,'id');
assert.equal(STORES.vehicle_lifecycle_events.keyPath,'id');
assert.equal(STORES.vehicle_odometer_readings.keyPath,'id');
assert.equal(STORES.vehicle_disposal_records.keyPath,'id');
console.log('PHASE_5_VEHICLE_PERSISTENCE=PASS');
