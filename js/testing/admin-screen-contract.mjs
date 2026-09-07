import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../../src/App.vue',import.meta.url),'utf8');
const nav=await readFile(new URL('../ui/navigation.js',import.meta.url),'utf8');
const screen=await readFile(new URL('../../src/components/AdminModuleView.vue',import.meta.url),'utf8');
const readModel=await readFile(new URL('../application/admin-read-model.js',import.meta.url),'utf8');

assert.match(app,/AdminModuleView/);
assert.match(app,/activeModule\s*===\s*['"]Admin['"]/);
assert.doesNotMatch(app,/activeModule\s*===\s*['"]More['"]|MORE_GROUPS/);
assert.match(nav,/id\s*:\s*['"]Admin['"]/);
assert.doesNotMatch(nav,/id\s*:\s*['"]More['"]|MORE_GROUPS|id\s*:\s*['"]Timeline['"]|id\s*:\s*['"]Work['"]/);
for(const label of ['CURRENT STATE','ATTENTION','INSIGHT','PROFITABILITY','BREAK-EVEN','Month View','Finance','Management'])assert.match(screen,new RegExp(label.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')));
for(const label of ['Vehicle','Driver','Finance','Renewals','Maintenance','Loans','Settings'])assert.match(screen,new RegExp(label));
assert.doesNotMatch(screen,/Timeline|View Day|View Week Timeline|Month timeline|Week timeline|selectDay/);
assert.match(screen,/getAdminState/);
assert.doesNotMatch(screen,/indexedDB|localStorage|sessionStorage|from ['\"]\.\.\/\.\.\/js\/(domain|core|infrastructure)/);
assert.match(readModel,/repository\.entity/);
assert.doesNotMatch(readModel,/window|document|localStorage|sessionStorage|indexedDB/);
assert.match(readModel,/financialAvailable/);
assert.match(readModel,/costsPaise/);
console.log('ADMIN_SCREEN_CONTRACT=PASS');
