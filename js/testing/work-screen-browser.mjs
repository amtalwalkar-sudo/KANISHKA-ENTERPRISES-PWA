import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});

async function waitState(page,text){
  try{await page.getByText(text,{exact:true}).first().waitFor({state:'visible',timeout:30000});}
  catch(error){console.log(`WORK_SCREEN_WAIT_FAILED=${text}`);console.log('WORK_SCREEN_BODY='+await page.locator('body').innerText().catch(()=>''));throw error;}
}
async function firstVisible(page,label){
  const locator=page.getByLabel(label);const count=await locator.count();
  for(let i=0;i<count;i++){const candidate=locator.nth(i);if(await candidate.isVisible().catch(()=>false))return candidate;}
  throw new Error(`Visible field not found: ${label}`);
}
async function fillVisible(page,label,value){const field=await firstVisible(page,label);await field.fill(String(value));return field;}
async function swipe(page,locator,direction){
  const box=await locator.boundingBox();assert.ok(box,'swipe bar must be visible');
  const x=box.x+box.width/2,y=box.y+box.height/2;
  await page.mouse.move(direction==='RIGHT'?x-120:x+120,y);await page.mouse.down();await page.mouse.move(direction==='RIGHT'?x+150:x-150,y,{steps:8});await page.mouse.up();
}
async function barLabels(page){return (await page.locator('.kfe-swipe-bar').innerText()).replace(/\s+/g,' ').trim();}
async function expectBar(page,text){assert.equal(await barLabels(page),text,`unexpected swipe bar: ${await barLabels(page)}`);}
async function appFuelRows(page){return await page.evaluate(async()=>await window.__KFE_RUNTIME__.application.listFuel());}
async function newScenario({location='denied'}={}){
  const context=await browser.newContext(location==='available'?{geolocation:{latitude:19.0176,longitude:72.8562},permissions:['geolocation']}:{permissions:[]});
  const page=await context.newPage();await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
  await page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.deleteDatabase('kfe');r.onsuccess=r.onerror=r.onblocked=()=>resolve();}));
  await page.reload({waitUntil:'networkidle'});await page.getByRole('button',{name:'Work',exact:true}).click();await waitState(page,'START OF DAY');return {context,page};
}
async function newAvailableLocationScenario(){
  const context=await browser.newContext({geolocation:{latitude:19.0176,longitude:72.8562},permissions:['geolocation']});
  const page=await context.newPage();
  await page.route('https://nominatim.openstreetmap.org/reverse**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({display_name:'KFE Test Location',name:'KFE Test Location'})}));
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
  await page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.deleteDatabase('kfe');r.onsuccess=r.onerror=r.onblocked=()=>resolve();}));
  await page.reload({waitUntil:'networkidle'});await page.getByRole('button',{name:'Work',exact:true}).click();await waitState(page,'START OF DAY');return {context,page};
}
async function openFuel(page){await page.getByRole('button',{name:'Quick fuel',exact:true}).click();await page.getByText('Quick Fuel',{exact:true}).waitFor({state:'visible'});}
async function confirmFuel(page){await swipe(page,page.locator('.fuel-form-overlay .kfe-swipe-bar'),'RIGHT');await page.getByText('Confirm this fuel entry?',{exact:true}).waitFor({state:'visible'});}
async function saveFuel(page,{odometer,price,amount}){await fillVisible(page,'Odometer *',odometer);await fillVisible(page,'Fuel price per litre/kg *',price);await fillVisible(page,'Amount *',amount);await confirmFuel(page);await page.getByRole('button',{name:'Confirm',exact:true}).click();}
async function assertFuelRecord(page,{odometer,amountPaise,price,quantity}){const rows=await appFuelRows(page);const row=rows.at(-1);assert.equal(row.odometer,odometer);assert.equal(row.amount_paise,amountPaise);assert.equal(Number(row.price_per_unit),price);assert.equal(Number(row.quantity),quantity);assert.ok(row.recorded_at);return row;}

