import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';

const port=4176;
const server=spawn('npm',['run','preview','--','--host','127.0.0.1','--port',String(port)],{stdio:['ignore','pipe','pipe'],detached:true});
let output='';
server.stdout.on('data',chunk=>{output+=chunk.toString();});
server.stderr.on('data',chunk=>{output+=chunk.toString();});
async function waitForServer(url,timeoutMs=30000){const started=Date.now();while(Date.now()-started<timeoutMs){try{const response=await fetch(url);if(response.ok)return;}catch{}await new Promise(resolve=>setTimeout(resolve,250));}throw new Error(`Vite preview did not start. Output:\n${output}`);}
async function withTimeout(promise,label,timeoutMs=30000){return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error(`${label} timed out after ${timeoutMs}ms`)),timeoutMs))]);}
function stopServer(){try{process.kill(-server.pid,'SIGTERM');}catch{try{server.kill('SIGTERM');}catch{}}}
try{
 await waitForServer(`http://127.0.0.1:${port}/`);
 const browser=await chromium.launch({headless:true});
 try{const context=await browser.newContext();try{const page=await context.newPage();await withTimeout(page.goto(`http://127.0.0.1:${port}/`,{waitUntil:'domcontentloaded'}),'page.goto');const result=await withTimeout(page.evaluate(async()=>{
   const {createLoanRepository}=await import('/js/application/loan-repository.js');
   const {DB_NAME,DB_VERSION,STORES}=await import('/js/core/hardened-db.js');
   if(DB_NAME!=='kfe')throw new Error(`Unexpected DB name: ${DB_NAME}`);
   if(DB_VERSION!==9)throw new Error(`Unexpected DB version: ${DB_VERSION}`);
   if(STORES.loans?.keyPath!=='id'||STORES.loan_payments?.keyPath!=='id')throw new Error('Canonical loan stores are missing or have the wrong keyPath');
   const repository=createLoanRepository();
   const suffix=crypto.randomUUID();
   const loan={id:`loan-browser-round-trip-${suffix}`,principal_paise:1000000,annual_rate_percent:12,term_months:12,emi_paise:88849};
   const updated={...loan,emi_paise:90000};
   const payment={id:`loan-payment-browser-round-trip-${suffix}`,loan_id:loan.id,payment_paise:90000,principal_paise:80000,interest_paise:10000};
   const updatedPayment={...payment,interest_paise:9001,principal_paise:80999};
   await repository.create(loan);if(JSON.stringify(await repository.get(loan.id))!==JSON.stringify(loan))throw new Error('Loan CREATE/GET failed');
   if(!(await repository.list()).some(value=>value.id===loan.id))throw new Error('Loan CREATE/LIST failed');
   await repository.update(updated);if(JSON.stringify(await repository.get(loan.id))!==JSON.stringify(updated))throw new Error('Loan UPDATE/GET failed');
   await repository.createPayment(payment);if(JSON.stringify(await repository.getPayment(payment.id))!==JSON.stringify(payment))throw new Error('Loan payment CREATE/GET failed');
   await repository.updatePayment(updatedPayment);if(JSON.stringify(await repository.getPayment(payment.id))!==JSON.stringify(updatedPayment))throw new Error('Loan payment UPDATE/GET failed');
   if(!(await repository.listPayments()).some(value=>value.id===payment.id))throw new Error('Loan payment CREATE/LIST failed');
   await repository.removePayment(payment.id);if(await repository.getPayment(payment.id)!==undefined)throw new Error('Loan payment REMOVE failed');
   await repository.remove(loan.id);if(await repository.get(loan.id)!==undefined)throw new Error('Loan REMOVE failed');
   return {database:DB_NAME,version:DB_VERSION,stores:['loans','loan_payments'],result:'PASS'};
 }), 'Loan IndexedDB round-trip');console.log(`PHASE_5_LOANS_REAL_INDEXEDDB_PERSISTENCE=${result.result}`);console.log(JSON.stringify(result));}finally{await context.close();}}finally{await browser.close();}
}finally{stopServer();}
