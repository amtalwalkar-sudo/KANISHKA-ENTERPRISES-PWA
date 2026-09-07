import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

const navigation = read('js/ui/navigation.js');
const timeline = read('js/ui/timeline.js');
const app = read('src/App.vue');
const shell = read('src/presentation/shell/shells/current/CurrentShell.vue');
const css = read('src/styles/shell.css');
const performance = read('src/components/PerformanceModuleView.vue');
const admin = read('src/components/AdminModuleView.vue');
const loanDomain = read('js/domain/loans.js');
const loanRepository = read('js/application/loan-repository.js');
const contracts = read('js/ui/module-contracts.js');

// Current presentation boundary: CurrentShell owns the header, primary navigation,
// settings actions, and single structural viewport. App.vue owns only the module canvas.
assert.match(shell,/Work.*Performance.*Timeline.*Admin/s);
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

// App is intentionally a clean module canvas: Work and Timeline are blank,
// while Performance and Admin remain the active functional surfaces.
assert.match(app,/activeModule/);
assert.match(app,/PerformanceModuleView/);
assert.match(app,/AdminModuleView/);
assert.match(app,/activeModule === 'Work'/);
assert.match(app,/activeModule === 'Timeline'/);
assert.match(app,/class="empty-module"/);
assert.doesNotMatch(app,/FuelForm/);
assert.doesNotMatch(app,/VehicleModuleView|MaintenanceModuleView|ComplianceModuleView|LoanModuleView/);
assert.doesNotMatch(app,/HistoricalEntriesView/);
assert.doesNotMatch(app,/FuelQuickEntry|FuelQuickAction|Quick fuel/i);
assert.doesNotMatch(app,/Tax Reserve|tax reserve/i);

// Preserve the underlying navigation/timeline contracts without requiring legacy
// presentation components to be mounted in the clean shell.
assert.match(navigation,/Work.*Performance.*Timeline.*Admin/s);
assert.doesNotMatch(navigation,/More/);
assert.match(navigation,/TIMELINE_HORIZONS=Object\.freeze\(\['Day','Week','Long-term'\]\)/);
assert.doesNotMatch(navigation,/Status/);
assert.doesNotMatch(navigation,/Today.*Month.*Year/s);
assert.doesNotMatch(navigation,/Fleet|Reports|Analytics|GPS|OCR|Advisor/);
assert.match(timeline,/occurredAt/);
assert.match(timeline,/sort\(\(a,b\)/);
assert.match(timeline,/filter\(e=>\{if\(!e\.occurredAt\)return false/);

// Performance and Admin remain functional surfaces beneath the neutral shell.
for(const text of ['Today’s Position','Revenue','Running Cost','Balance','History & context','Authoritative','unavailable']) assert.match(performance,new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
assert.doesNotMatch(performance,/Tomorrow target|Status unavailable/i);
for(const text of ['CURRENT STATE','ATTENTION','INSIGHT','PROFITABILITY','BREAK-EVEN','Month View','Finance','Management','View Timeline','getAdminState']) assert.match(admin,new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
assert.doesNotMatch(admin,/indexedDB|localStorage|sessionStorage/);
assert.match(admin,/Settings/);

// Business contracts remain below the presentation boundary.
assert.match(loanRepository,/LOAN_PAYMENT_STORE/);
assert.match(loanDomain,/amortize/);
assert.match(loanDomain,/applyPrepayment/);
assert.doesNotMatch(contracts,/taxReserve|Tax Reserve/);
assert.match(contracts,/vehicle:/);
assert.match(contracts,/driver:/);
assert.match(contracts,/analytics: false/);
assert.doesNotMatch(css,/Tax Reserve|tax reserve/i);

console.log('Phase 6 UI shell contract: PASS');
console.log('CurrentShell boundary, clean Work/Timeline canvas, Performance/Admin surfaces, navigation/timeline foundations, settings actions, and underlying ERP contracts verified.');
