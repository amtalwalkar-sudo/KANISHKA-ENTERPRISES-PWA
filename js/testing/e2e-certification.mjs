import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const context=await browser.newContext();
const page=await context.newPage();
const errors=[];
page.on('pageerror',error=>errors.push(String(error?.message||error)));
page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});

async function reset(){await page.evaluate(async()=>window.__KFE_RUNTIME__.application.resetAllData());await page.reload({waitUntil:'networkidle'});await page.locator('.kfe-shell').waitFor({state:'visible',timeout:30000});}
async function nav(name){await page.getByRole('button',{name,exact:true}).last().click();await page.waitForTimeout(150);}
async function clickText(name){await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(100);}
async function expectHeading(name){await page.getByRole('heading',{name,exact:true}).waitFor({state:'visible',timeout:5000});}

try{
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});await page.locator('.kfe-shell').waitFor({state:'visible',timeout:30000});await reset();
 assert.equal(await page.getByRole('button',{name:'Work',exact:true}).count(),1);assert.equal(await page.getByRole('button',{name:'Performance',exact:true}).count(),1);assert.equal(await page.getByRole('button',{name:'Timeline',exact:true}).count(),1);assert.equal(await page.getByRole('button',{name:'Admin',exact:true}).count(),1);
 await nav('Performance');await expectHeading('Performance');
 await nav('Timeline');await expectHeading('Timeline');for(const horizon of ['Day','Week','Long-term']){await clickText(horizon);assert.ok(await page.getByRole('button',{name:horizon,exact:true}).count()>=1)}
 await nav('Admin');await expectHeading('Admin');await clickText('Finance');assert.ok(await page.getByText('Revenue',{exact:true}).count()>=1);assert.equal(await page.locator('.kfe-finance-tiles article').count(),6);await page.getByRole('button',{name:'Admin',exact:true}).last().click();
 await clickText('Management');for(const item of ['Vehicle','Driver','Finance','Fixed Expenses','Compliance','Maintenance','Loans','Settings'])assert.ok(await page.getByRole('button',{name:item,exact:true}).count()>=1,`missing Admin control ${item}`);
 await clickText('Fixed Expenses');await expectHeading('Admin');assert.ok(await page.getByText('FIXED EXPENSES',{exact:true}).count()>=1);await clickText('Add fixed expense');assert.ok(await page.getByText('ADD FIXED EXPENSE',{exact:true}).count()>=1);await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('button',{name:'Admin',exact:true}).last().click();await clickText('Management');await clickText('Maintenance');await expectHeading('Maintenance');await clickText('Add maintenance');assert.ok(await page.getByLabel('Date',{exact:true}).count()>=1);await page.getByRole('button',{name:'Maintenance',exact:true}).click();await clickText('Maintenance history');assert.ok(await page.getByText('No maintenance records yet.',{exact:true}).count()>=1);
 await page.getByRole('button',{name:'Maintenance',exact:true}).click();await page.getByRole('button',{name:'Admin',exact:true}).last().click();await clickText('Management');await clickText('Compliance');await expectHeading('Compliance');await clickText('Add renewal');assert.ok(await page.getByLabel('Renewal type',{exact:true}).count()>=1);await page.getByRole('button',{name:'Compliance',exact:true}).click();await clickText('Current validity');assert.ok(await page.getByText('No active validity record.',{exact:true}).count()>=1);
 await page.getByRole('button',{name:'Compliance',exact:true}).click();await page.getByRole('button',{name:'Admin',exact:true}).last().click();await clickText('Management');await clickText('Loans');await expectHeading('Loans');await clickText('Create loan ›');assert.ok(await page.getByLabel('Principal',{exact:true}).count()>=1);await page.getByRole('button',{name:'Loans',exact:true}).click();await clickText('Record payment ›');assert.ok(await page.getByLabel('Payment amount',{exact:true}).count()>=1);await page.getByRole('button',{name:'Loans',exact:true}).click();await clickText('Prepayment calculator ›');assert.ok(await page.getByLabel('Outstanding principal',{exact:true}).count()>=1);
 await page.getByRole('button',{name:'Loans',exact:true}).click();await page.getByRole('button',{name:'Admin',exact:true}).last().click();await clickText('Management');await clickText('Expenses');assert.fail('Expenses should be opened from the Admin Money route, not Management');
}catch(error){if(String(error?.message||error).includes('Expenses should be'))errors.push(String(error.message));else throw error;}

try{
 await page.getByRole('button',{name:'Admin',exact:true}).last().click();await page.getByRole('button',{name:'Expenses',exact:true}).click().catch(()=>{});
}catch{}

assert.deepEqual(errors,[],`Browser console/page errors: ${errors.join(' | ')}`);
console.log('PASS: KFE production browser certification matrix covers primary navigation, Admin finance/management, fixed expenses, maintenance, compliance and loan lifecycle entry points.');
await context.close();await browser.close();
