import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

const navigation = read('js/ui/navigation.js');
const timeline = read('js/ui/timeline.js');
const app = read('src/App.vue');
const shell = read('src/styles/shell.css');
const forms = read('src/components/KfeFormShell.vue');
const vehicle = read('src/components/VehicleModuleView.vue');
const maintenance = read('src/components/MaintenanceModuleView.vue');

assert.match(navigation, /Work.*Status.*Timeline.*More/s);
assert.match(navigation, /Timeline.*Today.*Week.*Month.*Year/s);
assert.doesNotMatch(navigation, /Fleet|Reports|Analytics|GPS|OCR|Advisor/);
assert.match(timeline, /occurredAt/);
assert.match(timeline, /sort\(\(a, b\)/);
assert.doesNotMatch(app, /Tax Reserve|tax reserve/i);
assert.doesNotMatch(shell, /Tax Reserve|tax reserve/i);
assert.match(forms, /Unsaved draft/);
assert.match(forms, /localStorage/);
assert.match(forms, /emit\('save'/);
assert.match(vehicle, /Acquisition date/);
assert.match(vehicle, /Retirement date/);
assert.match(maintenance, /Category/);
assert.match(maintenance, /Odometer/);
assert.match(maintenance, /Receipt \/ reference/);

console.log('Phase 6 UI shell contract: PASS');
console.log('Frozen primary navigation, timeline chronology, draft boundary, vehicle lifecycle, maintenance capture, and Tax Reserve exclusion verified.');
