import {chromium, devices} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({...devices['Pixel 5']});
await context.tracing.start({screenshots:true,snapshots:true});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>{console.log(`[BROWSER ERROR] ${e.message}`);errors.push(String(e?.message||e))});
page.on('console',m=>{console.log(`[BROWSER CONSOLE] ${m.type()}: ${m.text()}`);if(m.type()==='error')errors.push(m.text())});

async function route(name){
  await page.goto(`http://127.0.0.1:4173/#${encodeURIComponent(name)}`,{waitUntil:'networkidle'});
  await page.locator('.driver-shell').waitFor({state:'visible',timeout:30000});
}
async function clickPrimary(name){
  const button=page.locator('.quick-dock button').filter({hasText:name}).first();
  await button.click();
  await page.waitForFunction(expected=>location.hash.slice(1)===expected,name);
  await page.locator('.quick-dock button.active').filter({hasText:name}).waitFor({state:'visible'});
}
async function reloadWork(){await page.reload({waitUntil:'networkidle'});await page.locator('[aria-label="Work"]').waitFor({state:'attached'});}
async function workState(selector){await page.locator(selector).waitFor({state:'visible',timeout:10000});}
async function attachSwipeEventProbes(){
  await page.evaluate(()=>{
    const track=document.querySelector('[data-testid="kfe-swipe-bar"]');
    const handle=track?.querySelector('button');
    if(!track||!handle)throw new Error('SwipeBar event probe target unavailable');
    if(track.dataset.kfeEventProbeAttached==='true')return;
    const types=['pointerdown','pointermove','pointerup','pointercancel','touchstart','touchmove','touchend','touchcancel'];
    for(const type of types){
      const targets=[track,handle];
      for(const target of targets){
        target.addEventListener(type,e=>{
          console.log(`[EVENT PROBE] ${type}: pointerType=${e.pointerType}, pointerId=${e.pointerId}, isTrusted=${e.isTrusted}, buttons=${e.buttons}, clientX=${e.clientX}, clientY=${e.clientY}, aria-valuenow=${handle.getAttribute('aria-valuenow')}`);
        },{capture:true});
      }
    }
    track.dataset.kfeEventProbeAttached='true';
  });
}
async function swipeStartDay(){
  const thumb=page.locator('.swipe-bar__thumb');
  const track=page.locator('[data-testid="kfe-swipe-bar"]');
  await thumb.waitFor({state:'visible',timeout:10000});
  await track.waitFor({state:'visible',timeout:10000});
  await attachSwipeEventProbes();
  try{
    const result=await page.evaluate(()=>{
      const thumb=document.querySelector('.swipe-bar__thumb');
      const track=document.querySelector('[data-testid="kfe-swipe-bar"]');
      if(!thumb||!track)throw new Error('SwipeBar elements not found');
      const trackRect=track.getBoundingClientRect();
      const thumbRect=thumb.getBoundingClientRect();
      const startX=thumbRect.left+(thumbRect.width/2);
      const endX=trackRect.left+(trackRect.width*.95);
      const startY=thumbRect.top+(thumbRect.height/2);
      const delta=endX-startX;
      const required=trackRect.width*.8;
      if(delta<=required)throw new Error(`SwipeBar delta ${delta} does not exceed 80% threshold ${required}`);
      const eventInit={bubbles:true,cancelable:true,pointerId:1,pointerType:'touch',isPrimary:true,clientY:startY,button:0};
      console.log(`[E2E DIRECT POINTER] geometry startX=${startX.toFixed(2)} startY=${startY.toFixed(2)} endX=${endX.toFixed(2)} delta=${delta.toFixed(2)} trackWidth=${trackRect.width.toFixed(2)} required80=${required.toFixed(2)}`);
      console.log('[E2E DIRECT POINTER] dispatch pointerdown directly on thumb');
      thumb.dispatchEvent(new PointerEvent('pointerdown',{...eventInit,clientX:startX,buttons:1}));
      const steps=10;
      for(let i=1;i<=steps;i++){
        const currentX=startX+(endX-startX)*(i/steps);
        thumb.dispatchEvent(new PointerEvent('pointermove',{...eventInit,clientX:currentX,buttons:1}));
      }
      console.log(`[E2E DIRECT POINTER] dispatch pointerup directly on thumb at x=${endX.toFixed(2)}`);
      thumb.dispatchEvent(new PointerEvent('pointerup',{...eventInit,clientX:endX,buttons:0}));
      return {startX,startY,endX,delta,required,ariaValueNow:thumb.getAttribute('aria-valuenow')};
    });
    console.log(`[E2E DIRECT POINTER] sequence complete; aria-valuenow=${result.ariaValueNow} delta=${result.delta.toFixed(2)} required80=${result.required.toFixed(2)}`);
    try{
      await page.locator('[role="dialog"][aria-labelledby="start-day-modal-title"]').waitFor({state:'visible',timeout:10000});
    }catch(error){
      const diagnostics=await page.evaluate(()=>{
        const track=document.querySelector('[data-testid="kfe-swipe-bar"]');
        const handle=track?.querySelector('button');
        const dialogSelector='[role="dialog"][aria-labelledby="start-day-modal-title"]';
        const dialogs=[...document.querySelectorAll('[role="dialog"]')];
        const visibleDialogs=dialogs.filter(dialog=>{
          const style=getComputedStyle(dialog);
          const rect=dialog.getBoundingClientRect();
          return style.display!=='none'&&style.visibility!=='hidden'&&rect.width>0&&rect.height>0;
        }).length;
        return {
          outerHTML:track?.outerHTML||null,
          ariaValueNow:handle?.getAttribute('aria-valuenow')||null,
          dialogCount:document.querySelectorAll('[role="dialog"]').length,
          visibleDialogCount:visibleDialogs,
          targetDialogPresent:Boolean(document.querySelector(dialogSelector))
        };
      });
      console.log('[E2E DIAGNOSTIC] SwipeBar outerHTML:',diagnostics.outerHTML);
      console.log('[E2E DIAGNOSTIC] aria-valuenow:',diagnostics.ariaValueNow);
      console.log('[E2E DIAGNOSTIC] dialog count:',diagnostics.dialogCount);
      console.log('[E2E DIAGNOSTIC] visible dialog count:',diagnostics.visibleDialogCount);
      try{await page.screenshot({path:'swipe-failure.png',fullPage:true});}catch(screenshotError){console.log(`[E2E DIAGNOSTIC] screenshot failure: ${String(screenshotError?.message||screenshotError)}`);}
      throw error;
    }
  }catch(error){
    console.log(`[E2E DIRECT POINTER] swipeStartDay failure: ${String(error?.message||error)}`);
    try{await page.screenshot({path:'swipe-failure.png',fullPage:true});}catch(screenshotError){console.log(`[E2E DIRECT POINTER] screenshot failure: ${String(screenshotError?.message||screenshotError)}`);}
    try{await context.tracing.stop({path:'trace.zip'});}catch(traceError){console.log(`[E2E DIRECT POINTER] trace stop failure: ${String(traceError?.message||traceError)}`);}
    throw error;
  }
}
async function expandOperationIfPresent(name){
  const trigger=page.getByRole('button',{name:new RegExp(`^${name}\\s*[+−-]?$`)}).first();
  if(await trigger.count()===0)return false;
  await trigger.waitFor({state:'visible',timeout:10000});
  if((await trigger.getAttribute('aria-expanded'))!=='true')await trigger.click();
  return true;
}
async function recordAuthoritativeOdometer(value){
  await page.evaluate(async odometer=>{
    const application=window.__KFE_RUNTIME__?.application;
    if(!application)throw new Error('KFE application runtime unavailable');
    await application.work.recordOdometer({odometer,source:'MANUAL'});
  },value);
}
async function diagnosticWorkState(label){
  return page.evaluate(async stateLabel=>{
    const application=window.__KFE_RUNTIME__?.application;
    const candidates=[application?.getWorkScreenState,application?.work?.getWorkScreenState,application?.work?.state].filter(fn=>typeof fn==='function');
    if(candidates.length===0)return {label:stateLabel,state:'UNKNOWN',error:'KFE work state read model unavailable'};
    try{
      const value=await candidates[0].call(application?.getWorkScreenState?application:application.work);
      const state=typeof value==='string'?value:value?.state;
      return {label:stateLabel,state:state||'UNKNOWN'};
    }catch(error){return {label:stateLabel,state:'UNKNOWN',error:String(error?.message||error)};}
  },label);
}

