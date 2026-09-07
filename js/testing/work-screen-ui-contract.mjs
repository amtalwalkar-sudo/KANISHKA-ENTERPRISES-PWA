import assert from 'node:assert:strict';
import fs from 'node:fs/promises';

const shell=await fs.readFile(new URL('../../src/presentation/shell/shells/current/CurrentShell.vue',import.meta.url),'utf8');
const app=await fs.readFile(new URL('../../src/App.vue',import.meta.url),'utf8');
const css=await fs.readFile(new URL('../../src/styles/shell.css',import.meta.url),'utf8');

// Work is intentionally a clean presentation canvas. Operational behavior is
// tested below this boundary by the application/domain contracts.
for(const token of ['Work','Performance','Timeline','Admin','Backup','Restore','Data reset']) assert.ok(shell.includes(token),`CurrentShell missing ${token}`);
assert.ok(shell.includes('<header'),'CurrentShell header missing');
assert.ok(shell.includes('<main'),'CurrentShell main missing');
assert.ok(shell.includes('<nav'),'CurrentShell navigation missing');
assert.equal((shell.match(/<main/g)||[]).length,1,'CurrentShell must have one main');
assert.ok(shell.includes('location.hash')&&shell.includes('hashchange'),'CurrentShell route boundary missing');
assert.ok(shell.includes('exportBackup')&&shell.includes('restoreBackup')&&shell.includes('resetAllData'),'Settings data actions missing');
assert.doesNotMatch(shell,/kfe-swipe-bar|KfeSwipeBar|pointerdown|pointerup|Tax Reserve|tax reserve/i);

assert.ok(app.includes("activeModule = ref('Work')"),'App must default to Work');
for(const module of ['Work','Performance','Timeline','Admin']) assert.ok(app.includes(`activeModule === '${module}'`),`App missing ${module} canvas`);
assert.ok(app.includes('PerformanceModuleView')&&app.includes('AdminModuleView'),'Functional Performance/Admin surfaces missing');
assert.doesNotMatch(app,/WorkSessionView|FuelForm|VehicleModuleView|MaintenanceModuleView|ComplianceModuleView|LoanModuleView|HistoricalEntriesView|FuelQuickEntry|FuelQuickAction|kfe:work-state-changed|data-kfe-action|kfe-swipe-bar|KfeSwipeBar/i);

assert.ok(css.includes('prefers-reduced-motion'),'Reduced-motion foundation missing');
assert.ok(css.includes('min-width:48px')&&css.includes('min-height:48px'),'Touch target foundation missing');
console.log('PASS: current Work presentation contract is a clean canvas with the four-module shell and no legacy Work UI');