try{
  const {page}=await newScenario({location:'denied'});const bar=page.locator('.kfe-swipe-bar');

  // DAY START: exact directions and Personal Trip path.
  await expectBar(page,'← START PERSONAL TRIP START DAY →');
  await swipe(page,bar,'LEFT');await firstVisible(page,'Start odometer *');
  assert.equal(await firstVisible(page,'Start odometer *').inputValue(),'','fresh scenario has no authoritative odometer, so no prefill is expected');
  await fillVisible(page,'Start odometer *',5);await expectBar(page,'START PERSONAL TRIP →');await swipe(page,bar,'RIGHT');await waitState(page,'PERSONAL TRIP');
  await expectBar(page,'END PERSONAL TRIP →');await swipe(page,bar,'RIGHT');await fillVisible(page,'End odometer *',10);
  assert.equal(await page.locator('label').filter({hasText:/^Toll\b/}).count(),1);assert.equal(await page.locator('label').filter({hasText:/^Parking\b/}).count(),1);
  await expectBar(page,'CLOSE PERSONAL TRIP →');await swipe(page,bar,'RIGHT');await waitState(page,'START OF DAY');

  // DAY START -> READY: editable authoritative prefill and Business/Personal allocation.
  await expectBar(page,'← START PERSONAL TRIP START DAY →');await swipe(page,bar,'RIGHT');
  const dayStart=await firstVisible(page,'Start odometer *');assert.equal(await dayStart.inputValue(),'10');await dayStart.fill('20');
  await page.getByText('Allocate 10 km',{exact:true}).waitFor({state:'visible'});await fillVisible(page,'Business KM *',7);await fillVisible(page,'Personal KM *',3);
  await expectBar(page,'CONFIRM START DAY →');await swipe(page,bar,'RIGHT');await waitState(page,'READY FOR OPERATION');

  // READY: exact direction and Personal Trip allocation with authoritative prefill.
  await expectBar(page,'← START PERSONAL TRIP START BUSINESS SHIFT →');await swipe(page,bar,'LEFT');
  const personalStart=await firstVisible(page,'Start odometer *');assert.equal(await personalStart.inputValue(),'20');await personalStart.fill('22');
  await page.getByText('Allocate 2 km',{exact:true}).waitFor({state:'visible'});await fillVisible(page,'Business KM *',1);await fillVisible(page,'Personal KM *',1);
  await expectBar(page,'START PERSONAL TRIP →');await swipe(page,bar,'RIGHT');await waitState(page,'PERSONAL TRIP');

  // Fuel during PERSONAL TRIP: three fields only, no displayed location, automatic timestamp/location persistence.
  await openFuel(page);assert.equal(await page.getByText('Location:',{exact:false}).count(),0);assert.equal(await page.getByText('Date & time: automatic',{exact:true}).count(),1);
  await saveFuel(page,{odometer:23,price:80,amount:400});await waitState(page,'PERSONAL TRIP');let fuels=await appFuelRows(page);assert.equal(fuels.length,1);const personalFuel=await assertFuelRecord(page,{odometer:23,amountPaise:40000,price:80,quantity:5});assert.equal(personalFuel.location_name,null);assert.equal(personalFuel.location_coordinates,null);assert.ok(typeof personalFuel.recorded_at==='string');

  // Personal Trip end: compulsory odometer, optional toll/parking, return to READY.
  await expectBar(page,'END PERSONAL TRIP →');await swipe(page,bar,'RIGHT');await fillVisible(page,'End odometer *',25);await fillVisible(page,'Toll',25);await fillVisible(page,'Parking',10);await expectBar(page,'CLOSE PERSONAL TRIP →');await swipe(page,bar,'RIGHT');await waitState(page,'READY FOR OPERATION');

  // READY -> BUSINESS SHIFT -> SHIFT WAITING.
  await expectBar(page,'← START PERSONAL TRIP START BUSINESS SHIFT →');await swipe(page,bar,'RIGHT');await waitState(page,'SHIFT ACTIVE');await waitState(page,'SHIFT WAITING');await expectBar(page,'← END SHIFT START BUSINESS TRIP →');

  // Fuel during SHIFT WAITING.
  await openFuel(page);await saveFuel(page,{odometer:26,price:80,amount:400});await waitState(page,'SHIFT WAITING');

  // SHIFT WAITING -> BUSINESS TRIP -> END BUSINESS TRIP -> SHIFT WAITING.
  await expectBar(page,'← END SHIFT START BUSINESS TRIP →');await swipe(page,bar,'RIGHT');await waitState(page,'BUSINESS TRIP');await expectBar(page,'END BUSINESS TRIP →');
  await openFuel(page);await saveFuel(page,{odometer:27,price:80,amount:400});await waitState(page,'BUSINESS TRIP');await swipe(page,bar,'RIGHT');await waitState(page,'SHIFT WAITING');

  // END SHIFT: Revenue and end odometer compulsory; toll/parking optional.
  await expectBar(page,'← END SHIFT START BUSINESS TRIP →');await swipe(page,bar,'LEFT');await waitState(page,'END SHIFT');
  assert.equal(await firstVisible(page,'End odometer *').inputValue(),'');assert.equal(await firstVisible(page,'Revenue *').inputValue(),'');
  const closeShiftBar=page.locator('.kfe-swipe-bar');assert.equal(await closeShiftBar.getAttribute('aria-disabled'),'true');
  await fillVisible(page,'End odometer *',30);assert.equal(await closeShiftBar.getAttribute('aria-disabled'),'true');await fillVisible(page,'Revenue *',1000);assert.equal(await closeShiftBar.getAttribute('aria-disabled'),'false');
  assert.equal(await page.locator('label').filter({hasText:/^Toll\b/}).count(),1);assert.equal(await page.locator('label').filter({hasText:/^Parking\b/}).count(),1);await expectBar(page,'← CLOSE SHIFT');await swipe(page,closeShiftBar,'LEFT');await waitState(page,'READY FOR OPERATION');

  // Fuel from READY and verify last-entry display/edit does not duplicate.
  await openFuel(page);await saveFuel(page,{odometer:31,price:80,amount:400});fuels=await appFuelRows(page);assert.equal(fuels.length,4);
  await openFuel(page);await page.getByText('LAST FUEL ENTRY',{exact:true}).waitFor({state:'visible'});const beforeEdit=(await appFuelRows(page)).at(-1);assert.ok(beforeEdit);await page.getByRole('button',{name:'Edit',exact:true}).click();
  assert.equal(await firstVisible(page,'Odometer *').inputValue(),String(beforeEdit.odometer));await fillVisible(page,'Amount *',500);await confirmFuel(page);await page.getByRole('button',{name:'Confirm',exact:true}).click();fuels=await appFuelRows(page);assert.equal(fuels.length,4);const afterEdit=fuels.at(-1);assert.equal(afterEdit.id,beforeEdit.id);assert.equal(afterEdit.amount_paise,50000);assert.equal(afterEdit.recorded_at,beforeEdit.recorded_at);

  // Fuel backwards-odometer rejection.
  await openFuel(page);await saveFuelAttempt(page,{odometer:30,price:80,amount:400});

  // Location unavailable must not block Fuel save.
  await saveFuel(page,{odometer:32,price:80,amount:400});fuels=await appFuelRows(page);assert.equal(fuels.length,5);assert.equal(fuels.at(-1).location_name,null);assert.equal(fuels.at(-1).location_coordinates,null);

  // Dedicated location-available browser proof: geolocation + reverse-geocoded name must persist.
  const available=await newAvailableLocationScenario();
  try{
    const availableBar=available.page.locator('.kfe-swipe-bar');
    await expectBar(available.page,'← START PERSONAL TRIP START DAY →');await swipe(available.page,availableBar,'RIGHT');
    await fillVisible(available.page,'Start odometer *',100);await page.getByText('Allocate 100 km',{exact:true}).waitFor({state:'visible'}).catch(()=>{});
    const businessKm=available.page.getByLabel('Business KM *');if(await businessKm.count())await fillVisible(available.page,'Business KM *',100);
    const personalKm=available.page.getByLabel('Personal KM *');if(await personalKm.count())await fillVisible(available.page,'Personal KM *',0);
    await swipe(available.page,availableBar,'RIGHT');await waitState(available.page,'READY FOR OPERATION');
    await openFuel(available.page);await saveFuel(available.page,{odometer:100,price:80,amount:400});
    const availableRows=await appFuelRows(available.page);assert.equal(availableRows.length,1);
    const availableFuel=availableRows[0];assert.equal(availableFuel.odometer,100);assert.equal(availableFuel.amount_paise,40000);assert.equal(Number(availableFuel.price_per_kg),80);assert.equal(availableFuel.latitude,19.0176);assert.equal(availableFuel.longitude,72.8562);assert.equal(availableFuel.location_name,'KFE Test Location');assert.equal(availableFuel.location_source,'REVERSE_GEOCODED');
    const persisted=await available.page.evaluate(async()=>await window.__KFE_RUNTIME__.application.listFuel());const persistedFuel=persisted[0];assert.equal(persistedFuel.id,availableFuel.id);assert.equal(persistedFuel.location_name,'KFE Test Location');assert.equal(persistedFuel.location_source,'REVERSE_GEOCODED');assert.equal(persistedFuel.latitude,19.0176);assert.equal(persistedFuel.longitude,72.8562);
    console.log('PASS: Fuel location-available coordinates and reverse-geocoded name persisted');
  }finally{await available.context.close();}

  // End Day confirmation -> closed.
  await page.getByRole('button',{name:'End day',exact:true}).click();await page.getByRole('dialog').getByText("End today's work day?",{exact:true}).waitFor({state:'visible'});await page.getByRole('button',{name:'Cancel',exact:true}).click();await waitState(page,'READY FOR OPERATION');await page.getByRole('button',{name:'End day',exact:true}).click();await page.getByRole('button',{name:'Confirm End Day',exact:true}).click();await waitState(page,'DAY ENDED');

  console.log('PASS: frozen Work lifecycle, forms, swipe directions, odometer allocation, Revenue, Fuel and persistence coverage');
}finally{await browser.close()}

async function saveFuelAttempt(page,{odometer,price,amount}){
  await fillVisible(page,'Odometer *',odometer);await fillVisible(page,'Fuel price per litre/kg *',price);await fillVisible(page,'Amount *',amount);await confirmFuel(page);await page.getByRole('button',{name:'Confirm',exact:true}).click();
  await page.getByRole('alert').waitFor({state:'visible'});const message=await page.getByRole('alert').innerText();assert.match(message,/cannot be below the authoritative odometer/i);await page.getByRole('button',{name:'Cancel',exact:true}).click();
}
