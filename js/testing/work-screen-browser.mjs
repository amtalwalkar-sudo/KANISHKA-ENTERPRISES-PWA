import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({permissions:[]});
const page=await context.newPage();
page.setDefaultTimeout(15000);

try{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
  await page.locator('.driver-shell').waitFor({state:'visible',timeout:30000});
  const nav=page.locator('.quick-dock button');
  assert.equal(await nav.count(),4,'Primary navigation must contain exactly four items');
  assert.deepEqual(await nav.allTextContents(),['Work','Performance','Timeline','Admin']);
  assert.equal(await page.locator('.driver-header').count(),1);
  assert.equal(await page.getByRole('button',{name:'Settings'}).count(),1);
  await page.getByRole('button',{name:'Settings'}).click();
  assert.equal(await page.getByRole('menuitem').count(),3);
  assert.deepEqual(await page.getByRole('menuitem').allTextContents(),['Backup','Restore','Data reset']);
  await page.getByRole('button',{name:'Settings'}).click();
  await page.getByRole('button',{name:'Performance',exact:true}).click();
  await page.waitForTimeout(250);
  assert.equal(await page.locator('.quick-dock button.active').textContent(),'Performance');
  await page.getByRole('button',{name:'Timeline',exact:true}).click();
  assert.equal(await page.locator('.empty-module[aria-label="Timeline"]').count(),1);
  await page.getByRole('button',{name:'Work',exact:true}).click();
  assert.equal(await page.locator('.empty-module[aria-label="Work"]').count(),1);
  assert.equal(await page.locator('.kfe-swipe-bar').count(),0);
  assert.equal(await page.locator('[data-kfe-action]').count(),0);
  assert.equal(await page.locator('[data-kfe-draft-form]').count(),0);
  console.log('PASS: current shell browser contract — four-module navigation, settings actions, blank Work/Timeline, and no legacy Work presentation');
}finally{await browser.close()}
