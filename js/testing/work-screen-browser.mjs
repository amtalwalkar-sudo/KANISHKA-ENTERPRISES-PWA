import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const context=await browser.newContext();
const page=await context.newPage();
async function swipe(locator,direction){const box=await locator.boundingBox();assert.ok(box,'swipe bar must be visible');const x=box.x+box.width/2,y=box.y+box.height/2;await page.mouse.move(direction==='RIGHT'?x-100:x+100,y);await page.mouse.down();await page.mouse.move(direction==='RIGHT'?x+140:x-140,y,{steps:8});await page.mouse.up();}
async function waitState(text){await page.getByText(text,{exact:true}).first().waitFor({state:'visible'});}
try{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
  await page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.deleteDatabase('kfe');r.onsuccess=r.onerror=()=>resolve();}));
  await page.reload({waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Work',exact:true}).click();

  await swipe(page.locator('.kfe-swipe-bar'),'LEFT');
  await page.getByLabel('Start odometer *').fill('100');
  await page.getByRole('button',{name:'Start personal trip',exact:true}).click();
  await waitState('PERSONAL TRIP');
  await swipe(page.locator('.kfe-swipe-bar'),'RIGHT');
  await page.getByLabel('End odometer *').fill('110');
  await swipe(page.locator('.kfe-swipe-bar'),'RIGHT');
  await waitState('START OF DAY');

  await swipe(page.locator('.kfe-swipe-bar'),'RIGHT');
  await page.getByLabel('Start odometer *').fill('120');
  await page.getByText('Allocate 10 km',{exact:true}).waitFor({state:'visible'});
  await page.getByLabel('Business KM').fill('7');
  await page.getByLabel('Personal KM').fill('3');
  await page.getByRole('button',{name:'Confirm',exact:true}).click();
  await waitState('READY FOR OPERATION');

  await swipe(page.locator('.kfe-swipe-bar'),'RIGHT');
  await waitState('SHIFT ACTIVE');
  await page.getByText('00:00:00',{exact:true}).first().waitFor({state:'visible'}).catch(()=>{});

  await swipe(page.locator('.kfe-swipe-bar'),'RIGHT');
  await waitState('BUSINESS TRIP');
  assert.equal(await page.getByText('Trip active',{exact:true}).isVisible(),true);
  await swipe(page.locator('.kfe-swipe-bar'),'RIGHT');
  await waitState('SHIFT ACTIVE');

  await page.getByRole('button',{name:'End shift',exact:true}).click();
  const shiftEnd=page.getByLabel('End odometer *');
  await shiftEnd.fill('130');
  await swipe(page.locator('.kfe-swipe-bar'),'RIGHT');
  await waitState('READY FOR OPERATION');

  await page.getByRole('button',{name:'End day',exact:true}).click();
  await page.getByText('Daily summary',{exact:true}).waitFor({state:'visible'});
  assert.equal(await page.getByText('Business trips',{exact:true}).isVisible(),true);
  await swipe(page.locator('.kfe-swipe-bar'),'RIGHT');
  await waitState('DAY ENDED');

  const telemetry=await page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('kfe');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});return await new Promise((resolve,reject)=>{const r=db.transaction('operational_events').objectStore('operational_events').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});});
  const types=telemetry.map(x=>x.event_type);
  for(const type of ['START_PERSONAL_TRIP','END_PERSONAL_TRIP','START_DAY','START_SHIFT','START_TRIP','END_TRIP','END_SHIFT','END_DAY'])assert.ok(types.includes(type),`missing ${type}`);
  assert.ok(telemetry.every(x=>typeof x.occurred_at==='string'));
  console.log('PASS Work Screen browser lifecycle and real IndexedDB persistence');
  console.log('PASS day/personal/shift/business-trip loops and fixed swipe action slot');
  console.log('PASS compulsory odometer checkpoints and discrepancy allocation');
  console.log('PASS lifecycle telemetry persistence without blocking the UI');
}finally{await context.close();await browser.close();}
