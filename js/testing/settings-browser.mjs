import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const context=await browser.newContext();
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e?.message||e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});

try {
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>Boolean(window.KFE_APPLICATION&&window.KFE_BACKUP),null,{timeout:15000});
  await page.getByRole('button',{name:'Admin'}).click();
  await page.getByRole('button',{name:'Management'}).click();
  await page.getByRole('button',{name:'Settings'}).click();

  await page.getByRole('heading',{name:'Settings'}).waitFor();
  assert.ok(await page.getByText('Backup & Restore',{exact:false}).count()>0,'Backup & Restore setting must be visible');
  assert.ok(await page.getByText('Reset ERP Data',{exact:true}).count()>0,'Reset ERP Data action must be visible');
  assert.equal(await page.getByText('GPS',{exact:true}).count(),0,'Future placeholder GPS setting must not be visible');
  assert.equal(await page.getByText('Cloud Sync',{exact:true}).count(),0,'Future placeholder Cloud Sync setting must not be visible');

  await page.evaluate(async()=>window.__KFE_RUNTIME__.repository.entity('revenue_records').create({amount_paise:4242,business_date:'2026-09-05',recorded_at:new Date().toISOString(),scope:'BUSINESS'}));
  const before=await page.evaluate(async()=>window.__KFE_RUNTIME__.repository.entity('revenue_records').list());
  assert.equal(before.filter(row=>!row.is_deleted).length,1);

  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:'Reset ERP Data',exact:true}).click();
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(async()=>{const rows=await window.__KFE_RUNTIME__.repository.entity('revenue_records').list();return rows.filter(row=>!row.is_deleted).length===0;},null,{timeout:15000});
  const after=await page.evaluate(async()=>({rows:await window.__KFE_RUNTIME__.repository.entity('revenue_records').list(),backup:await window.KFE_BACKUP.getStatus()}));
  assert.deepEqual(after.rows,[],'ERP records survived data reset');
  assert.equal(after.backup.status,'CURRENT','reset must rebuild an empty protected recovery state');
  assert.equal(after.backup.recordCount,0,'empty ERP reset must have zero protected business records');

  assert.deepEqual(errors,[],`Browser console/page errors: ${errors.join(' | ')}`);
  console.log('PASS: Admin Settings exposes real Backup & Restore status, real ERP data reset, and no future placeholder settings.');
} finally {
  await context.close();
  await browser.close();
}
