import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
async function waitRuntimeState(page,expected,timeout=15000){const started=Date.now();while(Date.now()-started<timeout){const state=await page.evaluate(async()=>window.__KFE_RUNTIME__.application.getWorkScreenState());if(state?.state===expected)return state;await page.waitForTimeout(100)}throw new Error(`Work runtime state did not reach ${expected}`)}
async function resetBrowserData(page){await page.evaluate(async()=>{const app=window.__KFE_RUNTIME__.application;const snapshot=await app.exportBackup();for(const name of Object.keys(snapshot.stores))snapshot.stores[name]=[];await app.restoreBackup(snapshot)})}
async function fresh(){const context=await browser.newContext({permissions:[]});const page=await context.newPage();await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});await page.locator('#vue-runtime .kfe-shell').waitFor({state:'visible',timeout:30000});await resetBrowserData(page);await waitRuntimeState(page,'DAY_START');return {context,page}}
try{
 const {page}=await fresh();
 assert.equal(await page.locator('.kfe-swipe-bar').count(),0);
 assert.equal(await page.locator('[data-kfe-trip-state]').count(),0);
 assert.equal(await page.locator('[data-kfe-action="START_PERSONAL_TRIP"]').count(),1);
 assert.equal(await page.locator('[data-kfe-action="START_SHIFT"]').count(),1);
 assert.equal(await page.locator('[data-kfe-action="select-work"]').count(),1);
 assert.equal(await page.locator('[data-kfe-action="select-fleet"]').count(),1);
 assert.equal(await page.locator('[data-kfe-action="select-expenses"]').count(),1);
 assert.equal(await page.locator('[data-state="DAY_START"]').count(),1);
 assert.equal(await page.getByText('Revenue',{exact:true}).count(),0);
 assert.equal(await page.getByText('Break',{exact:true}).count(),0);
 assert.equal(await page.locator('[data-kfe-draft-form]').count(),0);
 console.log('PASS: clean Work canvas is mounted at DAY_START with semantic actions, no swipe bars, no break UI, no shift-closing finance coupling, and no legacy Work draft wrapper');
}finally{await browser.close()}