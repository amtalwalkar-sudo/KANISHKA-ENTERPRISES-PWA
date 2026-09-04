import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const component=read('src/components/KfeModuleView.vue');
const application=read('js/application/kfe.js');
const repository=read('js/core/repository.js');
const contract=JSON.parse(read('spec/contracts/ui.json'));

assert.deepEqual(contract.currentScope.Settings.features,['theme','localBackup','localRestore','resetErpData','about']);
assert.deepEqual(contract.settingsContract.theme.options,['system','light','dark']);
assert.equal(contract.settingsContract.futureFeatures.uiControls,false);
assert.equal(contract.settingsContract.futureFeatures.businessBehavior,false);
for(const token of ['Theme','Backup','Restore','Reset ERP Data','KFE 2.0','Version 2.0.0'])assert.ok(component.includes(token),`Settings must expose ${token}`);
for(const future of ['GPS','Cloud Sync','Google Drive Backup','Multiple Vehicles','Multiple Drivers','Fleet Management','Advanced Reporting','Predictive Analytics','Machine Learning','KFE Advisor'])assert.equal(component.includes(future),false,`Future capability must stay out of current Settings UI: ${future}`);
for(const method of ['getSettings','setTheme','exportBackup','restoreBackup'])assert.ok(application.includes(method),`Application boundary missing ${method}`);
assert.match(repository,/async function exportSnapshot\(\)/);
assert.match(repository,/async function importSnapshot\(snapshot\)/);
console.log('Settings contract: PASS');
