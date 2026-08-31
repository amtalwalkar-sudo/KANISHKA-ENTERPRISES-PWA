import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

const navigation = read('js/ui/navigation.js');
const timeline = read('js/ui/timeline.js');
const app = read('src/App.vue');
const shell = read('src/styles/shell.css');
const forms = read('src/components/KfeFormShell.vue');
const vehicle = read('src/components/VehicleModuleView.vue');
const driver = read('src/components/DriverModuleView.vue');
const maintenance = read('src/components/MaintenanceModuleView.vue');
const compliance = read('src/components/ComplianceModuleView.vue');
const loan = read('src/components/LoanModuleView.vue');
const modules = read('src/components/KfeModuleView.vue');
const historical = read('src/components/HistoricalEntriesView.vue');
const loanBoundary = read('js/application/loan-module.js');
const loanDomain = read('js/domain/loans.js');
const loanRepository = read('js/application/loan-repository.js');
const contracts = read('js/ui/module-contracts.js');

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
assert.match(vehicle, /emit\('open', 'Driver'\)/);
assert.doesNotMatch(vehicle, /Activated|activation tab/i);
assert.doesNotMatch(vehicle, /Fleet|fleet management/i);
assert.doesNotMatch(vehicle, /Promise\.resolve|saved\.value\s*=\s*true/);

assert.match(driver, /Driver attached to the current vehicle/);
assert.match(driver, /analytics are not part of the current KFE scope/i);
assert.match(driver, /save-request/);
assert.doesNotMatch(driver, /Online time|Number of rides|Revenue generated/i);

assert.match(maintenance, /Category/);
assert.match(maintenance, /Odometer/);
assert.match(maintenance, /Receipt \/ reference/);
assert.match(maintenance, /save-request/);
assert.doesNotMatch(maintenance, /Promise\.resolve|saved\.value\s*=\s*true/);

assert.match(compliance, /Renewal type/);
assert.match(compliance, /Validity start/);
assert.match(compliance, /Validity end/);
assert.match(compliance, /save-request/);
assert.doesNotMatch(compliance, /renewedButUnpaid|renewed-but-unpaid|renewed_unpaid|paymentStatus\s*[:=]\s*['\"]?renewed/i);

assert.match(app, /LoanModuleView/);
assert.match(app, /activeModule\s*===\s*['"]Loans['"]/);
assert.match(app, /HistoricalEntriesView/);
assert.match(app, /activeModule\s*===\s*['"]Historical Entries['"]/);
assert.match(app, /HistoricalEntriesView[\s\S]*@save-request="handleHistoricalSave"/);
assert.match(historical, /Historical Day/);
assert.match(historical, /Historical Fuel/);
assert.match(historical, /save-request/);

const requiredModules = ['Vehicle','Driver','Fuel','Expenses','Revenue','Loans','Maintenance','Compliance','Dashboard','Profitability','Historical Entries','Settings'];
for (const module of requiredModules) assert.match(app, new RegExp(module.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

assert.match(loan, /Loan status/);
assert.match(loan, /EMI/);
assert.match(loan, /Outstanding balance/);
assert.match(loan, /Vehicle association/);
assert.match(loan, /Payment history/);
assert.match(loan, /Amortization schedule/);
assert.match(loan, /Prepayment calculator/);
assert.match(loan, /Zero/);
assert.match(loan, /calculation-request/);
assert.doesNotMatch(loan, /function\s+(amortize|calculateAmortization|calculatePrepayment)\b/);
assert.doesNotMatch(loan, /principalComponent\s*=|interestComponent\s*=|remainingBalance\s*=.*\/|Math\.(round|min|max).*balance/i);
assert.match(loanBoundary, /createLoanApplicationBoundary/);
assert.match(loanRepository, /LOAN_PAYMENT_STORE/);
assert.match(loanDomain, /amortize/);
assert.match(loanDomain, /applyPrepayment/);
assert.doesNotMatch(modules, /Tax Reserve|tax reserve/i);

assert.match(contracts, /vehicle:/);
assert.match(contracts, /driver:/);
assert.match(contracts, /analytics: false/);

console.log('Phase 6 UI shell contract: PASS');
console.log('Navigation, module routing, Historical Entries event wiring, timeline chronology, draft boundary, vehicle/driver lifecycle, maintenance, compliance, loan presentation/domain separation, and Tax Reserve exclusion verified.');
