import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile('src/App.vue','utf8');
const performance=await readFile('js/application/read-models.js','utf8');
const timeline=await readFile('js/ui/timeline.js','utf8');
const timelineView=await readFile('src/components/KfeTimelineView.vue','utf8');
const work=await readFile('src/components/WorkSessionView.vue','utf8');
const fuelForm=await readFile('src/components/FuelQuickEntry.vue','utf8');
const authoritativeForm=await readFile('src/components/AuthoritativeRecordForm.vue','utf8');
const fuelHistory=await readFile('src/components/FuelHistoryView.vue','utf8');
const historical=await readFile('js/application/historical-corrections.js','utf8');
const forms=await readFile('js/application/authoritative-forms.js','utf8');
const screenContract=await readFile('docs/KFE-SCREEN-CONTRACT.md','utf8');

assert.match(app,/const PRIMARY_DESTINATIONS=\['Work','Performance','Timeline'\]/);
assert.match(app,/Administrative\/back-office ERP modules/);
assert.match(app,/Add fuel from any Work state/);
assert.match(app,/authoritative-odometer=\"workHeader\.latestOdometer\"/);
assert.match(app,/AuthoritativeRecordForm/);
assert.match(app,/handleTimelineEdit/);
assert.doesNotMatch(app,/trip planning/i);
assert.match(performance,/const runningCostPaise=/);
assert.match(performance,/const balancePaise=/);
assert.match(performance,/const runningCostPerKmPaise=/);
assert.match(performance,/businessMaintenance/);
assert.match(timeline,/deriveTimelineDistances/);
assert.match(timeline,/locationArea/);
assert.doesNotMatch(timeline,/key\.includes\('mumbai'\)/);
assert.match(timelineView,/deriveTimelineDistances\(projectedEvents\.value\)/);
assert.match(timelineView,/emit\('edit'/);
assert.doesNotMatch(timelineView,/key\.includes\('mumbai'\)/);
assert.match(work,/FuelQuickEntry/);

assert.match(fuelForm,/AuthoritativeRecordForm/);
assert.match(authoritativeForm,/Price per kg/);
assert.match(authoritativeForm,/Refuelled fuel/);
assert.match(authoritativeForm,/quantityKg/);
assert.match(authoritativeForm,/watchPosition/);
assert.match(authoritativeForm,/toLocaleString/);
assert.match(authoritativeForm,/Fuel record saved successfully/);
assert.match(authoritativeForm,/Historical record updated successfully/);
assert.match(authoritativeForm,/mode==='EDIT'/);
assert.match(fuelHistory,/Historical corrections are made from Timeline/);
assert.doesNotMatch(fuelHistory,/v-model=\"draft/);
assert.doesNotMatch(fuelHistory,/@edit=/);

assert.match(historical,/function storeFor/);
assert.match(historical,/pricePerKg/);
assert.match(historical,/locationArea/);
assert.match(historical,/validateOdometer/);
assert.match(app,/saveHistoricalCorrection:historicalCorrections\.save/);

assert.match(forms,/CREATE/);
assert.match(forms,/EDIT/);
assert.match(forms,/validate/);
assert.match(forms,/save/);
assert.match(forms,/update/);
assert.match(forms,/Timeline may open an EDIT form/);
assert.match(forms,/Work.*current operational entry flow/s);
assert.match(forms,/More.*administrative\/back-office/s);
for(const type of ['WORK_SESSION','BUSINESS_TRIP','PERSONAL_TRIP','BREAK','FUEL','REVENUE','EXPENSE'])assert.match(forms,new RegExp(`'${type}'`));

assert.match(screenContract,/Timeline — See \+ Review \+ Correct History/);
assert.match(screenContract,/one authoritative form/);
assert.match(screenContract,/CREATE mode/);
assert.match(screenContract,/EDIT mode/);
assert.match(screenContract,/Timeline event → authoritative form in EDIT mode/);
assert.match(screenContract,/Price per kg/);
assert.match(screenContract,/refuelled fuel/i);
assert.match(screenContract,/GPS/i);
assert.doesNotMatch(screenContract,/Timeline.*duplicate edit logic.*replacement record/s);

console.log('THREE_SCREEN_DRIVER_CORRECTIONS=PASS');
console.log('DRIVER_PRIMARY_SCREENS=Work,Performance,Timeline');
console.log('TRIP_PLANNING=NOT_IMPLEMENTED');
console.log('AUTHORITATIVE_FORMS=CREATE,EDIT,VALIDATE,SAVE,UPDATE');
console.log('TIMELINE_HISTORICAL_CORRECTION=AUTHORITATIVE_FORM_EDIT_MODE');
console.log('FUEL_FORM=ODOMETER,PRICE_PER_KG,AMOUNT,AUTO_KG,TIMESTAMP,LOCATION,GPS');
