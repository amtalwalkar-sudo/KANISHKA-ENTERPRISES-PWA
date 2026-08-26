import {chromium} from 'playwright';

const baseUrl=process.env.KFE_BASE_URL||'http://127.0.0.1:4173/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext();
const page=await context.newPage();
page.setDefaultTimeout(10000);
const errors=[];
page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
page.on('requestfailed',r=>errors.push(`requestfailed: ${r.url()} :: ${r.failure()?.errorText||'unknown'}`));
const fail=message=>{throw new Error(message)};

try{
  await page.goto(baseUrl,{waitUntil:'commit',timeout:15000});
  await page.waitForTimeout(2000);

  const contract=await page.evaluate(()=>({
    keys:Object.keys(window.__KFE_RUNTIME||{}),
    models:Object.keys(window.KFE_VIEW_MODELS||{}),
    actions:Object.keys(window.__KFE_RUNTIME?.actions||{}),
    vue:!!window.KFE_VUE_RUNTIME,
    initialTab:document.querySelector('.tab-panel.active')?.id||null,
    bootError:window.KFE_BOOT_ERROR||null
  }));
  if(!contract.keys.length)fail(`Runtime contract was not published. Diagnostics=${JSON.stringify(contract)} Errors=${errors.join(' | ')}`);

  for(const name of ['workViewModel','fuelViewModel','expensesViewModel','revenueViewModel']){
    if(!contract.keys.includes(name))fail(`Runtime contract missing ${name}`);
  }
  for(const name of ['work','fuel','expenses','revenue','maintenance','loan','renewals']){
    if(!contract.models.includes(name))fail(`Missing screen view-model: ${name}`);
  }
  if(!contract.actions.includes('startWork')||!contract.actions.includes('endWork'))fail('Stable app action boundary is incomplete');
  if(!contract.vue)fail('Vue composition boundary is not mounted');
  if(contract.initialTab!=='tab-work')fail(`Unexpected initial tab: ${contract.initialTab}`);

  for(const tab of ['fuel','expenses','dashboard','backup','work']){
    await page.locator(`#nav-${tab}`).click();
    await page.waitForTimeout(60);
    const active=await page.locator('.tab-panel.active').getAttribute('id');
    if(active!==`tab-${tab}`)fail(`Existing UI navigation failed for ${tab}: ${active}`);
  }

  await page.locator('#nav-work').click();
  await page.evaluate(async()=>{await window.KFE_REPOSITORY?.clear();});
  await page.locator('#start-odo').fill('10000');

  await page.evaluate(()=>window.__KFE_RUNTIME__.actions.startWork({
    startOdo:Number(document.querySelector('#start-odo').value),
    now:1700000000000
  }));
  await page.waitForTimeout(100);

  const afterStart=await page.evaluate(async()=>({
    state:await window.KFE_REPOSITORY.load(),
    work:window.__KFE_RUNTIME__.workViewModel,
    domKm:document.querySelector('#today-km')?.textContent?.trim()
  }));
  if(afterStart.state?.work?.startOdo!==10000||afterStart.state?.work?.status!=='Open')fail(`Repository-backed start failed: ${JSON.stringify(afterStart.state)}`);
  if(afterStart.work?.startOdo!==10000)fail(`Work view-model did not reflect start: ${JSON.stringify(afterStart.work)}`);
  if(afterStart.domKm!=='0')fail(`Existing Work UI did not consume the work view-model: ${afterStart.domKm}`);

  await page.evaluate(()=>window.__KFE_RUNTIME__.actions.endWork({endOdo:10050,now:1700003600000}));
  await page.waitForTimeout(100);

  const afterEnd=await page.evaluate(async()=>({
    state:await window.KFE_REPOSITORY.load(),
    work:window.__KFE_RUNTIME__.workViewModel,
    dashboard:window.__KFE_RUNTIME__.dashboardViewModel,
    domKm:document.querySelector('#today-km')?.textContent?.trim(),
    dashKm:document.querySelector('#dash-km')?.textContent?.trim()
  }));
  if(afterEnd.state?.work?.endOdo!==10050||afterEnd.state?.work?.status!=='Closed')fail(`Repository-backed end failed: ${JSON.stringify(afterEnd.state)}`);
  if(afterEnd.work?.km!==50)fail(`Work view-model mileage failed: ${JSON.stringify(afterEnd.work)}`);
  if(afterEnd.dashboard?.work?.km!==50)fail(`Dashboard did not consume aggregated work view-model: ${JSON.stringify(afterEnd.dashboard)}`);
  if(afterEnd.domKm!=='50')fail(`Existing Work UI did not consume work view-model after mutation: ${afterEnd.domKm}`);
  if(afterEnd.dashKm!=='50 km')fail(`Existing Dashboard UI did not consume dashboard view-model: ${afterEnd.dashKm}`);

  if(errors.length)fail(errors.join('\n'));
  console.log(JSON.stringify({ok:true,contract,afterStart,afterEnd},null,2));
}finally{
  await browser.close();
}
