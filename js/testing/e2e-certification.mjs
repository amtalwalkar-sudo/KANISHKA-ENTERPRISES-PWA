import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const context=await browser.newContext();
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e?.message||e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});

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

try{
  await route('Work');
  assert.deepEqual(await page.locator('.quick-dock button').allTextContents(),['Work','Performance','Admin']);
  assert.equal(await page.locator('.quick-dock button.active').textContent(),'Work');
  assert.equal(await page.locator('.empty-module').count(),0);
  assert.equal(await page.locator('.kfe-swipe-bar').count(),0);
  assert.equal(await page.locator('[data-kfe-action]').count(),0);

  await clickPrimary('Performance');
  assert.equal(await page.locator('.quick-dock button.active').textContent(),'Performance');

  await clickPrimary('Work');
  await page.locator('[aria-label="Work"]').waitFor({state:'attached'});
  assert.equal(await page.locator('.quick-dock button.active').textContent(),'Work');

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
  console.log('PASS: current-shell browser certification, settings boundary, Work/Performance/Admin routing, Work-first navigation, and core financial application contracts');
}finally{await context.close();await browser.close()}
