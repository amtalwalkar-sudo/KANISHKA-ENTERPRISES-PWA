import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';

const app=await readFile(new URL('../../src/App.vue',import.meta.url),'utf8');
const nav=await readFile(new URL('../ui/navigation.js',import.meta.url),'utf8');
const screen=await readFile(new URL('../../src/components/AdminModuleView.vue',import.meta.url),'utf8');
const readModel=await readFile(new URL('../application/admin-read-model.js',import.meta.url),'utf8');

const adminDir=new URL('../../src/components/admin/',import.meta.url);
const adminFiles=(await readdir(adminDir)).filter(file=>file.endsWith('.vue')).sort();
const adminParts=await Promise.all(adminFiles.map(async file=>({
  file,
  text:await readFile(new URL(file,adminDir),'utf8')
})));
const adminSurface=adminParts.map(({file,text})=>`/* ${file} */\n${text}`).join('\n');

assert.match(app,/AdminModuleView/);
assert.match(app,/activeModule\s*===\s*['"]Admin['"]/);
assert.doesNotMatch(app,/activeModule\s*===\s*['"]More['"]|MORE_GROUPS/);
assert.match(nav,/id\s*:\s*['"]Admin['"]/);
assert.doesNotMatch(nav,/id\s*:\s*['"]More['"]|MORE_GROUPS|id\s*:\s*['"]Timeline['"]|id\s*:\s*['"]Work['"]/);

assert.ok(adminFiles.length>0,'Admin component tree must contain Vue components');
for(const component of ['AdminCurrentState.vue','AdminOperatingPosition.vue','AdminPeriodOverview.vue','AdminInsight.vue','AdminExpenseBreakdown.vue','AdminLoanStatus.vue','AdminAttention.vue','AdminProfitability.vue','AdminBreakEven.vue','AdminRecordGateway.vue','AdminMonthView.vue','AdminWeekView.vue','AdminFinanceView.vue','AdminManagementView.vue','AdminFixedExpenses.vue']){
  assert.ok(adminFiles.includes(component),`missing Admin component: ${component}`);
}

for(const label of ['CURRENT STATE','ATTENTION','INSIGHT','PROFITABILITY','BREAK-EVEN','Month View','Finance','Management']){
  assert.match(adminSurface,new RegExp(label.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')));
}
for(const label of ['Vehicle','Driver','Finance','Renewals','Maintenance','Loans','Settings']){
  assert.match(adminSurface,new RegExp(label.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')));
}

assert.doesNotMatch(adminSurface,/Timeline|View Day|View Week Timeline|Month timeline|Week timeline|selectDay/);
assert.match(screen,/getAdminState/);
assert.doesNotMatch(screen,/indexedDB|localStorage|sessionStorage|from ['"]\.\.\/\.\.\/js\/(domain|core|infrastructure)/);
assert.match(readModel,/repository\.entity/);
assert.doesNotMatch(readModel,/window|document|localStorage|sessionStorage|indexedDB/);
assert.match(readModel,/financialAvailable/);
assert.match(readModel,/costsPaise/);
console.log('ADMIN_SCREEN_CONTRACT=PASS');
