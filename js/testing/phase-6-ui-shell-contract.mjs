import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const readAdminParts = () => fs.readdirSync(new URL('../../src/components/admin/', import.meta.url), { withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith('.vue'))
  .map(entry => fs.readFileSync(new URL(`../../src/components/admin/${entry.name}`, import.meta.url), 'utf8'))
  .join('\n');

const navigation = read('js/ui/navigation.js');
const app = read('src/App.vue');
const shell = read('src/presentation/shell/shells/current/CurrentShell.vue');
const css = read('src/styles/shell.css');
const performance = read('src/components/PerformanceModuleView.vue');
const admin = read('src/components/AdminModuleView.vue');
const adminParts = readAdminParts();
const loanDomain = read('js/domain/loans.js');
const loanRepository = read('js/application/loan-repository.js');

// Current presentation boundary: CurrentShell owns the header, primary navigation,
// settings actions, and single structural viewport. App.vue owns only the module canvas.
assert.match(shell,/Performance.*Admin/s);
assert.doesNotMatch(shell,/Work|Timeline/);
assert.doesNotMatch(shell,/More/);
assert.match(shell,/Settings/);
assert.match(shell,/Backup/);
assert.match(shell,/Restore/);
assert.match(shell,/Data reset/);
assert.match(shell,/createObjectURL/);
assert.match(shell,/restoreBackup/);
assert.match(shell,/resetAllData/);
assert.match(shell,/location\.hash/);
assert.match(shell,/hashchange/);
assert.match(shell,/<header/);
assert.match(shell,/<main/);
assert.match(shell,/<nav/);
assert.equal((shell.match(/<main/g)||[]).length,1,'structural shell must have one main viewport');
assert.doesNotMatch(shell,/kfe-swipe-bar|KfeSwipeBar|Tax Reserve|tax reserve/i);
assert.doesNotMatch(shell,/Fleet|Reports|Analytics|GPS|OCR|Advisor/);

// App is the production module canvas for the currently active surfaces only.
// Work and Timeline have been intentionally wiped from presentation and can be rebuilt later.
assert.match(app,/activeModule/);
assert.doesNotMatch(app,/WorkSessionView|KfeTimelineView/);
assert.match(app,/PerformanceModuleView/);
assert.match(app,/AdminModuleView/);
assert.match(app,/activeModule === 'Performance'/);
assert.match(app,/activeModule === 'Admin'/);
assert.doesNotMatch(app,/activeModule === 'Work'|activeModule === 'Timeline'/);
assert.doesNotMatch(app,/class="empty-module"/);
assert.doesNotMatch(app,/FuelForm/);
assert.doesNotMatch(app,/VehicleModuleView|MaintenanceModuleView|ComplianceModuleView|LoanModuleView/);
assert.doesNotMatch(app,/HistoricalEntriesView/);
assert.doesNotMatch(app,/FuelQuickEntry|FuelQuickAction|Quick fuel/i);
assert.doesNotMatch(app,/Tax Reserve|tax reserve/i);

// Underlying navigation remains a generic boundary, but wiped presentation destinations
// are no longer exposed by the current shell.
assert.doesNotMatch(navigation,/More/);
assert.doesNotMatch(navigation,/Work|Timeline/);
assert.doesNotMatch(navigation,/Status/);
assert.doesNotMatch(navigation,/Today.*Month.*Year/s);
assert.doesNotMatch(navigation,/Fleet|Reports|Analytics|GPS|OCR|Advisor/);

// Performance and Admin remain functional surfaces beneath the neutral shell.
for(const text of ['Today’s Position','Revenue','Running Cost','Balance','History & context','Authoritative','unavailable']) assert.match(performance,new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
assert.doesNotMatch(performance,/Tomorrow target|Status unavailable/i);
assert.match(admin,/getAdminState/);
for(const text of ['CURRENT STATE','ATTENTION','INSIGHT','PROFITABILITY','BREAK-EVEN','Month View','Finance','Management']) assert.match(adminParts,new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
assert.doesNotMatch(admin,/indexedDB|localStorage|sessionStorage/);
assert.doesNotMatch(adminParts,/Timeline|View Timeline/);
assert.match(adminParts,/Settings/);

// Business contracts remain below the presentation boundary and are validated through
// their live domain/application files, not the deleted legacy module UI contract layer.
assert.match(loanRepository,/LOAN_PAYMENT_STORE/);
assert.match(loanDomain,/amortize/);
assert.match(loanDomain,/applyPrepayment/);
assert.doesNotMatch(css,/Tax Reserve|tax reserve/i);

console.log('Phase 6 UI shell contract: PASS');
console.log('CurrentShell boundary, active Performance/Admin surfaces, wiped Work/Timeline presentation absence, settings actions, and underlying ERP contracts verified.');
