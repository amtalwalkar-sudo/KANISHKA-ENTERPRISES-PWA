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

  // DAY START -> PERSONAL TRIP: editable prefill + allocation + return to DAY START.
  await swipe(page,bar,'LEFT');
  const personalStart=await firstVisible(page,'Start odometer *');
  const personalPrefill=await personalStart.inputValue();
  assert.equal(personalPrefill,'0','personal-trip start odometer should be prefilled from the authoritative reading');
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
  assert.equal(await dayStart.inputValue(),'20','start-day odometer must remain editable');
  await page.getByText('Allocate 10 km',{exact:true}).waitFor({state:'visible'});
  await fillVisible(page,'Business KM','6');
  await fillVisible(page,'Personal KM','4');
  await swipe(page,bar,'RIGHT');
  await waitState(page,'READY FOR OPERATION');

  // Fuel from READY: backwards rejection, three fields, no displayed location, confirmation, last-entry edit.
  await openFuel(page);
  await fillVisible(page,'Odometer *','19');
  await fillVisible(page,'Fuel price per litre/kg *','80');
  await fillVisible(page,'Amount *','800');
  await swipe(page,page.locator('.fuel-form-overlay .kfe-swipe-bar'),'RIGHT');
  await page.getByText('Fuel odometer cannot be below the authoritative odometer.',{exact:true}).waitFor({state:'visible'});
  await fillVisible(page,'Odometer *','20');
  await swipe(page,page.locator('.fuel-form-overlay .kfe-swipe-bar'),'RIGHT');
  await page.getByText('Confirm this fuel entry?',{exact:true}).waitFor({state:'visible'});
  await page.getByRole('button',{name:'Confirm',exact:true}).click();
  await waitState(page,'READY FOR OPERATION');
  assert.equal(await page.getByText('Location:',{exact:false}).count(),0,'Fuel location must not be displayed');
  let fuels=await appFuelRows(page);
  assert.equal(fuels.length,1,'first Fuel save should create exactly one record');
  const firstFuel=fuels[0];
  assert.equal(firstFuel.amount_paise,80000);
  assert.equal(Number(firstFuel.price_per_unit),80);
  assert.equal(Number(firstFuel.quantity),10);
  assert.ok(firstFuel.recorded_at,'Fuel timestamp must persist');
  assert.equal(firstFuel.location_name,null,'denied location must not block/save a fake location name');
  assert.equal(firstFuel.location_coordinates,null,'denied location must not invent coordinates');

  await openFuel(page);
  await page.getByText('LAST FUEL ENTRY',{exact:true}).waitFor({state:'visible'});
  await page.getByRole('button',{name:'Edit',exact:true}).click();
  await fillVisible(page,'Amount *','900');
  await swipe(page,page.locator('.fuel-form-overlay .kfe-swipe-bar'),'RIGHT');
  await page.getByText('Confirm this fuel entry?',{exact:true}).waitFor({state:'visible'});
  await page.getByRole('button',{name:'Confirm',exact:true}).click();
  await waitState(page,'READY FOR OPERATION');
  fuels=await appFuelRows(page);
  assert.equal(fuels.length,1,'editing last Fuel entry must not duplicate it');
  assert.equal(fuels[0].id,firstFuel.id,'Fuel edit must update the existing transaction');
  assert.equal(fuels[0].amount_paise,90000);
  assert.equal(Number(fuels[0].quantity),11.25);

  // READY -> SHIFT WAITING -> Fuel -> BUSINESS TRIP -> Fuel -> SHIFT WAITING.
  await swipe(page,bar,'RIGHT');
  await waitState(page,'SHIFT ACTIVE');
  await openFuel(page);
  await saveFuel(page,{odometer:21,price:80,amount:400});
  await waitState(page,'SHIFT ACTIVE');
  await swipe(page,bar,'RIGHT');
  await waitState(page,'BUSINESS TRIP');
  await openFuel(page);
  await saveFuel(page,{odometer:22,price:80,amount:800});
  await waitState(page,'BUSINESS TRIP');
  await swipe(page,bar,'RIGHT');
  await waitState(page,'SHIFT ACTIVE');

  // End Shift: compulsory revenue + end odometer, optional toll/parking, return READY.
  await swipe(page,bar,'LEFT');
  await fillVisible(page,'End odometer *','30');
  await fillVisible(page,'Revenue *','1000');
  assert.equal(await page.getByLabel('Toll').count(),1);
  assert.equal(await page.getByLabel('Parking').count(),1);
  await swipe(page,bar,'LEFT');
  await waitState(page,'READY FOR OPERATION');

  // READY -> PERSONAL TRIP: Fuel while active -> end with toll/parking -> READY.
  await swipe(page,bar,'LEFT');
  await fillVisible(page,'Start odometer *','35');
  await page.getByText('Allocate 5 km',{exact:true}).waitFor({state:'visible'});
  await fillVisible(page,'Business KM','1');
  await fillVisible(page,'Personal KM','4');
  await swipe(page,bar,'RIGHT');
  await waitState(page,'PERSONAL TRIP');
  await openFuel(page);
  await saveFuel(page,{odometer:35,price:100,amount:500});
  await waitState(page,'PERSONAL TRIP');
  await swipe(page,bar,'RIGHT');
  await fillVisible(page,'End odometer *','40');
  await page.getByLabel('Toll').fill('50');
  await page.getByLabel('Parking').fill('20');
  await swipe(page,bar,'RIGHT');
  await waitState(page,'READY FOR OPERATION');

  // End Day confirmation -> closed.
  await page.getByRole('button',{name:'End day',exact:true}).click();
  await page.getByRole('dialog').getByText("End today's work day?",{exact:true}).waitFor({state:'visible'});
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await waitState(page,'READY FOR OPERATION');
  await page.getByRole('button',{name:'End day',exact:true}).click();
  await page.getByRole('button',{name:'Confirm End Day',exact:true}).click();
  await waitState(page,'DAY ENDED');

  const telemetry=await page.evaluate(async()=>await window.__KFE_RUNTIME__.application.listOperationalEvents());
  const types=telemetry.map(x=>x.event_type);
  for(const type of ['START_PERSONAL_TRIP','END_PERSONAL_TRIP','START_DAY','START_SHIFT','START_TRIP','END_TRIP','END_SHIFT','END_DAY'])assert.ok(types.includes(type),`missing ${type}`);
  assert.ok(telemetry.every(x=>typeof x.occurred_at==='string'),'operational events must retain timestamps');
  fuels=await appFuelRows(page);
  assert.equal(fuels.length,4,'full workflow should contain four Fuel transactions');

  await main.context.close();

  // Separate deterministic location-available Fuel scenario: verify coordinates/name persistence.
  const geo=await newScenario({location:'available'});
  const geoPage=geo.page;
  await openFuel(geoPage);
  await saveFuel(geoPage,{odometer:50,price:90,amount:450});
  const geoFuel=(await appFuelRows(geoPage))[0];
  assert.ok(geoFuel.recorded_at,'Fuel timestamp must persist with location available');
  assert.equal(geoFuel.location_name,'Test Fuel Location');
  assert.equal(geoFuel.location_coordinates,'19.0176, 72.8562');
  assert.equal(Number(geoFuel.quantity),5);
  await geo.context.close();

  console.log('PASS: KFE 2.0 frozen Work + Fuel workflow, validation, persistence, allocation, swipe directions, and location rules');
}finally{
  await browser.close();
}
