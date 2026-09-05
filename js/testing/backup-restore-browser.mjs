import {chromium} from 'playwright';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const context=await browser.newContext();
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e?.message||e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
async function deleteDb(name){await page.evaluate(name=>new Promise((resolve,reject)=>{const request=indexedDB.deleteDatabase(name);request.onsuccess=()=>resolve();request.onerror=()=>reject(request.error||new Error(`Failed to delete ${name}`));request.onblocked=()=>resolve();}),name);}
async function waitBackup(targetPage,minRecords=0){return targetPage.waitForFunction(async min=>{const status=await window.KFE_BACKUP.getStatus();return status.status==='CURRENT'&&status.recordCount>=min;},minRecords,{timeout:15000});}
async function readBackupPayload(id,targetPage=page){return targetPage.evaluate(id=>new Promise((resolve,reject)=>{const request=indexedDB.open('kfe-backup',1);request.onsuccess=()=>{const db=request.result;const r=db.transaction('payload','readonly').objectStore('payload').get(id);r.onsuccess=()=>{db.close();resolve(r.result||null)};r.onerror=()=>reject(r.error||new Error('payload read failed'));};request.onerror=()=>reject(request.error||new Error('backup DB open failed'));}),id);}

try{
  await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>Boolean(window.KFE_BACKUP&&window.__KFE_RUNTIME__?.repository),null,{timeout:15000});
  await deleteDb('kfe');await deleteDb('kfe-backup');
  await page.reload({waitUntil:'networkidle'});
  await waitBackup(page,0);
  const initial=await page.evaluate(()=>window.KFE_BACKUP.getStatus());
  assert.equal(initial.status,'CURRENT');
  const created=await page.evaluate(async()=>window.__KFE_RUNTIME__.repository.entity('revenue_records').create({amount_paise:123456,business_date:'2026-09-05',recorded_at:'2026-09-05T08:00:00.000Z',scope:'BUSINESS'},{user_id:null}));
  assert.ok(created.id);
  await waitBackup(page,1);
  const current=await page.evaluate(()=>window.KFE_BACKUP.getStatus());
  assert.equal(current.status,'CURRENT');
  assert.ok(current.lastSuccessfulBackupAt);
  const localPayload=await readBackupPayload('current');
  assert.equal(localPayload.package.encryption.mode,'device');
  assert.ok(!JSON.stringify(localPayload.package).includes('123456'));
  const portable=await page.evaluate(async()=>window.KFE_BACKUP.createPortableBackup('KFE-transfer-2026'));
  assert.equal(portable.packageVersion,'kfe-backup-package-v1');
  assert.equal(portable.encryption.mode,'passphrase');
  assert.ok(!JSON.stringify(portable).includes('123456'));

  await page.evaluate(async()=>window.__KFE_RUNTIME__.repository.entity('revenue_records').create({amount_paise:999,business_date:'2026-09-05',recorded_at:'2026-09-05T09:00:00.000Z',scope:'BUSINESS'}));
  await waitBackup(page,2);
  await assert.rejects(()=>page.evaluate(async pkg=>window.KFE_BACKUP.restorePackage(pkg,'wrong-passphrase'),portable),/OperationError|integrity|decrypt/i);
  await page.evaluate(async pkg=>window.KFE_BACKUP.restorePackage(pkg,'KFE-transfer-2026'),portable);
  const restored=await page.evaluate(async()=>window.__KFE_RUNTIME__.repository.entity('revenue_records').list());
  assert.equal(restored.filter(row=>!row.is_deleted).length,1);
  assert.equal(restored.find(row=>!row.is_deleted).amount_paise,123456);
  const safety=await readBackupPayload('safety');
  assert.ok(safety?.package,'pre-restore safety backup missing');
  const corrupt=structuredClone(portable);corrupt.ciphertext=corrupt.ciphertext.slice(0,-2)+'aa';
  await assert.rejects(()=>page.evaluate(async pkg=>window.KFE_BACKUP.restorePackage(pkg,'KFE-transfer-2026'),corrupt),/OperationError|integrity|decrypt/i);
  const afterFailedRestore=await page.evaluate(async()=>window.__KFE_RUNTIME__.repository.entity('revenue_records').list());
  assert.equal(afterFailedRestore.filter(row=>!row.is_deleted).length,1);

  const phoneB=await browser.newContext();
  const pageB=await phoneB.newPage();
  const phoneBErrors=[];
  pageB.on('pageerror',e=>phoneBErrors.push(String(e?.message||e)));
  pageB.on('console',m=>{if(m.type()==='error')phoneBErrors.push(m.text())});
  await pageB.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});
  await pageB.waitForFunction(()=>Boolean(window.KFE_BACKUP&&window.__KFE_RUNTIME__?.repository),null,{timeout:15000});
  await waitBackup(pageB,0);
  await pageB.evaluate(async pkg=>window.KFE_BACKUP.restorePackage(pkg,'KFE-transfer-2026'),portable);
  const phoneBRows=await pageB.evaluate(async()=>window.__KFE_RUNTIME__.repository.entity('revenue_records').list());
  assert.equal(phoneBRows.filter(row=>!row.is_deleted).length,1);
  assert.equal(phoneBRows.find(row=>!row.is_deleted).amount_paise,123456);
  assert.deepEqual(phoneBErrors,[],`Phone B browser errors: ${phoneBErrors.join(' | ')}`);
  await phoneB.close();

  console.log('PASS: local complete recovery, mutation-triggered refresh, encrypted portable migration, safe restore, integrity rejection, second-device restore, and provider-independent package behavior.');
}finally{
  assert.deepEqual(errors,[],`Browser console/page errors: ${errors.join(' | ')}`);
  await context.close();await browser.close();
}
