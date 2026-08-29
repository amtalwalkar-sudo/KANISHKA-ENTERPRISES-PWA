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
const compliance = read('src/components/ComplianceModuleView.vue');
const modules = read('src/components/KfeModuleView.vue');

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
assert.match(vehicle, /save-request/);
assert.doesNotMatch(vehicle, /Promise\.resolve|saved\.value\s*=\s*true/);
assert.match(maintenance, /Category/);
assert.match(maintenance, /Odometer/);
assert.match(maintenance, /Receipt \/ reference/);
assert.match(maintenance, /save-request/);
assert.doesNotMatch(maintenance, /Promise\.resolve|saved\.value\s*=\s*true/);
assert.match(compliance, /Renewal type/);
assert.match(compliance, /Validity start/);
assert.match(compliance, /Validity end/);
assert.match(compliance, /save-request/);

// The frozen rule is that this business state must NOT exist.
// Compliance may explain that exclusion to the driver, so do not reject the phrase itself.
// Reject only an actual state identifier/option being introduced into the UI implementation.
assert.doesNotMatch(compliance, /renewedButUnpaid|renewed-but-unpaid|renewed_unpaid|paymentStatus\s*[:=]\s*['\"]?renewed/i);

// Loan presentation must expose the frozen financial hierarchy without implementing calculations in presentation.
assert.match(modules, /Loan status/);
assert.match(modules, /EMI/);
assert.match(modules, /Outstanding balance/);
assert.match(modules, /Vehicle association/);
assert.match(modules, /Payment history/);
assert.match(modules, /Amortization/);
assert.match(modules, /Prepayment calculator/);
assert.match(modules, /Zero prepayment charges/);
assert.match(modules, /save-request/);
assert.doesNotMatch(modules, /principalComponent\s*=|interestComponent\s*=|remainingBalance\s*=.*\/|calculateAmortization|calculatePrepayment/i);

console.log('Phase 6 UI shell contract: PASS');
console.log('Frozen navigation, timeline chronology, draft boundary, vehicle lifecycle, maintenance capture, compliance renewal flow, loan presentation, Tax Reserve exclusion, and application persistence boundaries verified.');
