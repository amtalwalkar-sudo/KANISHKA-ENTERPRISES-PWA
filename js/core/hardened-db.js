// KFE canonical IndexedDB schema. Version 9 adds the Fixed Expense lifecycle persistence foundation.
import {runAtomicTransaction} from './transaction.js';
export const DB_NAME='kfe';
export const DB_VERSION=9;
export const STORES=Object.freeze({state:{keyPath:'id'},rides:{keyPath:'id'},logs:{keyPath:'id'},settings:{keyPath:'id'},outbox:{keyPath:'id'},config:{keyPath:'id'},audit:{keyPath:'id'},idempotency:{keyPath:'id'},vehicles:{keyPath:'id'},drivers:{keyPath:'id'},vehicle_driver_assignments:{keyPath:'id'},vehicle_odometer_readings:{keyPath:'id'},vehicle_disposal_records:{keyPath:'id'},vehicle_lifecycle_events:{keyPath:'id'},work_sessions:{keyPath:'id'},work_days:{keyPath:'id'},odometer_allocations:{keyPath:'id'},operational_events:{keyPath:'id'},fuel_records:{keyPath:'id'},expense_records:{keyPath:'id'},fixed_expenses:{keyPath:'id'},maintenance_items:{keyPath:'id'},maintenance_records:{keyPath:'id'},revenue_records:{keyPath:'id'},loans:{keyPath:'id'},loan_payments:{keyPath:'id'},renewals_compliance:{keyPath:'id'},calculation_results:{keyPath:'id'},alerts:{keyPath:'id'}});
export const STORE_NAMES=Object.freeze(Object.keys(STORES));
export {runAtomicTransaction};
let dbPromise=null;
function ensureStores(db){for(const [name,definition] of Object.entries(STORES))if(!db.objectStoreNames.contains(name))db.createObjectStore(name,definition);}
export function openKfeDb(){
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    if(typeof indexedDB==='undefined'){dbPromise=null;return reject(new Error('IndexedDB unavailable'));}
    const request=indexedDB.open(DB_NAME,DB_VERSION);
    request.onupgradeneeded=()=>ensureStores(request.result);
    request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();dbPromise=null;};resolve(db);};
    request.onerror=()=>{dbPromise=null;reject(request.error||new Error('IndexedDB open failed'));};
  });
  return dbPromise;
}
export const requestResult=request=>new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('IndexedDB request failed'));});
export async function read(storeName,id){const db=await openKfeDb();return requestResult(db.transaction(storeName,'readonly').objectStore(storeName).get(id));}
export async function write(storeName,value){const db=await openKfeDb();const result=await requestResult(db.transaction(storeName,'readwrite').objectStore(storeName).put(value));if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('kfe:storage-mutated',{detail:{store:storeName,operation:'write'}}));return result;}
export async function remove(storeName,id){const db=await openKfeDb();const result=await requestResult(db.transaction(storeName,'readwrite').objectStore(storeName).delete(id));if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('kfe:storage-mutated',{detail:{store:storeName,operation:'remove',id}}));return result;}
export async function all(storeName){const db=await openKfeDb();return requestResult(db.transaction(storeName,'readonly').objectStore(storeName).getAll());}
let crashCounter=0;
export async function bufferCrash(error,context={}){const id=`crash-${Date.now().toString(36)}-${(++crashCounter).toString(36)}`;return write('logs',{id,createdAt:new Date().toISOString(),message:String(error?.message||error||'Unknown error'),stack:error?.stack||null,context});}
export async function requestPersistentStorage(){try{return navigator.storage?.persist?await navigator.storage.persist():false;}catch{return false;}}
