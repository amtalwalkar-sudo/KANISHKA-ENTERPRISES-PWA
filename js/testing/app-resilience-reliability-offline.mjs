import { chromium } from 'playwright';
const BASE=process.env.KFE_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext();
const page=await context.newPage();page.setDefaultTimeout(10000);
const errors=[];page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});page.on('requestfailed',r=>errors.push(`requestfailed: ${r.url()} :: ${r.failure()?.errorText||'unknown'}`));
async function boot(){await page.goto(BASE,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__KFE_RUNTIME__&&window.KFE_VIEW_MODELS&&window.KFE_DASHBOARD_SNAPSHOT);}
async function assertRuntime(){const s=await page.evaluate(()=>({models:Object.keys(window.KFE_VIEW_MODELS||{}),runtimeKeys:Object.keys(window.__KFE_RUNTIME__||{}),actions:Object.keys(window.__KFE_RUNTIME__?.actions||{}),dashboard:!!window.KFE_DASHBOARD_SNAPSHOT,active:document.querySelector('.tab-panel.active')?.id||null,tabs:document.querySelectorAll('#tabbar button').length,sw:!!navigator.serviceWorker?.controller}));for(const n of ['work','fuel','expenses','revenue','maintenance','loan','renewals'])if(!s.models.includes(n))throw Error(`Missing view-model: ${n}`);for(const n of ['workViewModel','fuelViewModel','expensesViewModel','revenueViewModel'])if(!s.runtimeKeys.includes(n))throw Error(`Missing runtime VM: ${n}`);for(const n of ['startWork','endWork'])if(!s.actions.includes(n))throw Error(`Missing runtime action: ${n}`);if(!s.dashboard)throw Error('Dashboard snapshot unavailable');if(s.active!=='tab-work')throw Error(`Unexpected initial tab: ${s.active}`);return s;}
async function repo(){return page.evaluate(async()=>window.KFE_REPOSITORY.load());}
try{
 await boot();await page.evaluate(async()=>window.KFE_REPOSITORY.clear());
 const cold=[];for(let i=0;i<5;i++){await boot();cold.push(await assertRuntime());}
 for(let i=0;i<3;i++)for(const tab of ['fuel','expenses','dashboard','backup','work']){await page.locator(`#nav-${tab}`).click();const active=await page.locator('.tab-panel.active').getAttribute('id');if(active!==`tab-${tab}`)throw Error(`Navigation failed: ${tab} -> ${active}`);}
 await page.locator('#nav-work').click();await page.locator('#start-odo').fill('12345');
 await page.evaluate(()=>window.__KFE_RUNTIME__.actions.startWork({startOdo:12345,now:1700000000000}));await page.waitForTimeout(150);
 const before=await repo();if(before.work?.startOdo!==12345||before.work?.status!=='Open')throw Error(`Repository persistence failed before reload: ${JSON.stringify(before)}`);
 await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__KFE_RUNTIME__&&window.KFE_VIEW_MODELS&&window.KFE_DASHBOARD_SNAPSHOT);const after=await repo();if(after.work?.startOdo!==12345||after.work?.status!=='Open')throw Error(`Repository persistence failed after reload: ${JSON.stringify(after)}`);await assertRuntime();
 await page.evaluate(()=>window.__KFE_RUNTIME__.actions.endWork({endOdo:12395,now:1700003600000}));await page.waitForTimeout(150);const ended=await repo();if(ended.work?.endOdo!==12395||ended.work?.status!=='Closed')throw Error(`Repository end persistence failed: ${JSON.stringify(ended)}`);if((await page.evaluate(()=>window.__KFE_RUNTIME__.getViewModel('work')?.km))!==50)throw Error('Work VM mileage failed');
 if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({ok:true,coldStarts:cold.length,reliability:{navigation:true,reloadPersistence:true},business:{workStart:true,workEnd:true,repository:true}},null,2));
}finally{await browser.close();}
