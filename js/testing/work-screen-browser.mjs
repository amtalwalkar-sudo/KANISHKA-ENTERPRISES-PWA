import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
async function waitRuntimeState(page,expected,timeout=15000){const started=Date.now();while(Date.now()-started<timeout){const state=await page.evaluate(async()=>window.__KFE_RUNTIME__.application.getWorkScreenState());if(state?.state===expected)return state;await page.waitForTimeout(100)}throw new Error(`Work runtime state did not reach ${expected}`)}
function bar(page){return page.locator('.kfe-swipe-bar:visible').first()}
async function swipe(page,direction){const target=bar(page);await target.waitFor({state:'visible',timeout:15000});const box=await target.boundingBox();assert.ok(box);const x=box.x+box.width/2,y=box.y+box.height/2,travel=box.width*.8;await page.mouse.move(direction==='RIGHT'?x-travel/4:x+travel/4,y);await page.mouse.down();await page.mouse.move(direction==='RIGHT'?x+travel*3/4:x-travel*3/4,y,{steps:10});await page.mouse.up()}
async function field(page,label){const exact=page.getByLabel(label,{exact:true});for(let i=0;i<await exact.count();i++){const x=exact.nth(i);if(await x.isVisible().catch(()=>false))return x}const labels=page.locator('label').filter({hasText:label.replace(/\s*\*\s*$/,'').trim()});for(let i=0;i<await labels.count();i++){const x=labels.nth(i).locator('input,textarea,select').first();if(await x.count()&&await x.isVisible().catch(()=>false))return x}throw new Error(`Visible field not found: ${label}`)}
async function fill(page,label,value){const x=await field(page,label);await x.fill(String(value));return x}
async function fresh(){const context=await browser.newContext({permissions:[]});const page=await context.newPage();await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});await page.locator('#vue-runtime .kfe-shell').waitFor({state:'visible',timeout:30000});await waitRuntimeState(page,'DAY_START');return {context,page}}
try{
 const {page}=await fresh();
 assert.equal(await page.locator('[data-kfe-trip-state]').count(),0);
 await swipe(page,'LEFT'); await fill(page,'Start odometer',5); await swipe(page,'RIGHT'); await waitRuntimeState(page,'PERSONAL_TRIP'); assert.equal(await page.locator('[data-kfe-trip-state="IN_PERSONAL_TRIP"]').count(),1);
 await swipe(page,'RIGHT'); await fill(page,'End Odometer (km)',10); await page.getByRole('button',{name:'End Trip',exact:true}).click(); await waitRuntimeState(page,'DAY_START');
 await swipe(page,'RIGHT'); await fill(page,'Start odometer',20); await fill(page,'Business KM',7); await fill(page,'Personal KM',3); await swipe(page,'RIGHT'); await waitRuntimeState(page,'DAY_READY');
 await swipe(page,'RIGHT'); await page.locator('[data-kfe-shift-state="SHIFT_WAITING"]').waitFor({state:'visible'}); assert.equal(await page.getByText('Revenue',{exact:true}).count(),0); assert.equal(await page.getByText('Opening Cash Float (₹) *',{exact:true}).count(),0); assert.equal(await page.getByText('Vehicle inspection cleared',{exact:true}).count(),0);
 await swipe(page,'LEFT'); await fill(page,'Start odometer',22); await swipe(page,'RIGHT'); await waitRuntimeState(page,'PERSONAL_TRIP'); await swipe(page,'RIGHT'); await fill(page,'End Odometer (km)',25); await page.getByRole('button',{name:'End Trip',exact:true}).click(); await page.locator('[data-kfe-shift-state="SHIFT_WAITING"]').waitFor({state:'visible'}); assert.equal((await page.locator('[data-kfe-shift-state="SHIFT_WAITING"] strong').first().innerText()),'25');
 await page.getByRole('button',{name:'Confirm Start Shift',exact:true}).click(); await waitRuntimeState(page,'SHIFT'); assert.equal(await page.locator('[data-kfe-shift-state="SHIFT"]').count(),1);
 await swipe(page,'RIGHT'); await waitRuntimeState(page,'BUSINESS_TRIP'); assert.equal(await page.locator('[data-kfe-trip-state="IN_BUSINESS_TRIP"]').count(),1); assert.equal(await page.locator('[data-kfe-trip-state="IN_BUSINESS_TRIP"][data-kfe-rehydrated="true"]').count(),0);
 await page.reload({waitUntil:'networkidle'}); await waitRuntimeState(page,'BUSINESS_TRIP'); assert.equal(await page.locator('[data-kfe-trip-state="IN_BUSINESS_TRIP"]').count(),1); assert.equal(await page.locator('[data-kfe-rehydrated="true"]').count(),1);
 await swipe(page,'RIGHT'); await fill(page,'End Odometer (km)',30); await page.getByRole('button',{name:'End Trip',exact:true}).click(); await waitRuntimeState(page,'SHIFT');
 await swipe(page,'LEFT'); await fill(page,'End odometer',30); assert.equal(await page.getByText('Revenue',{exact:true}).count(),0); await swipe(page,'LEFT'); await waitRuntimeState(page,'DAY_READY');
 await page.getByRole('button',{name:'End day',exact:true}).click(); await page.getByRole('button',{name:'Confirm',exact:true}).click(); await waitRuntimeState(page,'DAY_ENDED');
 console.log('PASS: reconciled Work lifecycle: no break, staged shift, auto-rebind, trip rehydration');
}finally{await browser.close()}