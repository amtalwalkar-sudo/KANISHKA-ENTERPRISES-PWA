import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
const port=4173;
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port',String(port)],{stdio:['ignore','pipe','pipe'],detached:true});
let output='';server.stdout.on('data',c=>output+=c.toString());server.stderr.on('data',c=>output+=c.toString());
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitForServer(){for(let i=0;i<120;i++){try{if((await fetch(`http://127.0.0.1:${port}/`)).ok)return;}catch{}await sleep(250)}throw new Error(`Vite preview did not start: ${output}`)}
function stop(){try{process.kill(-server.pid,'SIGTERM')}catch{try{server.kill('SIGTERM')}catch{}}}
try{
  await waitForServer();
  const browser=await chromium.launch({headless:true});
  try{
    const context=await browser.newContext();
    try{
      // Legacy setup uses a static page so the application bootstrap cannot open/migrate KFE first.
      const setupPage=await context.newPage();
      await setupPage.goto(`http://127.0.0.1:${port}/manifest.json`,{waitUntil:'load'});
      await setupPage.evaluate(async()=>{
        await new Promise((resolve,reject)=>{const request=indexedDB.deleteDatabase('kfe');request.onsuccess=resolve;request.onerror=()=>reject(request.error||new Error('Legacy IndexedDB reset failed'));request.onblocked=()=>reject(new Error('Legacy IndexedDB reset was blocked'));});
        const legacyStores=['state','rides','logs','settings','outbox','config','audit','idempotency','vehicles','work_sessions','work_days','odometer_allocations','operational_events','fuel_records','expense_records','maintenance_items','maintenance_records','revenue_records','loans','loan_payments','renewals_compliance','calculation_results','alerts'];
        const db=await new Promise((resolve,reject)=>{const request=indexedDB.open('kfe',6);request.onupgradeneeded=()=>{const upgradeDb=request.result;for(const name of legacyStores)if(!upgradeDb.objectStoreNames.contains(name))upgradeDb.createObjectStore(name,{keyPath:'id'});};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('Legacy IndexedDB setup failed'));});
        await new Promise((resolve,reject)=>{const tx=db.transaction('vehicles','readwrite');tx.objectStore('vehicles').put({id:'legacy-vehicle',marker:'must-survive-v6-to-v7'});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error('Legacy sentinel write failed'));});
        db.close();
      });
      // Keep setup and application pages in the same browser context so they share IndexedDB,
      // but never load the application until the v6 database and sentinel are established.
      await setupPage.close();
      const page=await context.newPage();
      const pageErrors=[];page.on('pageerror',error=>pageErrors.push(String(error?.message||error)));
      await page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'});
      await page.waitForTimeout(250);
      const result=await page.evaluate(async()=>{
        const openDb=(name,version)=>new Promise((resolve,reject)=>{const request=indexedDB.open(name,version);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('IndexedDB open failed'));});
        const requestResult=request=>new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('IndexedDB request failed'));});
        const db=await openDb('kfe');
        const required=['state','rides','logs','settings','outbox','config','audit','idempotency','vehicles','drivers','vehicle_driver_assignments','vehicle_odometer_readings','vehicle_disposal_records','work_sessions','work_days','odometer_allocations','operational_events','fuel_records','expense_records','maintenance_items','maintenance_records','revenue_records','loans','loan_payments','renewals_compliance','calculation_results','alerts'];
        const names=[...db.objectStoreNames];
        if(db.version!==7)throw new Error(`Expected migrated IndexedDB version 7, got ${db.version}`);
        for(const name of required)if(!names.includes(name))throw new Error(`Missing migrated store ${name}`);
        const legacy=new Promise((resolve,reject)=>{const tx=db.transaction('vehicles','readonly');const request=tx.objectStore('vehicles').get('legacy-vehicle');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('Legacy sentinel read failed'));});
        const sentinel=await legacy;
        if(sentinel?.marker!=='must-survive-v6-to-v7')throw new Error('Existing v6 vehicle data was not preserved during migration');
        const suffix=crypto.randomUUID();
        const record={id:`vehicle-browser-${suffix}`,marker:'real-indexeddb'};
        const updated={...record,marker:'real-indexeddb-updated'};
        const put=value=>requestResult(db.transaction('vehicles','readwrite').objectStore('vehicles').put(value));
        const get=key=>requestResult(db.transaction('vehicles','readonly').objectStore('vehicles').get(key));
        const del=key=>requestResult(db.transaction('vehicles','readwrite').objectStore('vehicles').delete(key));
        await put(record);if(JSON.stringify(await get(record.id))!==JSON.stringify(record))throw new Error('CREATE/GET round-trip failed');
        await put(updated);if(JSON.stringify(await get(record.id))!==JSON.stringify(updated))throw new Error('UPDATE/GET round-trip failed');
        await del(record.id);if(await get(record.id)!==undefined)throw new Error('REMOVE/GET round-trip failed');
        db.close();
        return {database:'kfe',version:7,requiredStores:required.length,legacyDataPreserved:true,operations:['migration v6→v7','create/get','update/get','remove/get'],result:'PASS'};
      });
      const missingStoreErrors=pageErrors.filter(error=>/object stores? was not found|object store.*not found/i.test(error));
      if(missingStoreErrors.length)throw new Error(`Runtime IndexedDB object-store error: ${missingStoreErrors.join(' | ')}`);
      console.log(`PHASE_5_VEHICLE_REAL_INDEXEDDB_PERSISTENCE=${result.result}`);
      console.log(JSON.stringify(result));
    }finally{await context.close();}
  }finally{await browser.close();}
}finally{stop();}