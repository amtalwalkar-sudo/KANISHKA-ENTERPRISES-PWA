import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const port=4175;
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port',String(port)],{stdio:['ignore','pipe','pipe'],detached:true});
let output='';
server.stdout.on('data',chunk=>{output+=chunk.toString();});
server.stderr.on('data',chunk=>{output+=chunk.toString();});

async function waitForServer(url,timeoutMs=30000){
  const started=Date.now();
  while(Date.now()-started<timeoutMs){
    try{const response=await fetch(url);if(response.ok)return;}catch{}
    await new Promise(resolve=>setTimeout(resolve,250));
  }
  throw new Error(`Vite preview did not start. Output:\n${output}`);
}
async function withTimeout(promise,label,timeoutMs=30000){
  return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(`${label} timed out after ${timeoutMs}ms`)),timeoutMs))]);
}
function stopServer(){try{process.kill(-server.pid,'SIGTERM');}catch{try{server.kill('SIGTERM');}catch{}}}

try{
  await waitForServer(`http://127.0.0.1:${port}/`);
  const browser=await chromium.launch({headless:true});
  try{
    const context=await browser.newContext();
    try{
      const page=await context.newPage();
      await withTimeout(page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'}),'page.goto');
      const result=await withTimeout(page.evaluate(async()=>{
        const {createRevenueRepository}=await import('/js/application/revenue-repository.js');
        const {DB_NAME,DB_VERSION,STORES}=await import('/js/core/hardened-db.js');
        if(DB_NAME!=='kfe')throw new Error(`Unexpected DB name: ${DB_NAME}`);
        if(!Number.isInteger(DB_VERSION)||DB_VERSION<4)throw new Error(`Unexpected DB version: ${DB_VERSION}`);
        if(!STORES.revenue_records||STORES.revenue_records.keyPath!=='id')throw new Error('Canonical revenue_records store is missing or has the wrong keyPath');
        const repository=createRevenueRepository();
        const id=`revenue-browser-round-trip-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const record={id,marker:'real-indexeddb'};
        const updated={...record,marker:'real-indexeddb-updated'};
        const contains=async expected=>(await repository.list()).some(value=>JSON.stringify(value)===JSON.stringify(expected));
        await repository.create(record);
        const created=await repository.get(record.id);
        const listedAfterCreate=await contains(record);
        await repository.update(updated);
        const readAfterUpdate=await repository.get(record.id);
        const listedAfterUpdate=await contains(updated);
        await repository.remove(record.id);
        const afterRemove=await repository.get(record.id);
        const listedAfterRemove=await repository.list();
        if(JSON.stringify(created)!==JSON.stringify(record))throw new Error('CREATE/GET round-trip failed');
        if(!listedAfterCreate)throw new Error('CREATE/LIST round-trip failed');
        if(JSON.stringify(readAfterUpdate)!==JSON.stringify(updated))throw new Error('UPDATE/GET round-trip failed');
        if(!listedAfterUpdate)throw new Error('UPDATE/LIST round-trip failed');
        if(afterRemove!==undefined||listedAfterRemove.some(value=>value.id===record.id))throw new Error('REMOVE round-trip failed');
        return {database:DB_NAME,version:DB_VERSION,store:'revenue_records',keyPath:STORES.revenue_records.keyPath,result:'PASS'};
      }),'Revenue IndexedDB round-trip');
      console.log(`PHASE_5_REVENUE_REAL_INDEXEDDB_PERSISTENCE=${result.result}`);
      console.log(JSON.stringify(result));
    }finally{await context.close();}
  }finally{await browser.close();}
}finally{stopServer();}
