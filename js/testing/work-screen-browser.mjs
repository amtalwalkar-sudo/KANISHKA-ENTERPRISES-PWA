import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext();
const page=await context.newPage();
async function swipe(locator,direction){const box=await locator.boundingBox();assert.ok(box,'swipe bar must be visible');const x=box.x+box.width/2,y=box.y+box.height/2;await page.mouse.move(direction==='RIGHT'?x-100:x+100,y);await page.mouse.down();await page.mouse.move(direction==='RIGHT'?x+140:x-140,y,{steps:8});await page.mouse.up();}
async function waitState(text){try{await page.getByText(text,{exact:true}).first().waitFor({state:'visible',timeout:30000});}catch(error){console.log(`WORK_SCREEN_WAIT_FAILED=${text}`);console.log('WORK_SCREEN_BODY='+await page.locator('body').innerText().catch(()=>''));console.log('WORK_SCREEN_RUNTIME='+await page.evaluate(()=>{const r=window.__KFE_RUNTIME__||{};return JSON.stringify({hasRuntime:Boolean(r),application:Boolean(r.application),vue:window.KFE_VUE_RUNTIME?.mounted===true});}).catch(()=>''));throw error;}}
try{
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});await page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.deleteDatabase('kfe');r.onsuccess=r.onerror=()=>resolve();}));await page.reload({waitUntil:'networkidle'});await page.getByRole('button',{name:'Work',exact:true}).click();
 // DAY START -> Personal Trip form -> Personal Trip -> DAY START.
 await swipe(page.locator('.kfe-swipe-bar'),'LEFT');
 const personalStart=page.getByLabel('Start odometer *');
 await personalStart.fill('100');
 await page.getByRole('button',{name:'Start personal trip',exact:true}).click();
 await waitState('PERSONAL TRIP');
 await swipe(page.locator('.kfe-swipe-bar'),'RIGHT');
 const personalEnd=page.getByLabel('End odometer *');
 await personalEnd.fill('110');
 await page.getByLabel('Toll').fill('25');
 await page.getByLabel('Parking').fill('10');
 await swipe(page.locator('.kfe-swipe-bar'),'RIGHT');
 await waitState('START OF DAY');
 // START DAY -> editable odometer -> Business/Personal KM allocation -> READY FOR OPERATION.
 await swipe(page.locator('.kfe-swipe-bar'),'RIGHT');
 const dayOdometer=page.getByLabel('Start odometer *');
 assert.equal(await dayOdometer.inputValue(),'110');
 await dayOdometer.fill('120');
 await page.getByText('Allocate 10 km',{exact:true}).waitFor({state:'visible'});
 await page.getByLabel('Business KM').fill('7');
 await page.getByLabel('Personal KM').fill('3');
 await page.getByRole('button',{name:'Confirm',exact:true}).click();
 await waitState('READY FOR OPERATION');
 // READY FOR OPERATION -> Personal Trip form -> editable prefilled odometer + allocation -> Personal Trip -> READY FOR OPERATION.
 await swipe(page.locator('.kfe-swipe-bar'),'LEFT');
 const readyPersonalStart=page.getByLabel('Start odometer *');
 assert.equal(await readyPersonalStart.inputValue(),'120');
 await readyPersonalStart.fill('121');
 await page.getByText('Allocate 1 km',{exact:true}).waitFor({state:'visible'});
 await page.getByLabel('Business KM').fill('1');
 await page.getByLabel('Personal KM').fill('0');
 await page.getByRole('button',{name:'Start personal trip',exact:true}).click();
 await waitState('PERSONAL TRIP');
 await swipe(page.locator('.kfe-swipe-bar'),'RIGHT');
 await page.getByLabel('End odometer *').fill('125');
 await page.getByLabel('Toll').fill('5');
 await page.getByLabel('Parking').fill('20');
 await swipe(page.locator('.kfe-swipe-bar'),'RIGHT');
 await waitState('READY FOR OPERATION');
 // READY FOR OPERATION -> Start Business Shift -> SHIFT ACTIVE/WAITING -> Business Trip -> SHIFT ACTIVE/WAITING.
 await swipe(page.locator('.kfe-swipe-bar'),'RIGHT');
 await waitState('SHIFT ACTIVE');
 await swipe(page.locator('.kfe-swipe-bar'),'RIGHT');
 await waitState('BUSINESS TRIP');
 assert.equal(await page.getByText('Trip active',{exact:true}).isVisible(),true);
 await swipe(page.locator('.kfe-swipe-bar'),'RIGHT');
 await waitState('SHIFT ACTIVE');
 // End Shift -> READY FOR OPERATION.
 await page.getByRole('button',{name:'End shift',exact:true}).click();
 await page.getByLabel('End odometer *').fill('130');
 await swipe(page.locator('.kfe-swipe-bar'),'RIGHT');
 await waitState('READY FOR OPERATION');
 // End Day is button + confirmation, not a swipe/form.
 await page.getByRole('button',{name:'End day',exact:true}).click();
 await page.getByRole('dialog').getByText("End today's work day?",{exact:true}).waitFor({state:'visible'});
 assert.equal(await page.getByText('Business trips',{exact:true}).isVisible(),true);
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await waitState('READY FOR OPERATION');
 await page.getByRole('button',{name:'End day',exact:true}).click();
 await page.getByRole('button',{name:'Confirm End Day',exact:true}).click();
 await waitState('DAY ENDED');
 const telemetry=await page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('kfe');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});return await new Promise((resolve,reject)=>{const r=db.transaction('operational_events').objectStore('operational_events').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});});const types=telemetry.map(x=>x.event_type);for(const type of ['START_PERSONAL_TRIP','END_PERSONAL_TRIP','START_DAY','START_SHIFT','START_TRIP','END_TRIP','END_SHIFT','END_DAY'])assert.ok(types.includes(type),`missing ${type}`);assert.ok(telemetry.every(x=>typeof x.occurred_at==='string'));console.log('PASS Work Screen frozen lifecycle and real IndexedDB persistence');console.log('PASS Personal Trip forms from DAY START and READY FOR OPERATION');console.log('PASS editable prefilled odometers and Business/Personal discrepancy allocation');console.log('PASS Personal Trip end odometer + optional toll/parking');console.log('PASS business shift/trip loop and End Shift');console.log('PASS End Day button confirmation and cancellation');
}finally{await context.close();await browser.close();}
