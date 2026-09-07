import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const shell=read('src/presentation/shell/shells/current/CurrentShell.vue');
const applicationFacade=read('js/application/kfe-application-facade.js');
const applicationBoundary=read('js/application/kfe.js');
const repository=read('js/core/repository.js');
const contract=JSON.parse(read('spec/contracts/ui.json'));

// Settings is now a minimal shell menu. Theme/about presentation controls are
// intentionally not part of the current presentation contract.
assert.ok(shell.includes('Settings'));
assert.ok(shell.includes('Backup'));
assert.ok(shell.includes('Restore'));
assert.ok(shell.includes('Data reset'));
assert.equal((shell.match(/role="menuitem"/g)||[]).length,3);
assert.doesNotMatch(shell,/Theme|theme|About|about|Google Drive Backup|Cloud Sync|GPS|Fleet Management/i);
assert.equal(contract.settingsContract.localBackup.required,true);
assert.equal(contract.settingsContract.localRestore.required,true);
assert.equal(contract.settingsContract.resetErpData.required,true);
assert.equal(contract.settingsContract.futureFeatures.uiControls,false);
assert.equal(contract.settingsContract.futureFeatures.businessBehavior,false);
// kfe.js is the stable application entry boundary; settings behavior now lives
// in the role-segregated application facade behind that entry point.
assert.match(applicationBoundary,/kfe-application-facade\.js/);
for(const method of ['exportBackup','restoreBackup','resetAllData'])assert.ok(applicationFacade.includes(method),`Application facade missing ${method}`);
assert.match(repository,/async function exportSnapshot\(\)/);
assert.match(repository,/async function importSnapshot\(snapshot\)/);
console.log('Settings contract: PASS');
