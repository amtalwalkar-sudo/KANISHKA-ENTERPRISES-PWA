import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});

async function waitText(page,text){
  await page.getByText(text,{exact:true}).first().waitFor({state:'visible',timeout:30000});
}

async function waitWorkState(page,expected,timeout=15000){
  const started=Date.now();
  while(Date.now()-started<timeout){
    const state=await page.evaluate(async()=>window.__KFE_RUNTIME__.application.getWorkScreenState());
    if(state?.state===expected)return state;
    await page.waitForTimeout(100);
  }
  const alert=page.locator('[role="alert"]:visible').first();
  const message=await alert.count()?await alert.innerText():'';
  throw new Error(`Work state did not reach ${expected}; current=${await page.evaluate(async()=>{const s=await window.__KFE_RUNTIME__.application.getWorkScreenState();return s?.state})}; error=${message}; body=${(await page.locator('body').innerText()).replace(/\s+/g,' ').trim()}`);
}

async function field(page,label){
  const normalized=label.replace(/\s*\*\s*$/,'').trim();
  const exact=page.getByLabel(label,{exact:true});
  for(let i=0;i<await exact.count();i++){
    const x=exact.nth(i);
    if(await x.isVisible().catch(()=>false))return x;
  }
  const labels=page.locator('label').filter({hasText:normalized});
  for(let i=0;i<await labels.count();i++){
    const l=labels.nth(i);
    if(!await l.isVisible().catch(()=>false))continue;
    const id=await l.getAttribute('for');
    if(id){
      const x=page.locator(`#${CSS.escape(id)}`);
      if(await x.count()&&await x.isVisible().catch(()=>false))return x;
    }
    const x=l.locator('input,textarea,select').first();
    if(await x.count()&&await x.isVisible().catch(()=>false))return x;
  }
  throw new Error(`Visible field not found: ${label}`);
}

async function fill(page,label,value){const x=await field(page,label);await x.fill(String(value));return x}

async function swipe(page,bar,direction){
  const box=await bar.boundingBox();
  assert.ok(box,'swipe bar must be visible');
  const x=box.x+box.width/2,y=box.y+box.height/2;
  const travel=box.width*.8;
  await page.mouse.move(direction==='RIGHT'?x-travel/4:x+travel/4,y);
  await page.mouse.down();
  await page.mouse.move(direction==='RIGHT'?x+travel*3/4:x-travel*3/4,y,{steps:10});
  await page.mouse.up();
}

function bar(page){return page.locator('.kfe-swipe-bar:visible').first()}
async function expectBar(page,text){assert.equal((await bar(page).innerText()).replace(/\s+/g,' ').trim(),text)}

async function freshContext(){
  const context=await browser.newContext({permissions:[]});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
  await page.locator('#vue-runtime .kfe-shell').waitFor({state:'visible',timeout:30000});
  await waitWorkState(page,'DAY_START');
  return {context,page};
}

try{
  const {page}=await freshContext();

  // Personal trip from the initial Day Start screen.
  await expectBar(page,'← START PERSONAL TRIP START DAY →');
  await swipe(page,bar(page),'LEFT');
  await fill(page,'Odometer',5);
  await swipe(page,bar(page),'RIGHT');
  await waitWorkState(page,'PERSONAL_TRIP');
  await expectBar(page,'END PERSONAL TRIP →');
  await swipe(page,bar(page),'RIGHT');
  await fill(page,'End odometer',10);
  await swipe(page,bar(page),'RIGHT');
  await waitWorkState(page,'DAY_START');

  // Start day.
  await expectBar(page,'← START PERSONAL TRIP START DAY →');
  await swipe(page,bar(page),'RIGHT');
  await fill(page,'Start odometer',20);
  await fill(page,'Business KM',7);
  await fill(page,'Personal KM',3);
  await swipe(page,bar(page),'RIGHT');
  await waitWorkState(page,'DAY_READY');

  // Start Shift is a two-stage workflow: odometer form, then centered Start Shift / Personal Trip bar.
  await expectBar(page,'← START PERSONAL TRIP START SHIFT →');
  await swipe(page,bar(page),'RIGHT');
  await waitText(page,'STARTING SHIFT');
  assert.equal(await page.getByText('Vehicle inspection cleared',{exact:true}).count(),0);
  assert.equal(await page.getByText('Opening Cash Float (₹) *',{exact:true}).count(),0);
  assert.equal(await page.getByText('Business Allocation (km) *',{exact:true}).count(),0);
  assert.equal(await page.getByText('Personal Allocation (km) *',{exact:true}).count(),0);
  await fill(page,'Start Odometer',20);
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await expectBar(page,'← START PERSONAL TRIP START SHIFT →');

  // Personal trip from the pre-shift screen returns to that same screen.
  await swipe(page,bar(page),'LEFT');
  await fill(page,'Start odometer',22);
  await swipe(page,bar(page),'RIGHT');
  await waitWorkState(page,'PERSONAL_TRIP');
  await swipe(page,bar(page),'RIGHT');
  await fill(page,'End odometer',25);
  await swipe(page,bar(page),'RIGHT');
  await expectBar(page,'← START PERSONAL TRIP START SHIFT →');

  // Actual Start Shift happens only after the centered swipe.
  await swipe(page,bar(page),'RIGHT');
  await waitWorkState(page,'SHIFT_WAITING');
  await expectBar(page,'← START PERSONAL TRIP START SHIFT →');

  // Business trips exist only on the active shift.
  await swipe(page,bar(page),'RIGHT');
  await waitWorkState(page,'BUSINESS_TRIP');
  await expectBar(page,'END BUSINESS TRIP →');
  await swipe(page,bar(page),'RIGHT');
  await waitWorkState(page,'SHIFT_WAITING');
  await expectBar(page,'← END SHIFT START BUSINESS TRIP →');

  // End Shift requires end odometer and Revenue.
  await swipe(page,bar(page),'LEFT');
  await waitText(page,'END SHIFT');
  assert.equal(await (await field(page,'End odometer')).inputValue(),'');
  assert.equal(await (await field(page,'Revenue')).inputValue(),'');
  await fill(page,'End odometer',30);
  await fill(page,'Revenue',1000);
  await swipe(page,bar(page),'LEFT');
  await waitWorkState(page,'DAY_READY');

  // End Day is reversible until Confirm is pressed.
  await page.getByRole('button',{name:'End day',exact:true}).click();
  await waitText(page,'Confirm day closure');
  await page.getByRole('button',{name:'Back to Shift',exact:true}).click();
  assert.equal(await page.getByText('Confirm day closure',{exact:true}).count(),0);
  assert.equal(await page.getByRole('button',{name:'End day',exact:true}).count(),1);
  await page.getByRole('button',{name:'End day',exact:true}).click();
  await page.getByRole('button',{name:'Confirm',exact:true}).click();
  await waitWorkState(page,'DAY_ENDED');

  console.log('PASS: exact driver Work workflow');
}finally{
  await browser.close();
}
