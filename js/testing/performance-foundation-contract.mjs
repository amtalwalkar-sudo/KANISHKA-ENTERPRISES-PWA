import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(path)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const app=read('src/App.vue');
const performance=read('src/components/PerformanceModuleView.vue');
const navigation=read('ui/navigation.js');
const models=read('application/read-models.js');
const application=read('application/kfe.js');

assert.match(app,/PerformanceModuleView/);
assert.doesNotMatch(app,/StatusModuleView|activeModule==='Status'|activeModule===\"Status\"/);
assert.match(navigation,/id:'Performance',label:'Performance'/);
assert.doesNotMatch(navigation,/id:'Status',label:'Status'/);
assert.match(performance,/Today’s Position/);
assert.match(performance,/Running Cost/);
assert.match(performance,/Balance/);
assert.match(performance,/History & context/);
assert.match(performance,/Authoritative/);
assert.match(performance,/unavailable/);
assert.match(models,/export async function performanceReadModel/);
assert.match(application,/getPerformance/);
assert.doesNotMatch(application,/getStatus/);
console.log('Performance foundation contract: PASS');
