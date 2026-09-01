import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});

async function swipe(page,locator,direction){
  const box=await locator.boundingBox();
  assert.ok(box,'swipe bar must be visible');
  const x=box.x+box.width/2,y=box.y+box.height/2;
  await page.mouse.move(direction==='RIGHT'?x-100:x+100,y);
  await page.mouse.down();
  await page.mouse.move(direction==='RIGHT'?x+140:x-140,y,{steps:8});
  await page.mouse.up();
}

async function waitState(page,text){
  try{
    await page.getByText(text,{exact:true}).first().waitFor({state:'visible',timeout:30000});
  }catch(error){
    console.log(`WORK_SCREEN_WAIT_FAILED=${text}`);
    console.log('WORK_SCREEN_BODY='+await page.locator('body').innerText().catch(()=>''));
    const runtime=await page.evaluate(()=>{
      const r=window.__KFE_RUNTIME__||{};
      return JSON.stringify({hasRuntime:Boolean(r),application:Boolean(r.application),vue:window.KFE_VUE_RUNTIME?.mounted===true});
    }).catch(()=>'');
    console.log('WORK_SCREEN_RUNTIME='+runtime);
    throw error;
  }
}

async function firstVisible(page,label){
  const locator=page.getByLabel(label);
  const count=await locator.count();
  for(let i=0;i<count;i++){
    const candidate=locator.nth(i);
    if(await candidate.isVisible().catch(()=>false))return candidate;
  }
  throw new Error(`Visible field not found: ${label}`);
}

async function fillVisible(page,label,value){
  const field=await firstVisible(page,label);
  await field.fill(value);
  return field;
}

async function appFuelRows(page){
  return await page.evaluate(async()=>await window.__KFE_RUNTIME__.application.listFuel());
}

async function newScenario({location='denied'}={}){
  const context=await browser.newContext(location==='available'?{geolocation:{latitude:19.0176,longitude:72.8562},permissions:['geolocation']}:{permissions:[]});
  if(location==='denied'){
    await context.addInitScript(()=>{
      Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(_success,error){error?.({code:1,message:'denied'});},watchPosition(){return 0;},clearWatch(){}}});
    });
  }
  const page=await context.newPage();
  if(location==='available'){
    await page.route('**/reverse?*',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({display_name:'Test Fuel Location'})}));
  }
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Work',exact:true}).click();
  return {context,page};
}

async function openFuel(page){
  await page.getByRole('button',{name:'Quick fuel',exact:true}).click();
  await page.getByText('Quick Fuel',{exact:true}).waitFor({state:'visible'});
}

async function saveFuel(page,{odometer,price,amount}){
  await fillVisible(page,'Odometer *',String(odometer));
  await fillVisible(page,'Fuel price per litre/kg *',String(price));
  await fillVisible(page,'Amount *',String(amount));
  await swipe(page,page.locator('.fuel-form-overlay .kfe-swipe-bar'),'RIGHT');
  await page.getByText('Confirm this fuel entry?',{exact:true}).waitFor({state:'visible'});
  await page.getByRole('button',{name:'Confirm',exact:true}).click();
}

