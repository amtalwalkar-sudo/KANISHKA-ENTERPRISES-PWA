import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const context=await browser.newContext();
const page=await context.newPage();
try{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Work',exact:true}).click();

  await page.getByLabel('Start odometer').fill('100');
  await page.getByRole('button',{name:'Start day',exact:true}).click();
  await page.getByLabel('Break minutes').fill('15');
  await page.getByRole('button',{name:'Start shift',exact:true}).click();
  await assert.doesNotReject(async()=>page.getByText('SHIFT ACTIVE',{exact:true}).waitFor({state:'visible'}));
  await page.getByLabel('Shift end odometer').fill('180');
  await page.getByRole('button',{name:'End shift',exact:true}).click();
  await page.getByText('DAY ACTIVE',{exact:true}).waitFor({state:'visible'});
  await page.reload({waitUntil:'networkidle'});
  await page.getByRole('button',{name:'Work',exact:true}).click();
  await page.getByText('DAY ACTIVE',{exact:true}).waitFor({state:'visible'});
  await page.getByText('180',{exact:true}).waitFor({state:'visible'});
  console.log('PASS real IndexedDB create/persist/update round-trip through PWA UI');
  console.log('PASS Phase 4 browser vertical slice');
}finally{
  await context.close();
  await browser.close();
}
