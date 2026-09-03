import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile('src/App.vue','utf8');
const performance=await readFile('js/application/read-models.js','utf8');
const timeline=await readFile('js/ui/timeline.js','utf8');
const work=await readFile('src/components/WorkSessionView.vue','utf8');

assert.match(app,/const PRIMARY_DESTINATIONS=\['Work','Performance','Timeline'\]/);
assert.match(app,/Administrative\/back-office ERP modules/);
assert.match(app,/Add fuel from any Work state/);
assert.match(app,/authoritative-odometer=\"workHeader\.latestOdometer\"/);
assert.doesNotMatch(app,/trip planning/i);
assert.match(performance,/const runningCostPaise=/);
assert.match(performance,/const balancePaise=/);
assert.match(performance,/const runningCostPerKmPaise=/);
assert.match(performance,/businessMaintenance/);
assert.match(timeline,/deriveTimelineDistances/);
assert.match(timeline,/locationArea/);
assert.doesNotMatch(timeline,/key\.includes\('mumbai'\)/);
assert.match(work,/FuelQuickEntry/);

console.log('THREE_SCREEN_DRIVER_CORRECTIONS=PASS');
console.log('DRIVER_PRIMARY_SCREENS=Work,Performance,Timeline');
console.log('TRIP_PLANNING=NOT_IMPLEMENTED');