try{
  const main=await newScenario({location:'denied'});
  const page=main.page;
  const bar=page.locator('.kfe-swipe-bar');

  // DAY START -> PERSONAL TRIP: no authoritative odometer exists in a fresh scenario, so blank is correct.
  await swipe(page,bar,'LEFT');
  const personalStart=await firstVisible(page,'Start odometer *');
  const personalPrefill=await personalStart.inputValue();
  assert.equal(personalPrefill,'','personal-trip start odometer should be blank when no authoritative reading exists');
  await personalStart.fill('5');
  await page.getByText('Allocate 5 km',{exact:true}).waitFor({state:'visible'});
  await fillVisible(page,'Business KM','2');
  await fillVisible(page,'Personal KM','3');
  await swipe(page,bar,'RIGHT');
  await waitState(page,'PERSONAL TRIP');
  await swipe(page,bar,'RIGHT');
  await fillVisible(page,'End odometer *','10');
  assert.equal(await page.getByLabel('Toll').count(),1,'personal-trip end must expose optional toll');
  assert.equal(await page.getByLabel('Parking').count(),1,'personal-trip end must expose optional parking');
  await swipe(page,bar,'RIGHT');
  await waitState(page,'START OF DAY');

  // DAY START -> READY: editable prefill + exact Business/Personal allocation.
  await swipe(page,bar,'RIGHT');
  const dayStart=await firstVisible(page,'Start odometer *');
  await dayStart.fill('20');
  await page.getByText('Allocate 10 km',{exact:true}).waitFor({state:'visible'});
  await fillVisible(page,'Business KM','7');
  await fillVisible(page,'Personal KM','3');
  await swipe(page,bar,'RIGHT');
  await waitState(page,'READY FOR OPERATION');

  // Fuel from READY.
  await openFuel(page);
  assert.equal(await page.getByText('Location:',{exact:false}).count(),0,'fuel location must not be displayed');
  await saveFuel(page,{odometer:20,price:80,amount:800});
  await waitState(page,'READY FOR OPERATION');
  let fuels=await appFuelRows(page);
  assert.equal(fuels.length,1,'fuel entry should persist');
  assert.equal(fuels[0].amount_paise,80000);
  assert.equal(fuels[0].price_per_litre_paise,8000);
  assert.equal(fuels[0].quantity,10);
  assert.ok(typeof fuels[0].recorded_at==='string'&&fuels[0].recorded_at);

  // READY -> BUSINESS SHIFT -> SHIFT WAITING.
  await swipe(page,bar,'RIGHT');
  await waitState(page,'SHIFT ACTIVE');
  await waitState(page,'SHIFT WAITING');

  // Fuel from SHIFT WAITING.
  await openFuel(page); await saveFuel(page,{odometer:21,price:80,amount:400}); await waitState(page,'SHIFT WAITING');

  // SHIFT WAITING -> BUSINESS TRIP.
  await swipe(page,bar,'RIGHT');
  await waitState(page,'BUSINESS TRIP');

  // Fuel from BUSINESS TRIP.
  await openFuel(page); await saveFuel(page,{odometer:22,price:80,amount:400}); await waitState(page,'BUSINESS TRIP');

  // BUSINESS TRIP -> SHIFT WAITING -> END SHIFT.
  await swipe(page,bar,'RIGHT'); await waitState(page,'SHIFT WAITING');
  await swipe(page,bar,'LEFT'); await waitState(page,'END SHIFT');
  await fillVisible(page,'End odometer *','25');
  await fillVisible(page,'Revenue *','1000');
  await swipe(page,bar,'LEFT'); await waitState(page,'READY FOR OPERATION');

  // READY -> PERSONAL TRIP with authoritative prefill, then Fuel while active.
  await swipe(page,bar,'LEFT');
  const personalStart2=await firstVisible(page,'Start odometer *');
  assert.equal(await personalStart2.inputValue(),'25','personal-trip start odometer should use authoritative reading');
  await personalStart2.fill('27');
  await page.getByText('Allocate 2 km',{exact:true}).waitFor({state:'visible'});
  await fillVisible(page,'Business KM','1'); await fillVisible(page,'Personal KM','1');
  await swipe(page,bar,'RIGHT'); await waitState(page,'PERSONAL TRIP');
  await openFuel(page); await saveFuel(page,{odometer:28,price:80,amount:400}); await waitState(page,'PERSONAL TRIP');
  await swipe(page,bar,'RIGHT'); await fillVisible(page,'End odometer *','30');
  await fillVisible(page,'Toll','25'); await fillVisible(page,'Parking','10');
  await swipe(page,bar,'RIGHT'); await waitState(page,'READY FOR OPERATION');

  // Fuel backwards-odometer rejection.
  await openFuel(page); await fillVisible(page,'Odometer *','29'); await fillVisible(page,'Fuel price per litre/kg *','80'); await fillVisible(page,'Amount *','400');
  await swipe(page,page.locator('.fuel-form-overlay .kfe-swipe-bar'),'RIGHT');
  await page.getByText('Confirm this fuel entry?',{exact:true}).waitFor({state:'visible'});
  await page.getByRole('button',{name:'Confirm',exact:true}).click();
  await page.getByRole('alert').waitFor({state:'visible'});
  fuels=await appFuelRows(page); assert.equal(fuels.length,4,'backwards fuel odometer must not create a record');
  await page.getByRole('button',{name:'Cancel',exact:true}).click();

  // Last Fuel Entry + edit must modify, not duplicate.
  await openFuel(page); await page.getByText('LAST FUEL ENTRY',{exact:true}).waitFor({state:'visible'}); await page.getByRole('button',{name:'Edit',exact:true}).click();
  await fillVisible(page,'Amount *','500'); await swipe(page,page.locator('.fuel-form-overlay .kfe-swipe-bar'),'RIGHT'); await page.getByText('Confirm this fuel entry?',{exact:true}).waitFor({state:'visible'}); await page.getByRole('button',{name:'Confirm',exact:true}).click();
  fuels=await appFuelRows(page); assert.equal(fuels.length,4,'editing last fuel must not duplicate'); assert.equal(fuels.at(-1).amount_paise,50000);

  // Location unavailable: Fuel must still save.
  await saveFuel(page,{odometer:31,price:80,amount:400}); fuels=await appFuelRows(page); assert.equal(fuels.length,5);

  // End Day confirmation.
  await page.getByRole('button',{name:'End day',exact:true}).click(); await page.getByRole('dialog').getByText("End today's work day?",{exact:true}).waitFor({state:'visible'}); await page.getByRole('button',{name:'Cancel',exact:true}).click(); await waitState(page,'READY FOR OPERATION');
  await page.getByRole('button',{name:'End day',exact:true}).click(); await page.getByRole('button',{name:'Confirm End Day',exact:true}).click(); await waitState(page,'DAY ENDED');

  const telemetry=await page.evaluate(async()=>{const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('kfe');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});return await new Promise((resolve,reject)=>{const r=db.transaction('operational_events').objectStore('operational_events').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});});
  const types=telemetry.map(x=>x.event_type);
  for(const type of ['START_PERSONAL_TRIP','END_PERSONAL_TRIP','START_DAY','START_SHIFT','START_TRIP','END_TRIP','END_SHIFT','END_DAY'])assert.ok(types.includes(type),`missing ${type}`);
  assert.ok(telemetry.every(x=>typeof x.occurred_at==='string'));
  console.log('PASS Work Screen frozen lifecycle and Fuel acceptance coverage');
}finally{await browser.close();}