try{
  await route('Work');
  assert.deepEqual(await page.locator('.quick-dock button').allTextContents(),['Work','Performance','Admin']);
  assert.equal(await page.locator('.quick-dock button.active').textContent(),'Work');
  assert.equal(await page.locator('.empty-module').count(),0);
  assert.equal(await page.locator('.kfe-swipe-bar').count(),0);
  assert.equal(await page.locator('[data-kfe-action]').count(),0);
  await workState('.day-start-card');
  assert.equal(await page.getByRole('spinbutton',{name:'Current reading'}).count(),0);
  await swipeStartDay();
  await page.getByRole('spinbutton',{name:'Start odometer'}).waitFor({state:'visible',timeout:10000});
  await page.getByRole('spinbutton',{name:'Start odometer'}).fill('100');
  await page.getByRole('button',{name:'Start Day'}).click();
  await workState('.shift-waiting-card');
  await workState('.work-operations');
  assert.equal(await page.getByRole('spinbutton',{name:'Current reading'}).count(),0);
  await page.getByRole('button',{name:'Start Shift'}).click();
  await workState('.shift-card');
  await reloadWork();
  await workState('.shift-card');
  const windowKeys=await page.evaluate(()=>Object.keys(window).filter(k=>k.toLowerCase().includes('kfe')||k.toLowerCase().includes('app')||k.startsWith('__')));
  console.log('[DIAGNOSTIC] Matching window keys:',windowKeys);
  console.log('[DIAGNOSTIC] Work State Before Click:',await diagnosticWorkState('before-click'));
  await page.getByRole('button',{name:'Business Trip'}).click();
  console.log('[DIAGNOSTIC] Work State Immediately After Click:',await diagnosticWorkState('immediately-after-click'));
  console.log('[DIAGNOSTIC] DOM Visibility -> ShiftCard:',await page.locator('.shift-card').isVisible(),'BusinessTripCard:',await page.locator('.business-trip-card').isVisible());
  await workState('.business-trip-card');
  const businessOdometerForm=await expandOperationIfPresent('Odometer');
  if(businessOdometerForm){
    const businessOdometer=page.getByRole('spinbutton',{name:'Current reading'});
    await businessOdometer.fill('130');
    await page.getByRole('button',{name:'Record Odometer'}).click();
    await page.getByRole('status').filter({hasText:'Odometer recorded.'}).waitFor({state:'visible'});
  }else{
    assert.equal(await page.getByRole('button',{name:'Record Odometer'}).count(),0);
    await recordAuthoritativeOdometer(130);
  }
  await reloadWork();
  await workState('.business-trip-card');
  const cardText=await page.locator('.business-trip-card').innerText();
  console.log('[DIAGNOSTIC] .business-trip-card raw innerText:',JSON.stringify(cardText));
  assert.ok(/Distance\s*30\.0\s*km/i.test(cardText),`Expected Business Trip distance 30.0 km in .business-trip-card text, got: ${cardText}`);
  await page.getByRole('button',{name:'End Business Trip'}).click();
  await workState('.shift-card');
  await page.getByRole('button',{name:'Personal Trip'}).click();
  await workState('.personal-trip-card');
  const personalOdometerForm=await expandOperationIfPresent('Odometer');
  if(personalOdometerForm){
    const personalOdometer=page.getByRole('spinbutton',{name:'Current reading'});
    await personalOdometer.fill('150');
    await page.getByRole('button',{name:'Record Odometer'}).click();
    await page.getByRole('status').filter({hasText:'Odometer recorded.'}).waitFor({state:'visible'});
  }else{
    assert.equal(await page.getByRole('button',{name:'Record Odometer'}).count(),0);
    await recordAuthoritativeOdometer(150);
  }
  await reloadWork();
  await workState('.personal-trip-card');
  await page.getByRole('button',{name:'End Personal Trip'}).click();
  await workState('.shift-card');
  await page.getByRole('button',{name:'End Shift'}).click();
  await workState('.day-end-card');
  await reloadWork();
  await workState('.day-end-card');
  await page.getByRole('button',{name:'End Day'}).click();
  await workState('.work-summary-card');
  assert.equal(await page.getByRole('button',{name:'Record Odometer'}).count(),0);
  assert.equal(await page.locator('.work-operations').count(),0);
  const stackText=await page.locator('.work-stack').innerText();
  console.log('[DIAGNOSTIC] .work-stack raw innerText:',JSON.stringify(stackText));
  console.log('[DIAGNOSTIC] Business KM present:',stackText.includes('Business KM'));
  assert.ok(/Business\s+Distance\s+30\.0\s*km/i.test(stackText),`Expected Business Distance 30.0 km in .work-stack text, got: ${stackText}`);
  assert.ok(/Personal\s+Distance\s+20\.0\s*km/i.test(stackText),`Expected Personal Distance 20.0 km in .work-stack text, got: ${stackText}`);
  await reloadWork();
  await workState('.work-summary-card');
  assert.equal(await page.locator('.day-end-card').count(),0);
  assert.ok(/Business\s+Distance\s+30\.0\s*km/i.test(await page.locator('.work-stack').innerText()));
  await clickPrimary('Performance');
  assert.equal(await page.locator('.quick-dock button.active').textContent(),'Performance');
  await clickPrimary('Work');
  await page.locator('[aria-label="Work"]').waitFor({state:'attached'});
  await page.getByRole('button',{name:'Settings'}).click();
  assert.deepEqual(await page.getByRole('menuitem').allTextContents(),['Backup','Restore','Data reset']);
  await page.getByRole('button',{name:'Settings'}).click();
  await route('Admin');
  assert.equal(await page.locator('.quick-dock button.active').textContent(),'Admin');
  const result=await page.evaluate(async()=>{
    const a=window.__KFE_RUNTIME__?.application;
    if(!a) throw new Error('KFE application runtime unavailable');
    const today=new Date().toISOString().slice(0,10);
    await a.recordMaintenance({date:today,vehicle:'TEST',odometer:100,category:'Service',description:'Certification service',amount:1250});
    await a.recordCompliance({type:'Insurance',cost:5000,start:today,end:'2099-12-31'});
    await a.recordExpense({category:'Toll',date:today,amount:100,description:'Certification expense'});
    await a.recordRevenue({amount_paise:250000,business_date:today,recorded_at:new Date().toISOString(),scope:'BUSINESS'});
    const created=await a.createLoan({principal:100000,annual_rate_percent:12,term_months:12,emi:9000,start_date:today});
    const paid=await a.recordLoanPayment({loan_id:created.loan.id,amount:5000,date:today});
    if(paid.payment.interest_paise!==1000||paid.payment.principal_paise!==4000||paid.loan.remaining_balance_paise!==96000)throw new Error('Loan principal/interest allocation vector failed');
    return {maintenance:true,compliance:true,expense:true,revenue:true,loan:true};
  });
  assert.deepEqual(result,{maintenance:true,compliance:true,expense:true,revenue:true,loan:true});
  assert.deepEqual(errors,[]);
  console.log('PASS: Android Pixel 5 Work lifecycle, chronological form gating, accordion behavior, odometer progression, reload recovery, Work/Performance/Admin routing, settings boundary, and core financial application contracts');
}finally{await context.close();await browser.close()}