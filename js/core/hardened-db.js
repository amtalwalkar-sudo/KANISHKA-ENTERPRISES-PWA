// KFE canonical IndexedDB schema. Version 5 adds authoritative Renewals / Compliance persistence; no legacy business formulas.
import {runAtomicTransaction} from './transaction.js';
export const DB_NAME='kfe';
export const DB_VERSION=5;
export const STORES=Object.freeze({state:{keyPath:'id'},rides:{keyPath:'id'},logs:{keyPath:'id'},settings:{keyPath:'id'},outbox:{keyPath:'id'},config:{keyPath:'id'},audit:{keyPath:'id'},idempotency:{keyPath:'id'},vehicles:{keyPath:'id'},work_sessions:{keyPath:'id'},fuel_records:{keyPath:'id'},expense_records:{keyPath:'id'},maintenance_items:{keyPath:'id'},maintenance_records:{keyPath:'id'},revenue_records:{keyPath:'id'},loans:{keyPath:'id'},loan_payments:{keyPath:'id'},renewals_compliance:{keyPath:'id'},calculation_results:{keyPath:'id'},alerts:{keyPath:'id'}});
export const STORE_NAMES=Object.freeze(Object.keys(STORES));
export {runAtomicTransaction};
export function openKfeDb(){return new Promise((resolve,reject)=>{if(typeof indexedDB==='undefined')return reject(new Error('IndexedDB unavailable'));const request=indexedDB.open(DB_NAME,DB_VERSION);request.onupgradeneeded=()=>{const db=request.result;for(const [name,definition] of Object.entries(STORES))if(!db.objectStoreNames.contains(name))db.createObjectStore(name,definition);};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('IndexedDB open failed'));});}
export const requestResult=request=>new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('IndexedDB request failed'));});
export async function read(storeName,id){const db=await openKfeDb();return requestResult(db.transaction(storeName,'readonly').objectStore(storeName).get(id));}
export async function write(storeName,value){const db=await openKfeDb();return requestResult(db.transaction(storeName,'readwrite').objectStore(storeName).put(value));}
export async function remove(storeName,id){const db=await openKfeDb();return requestResult(db.transaction(storeName,'readwrite').objectStore(storeName).delete(id));}
export async function all(storeName){const db=await openKfeDb();return requestResult(db.transaction(storeName,'readonly').objectStore(storeName).getAll());}
export async function bufferCrash(error,context={}){const id=globalThis.crypto?.randomUUID?.()||`crash-${Date.now()}-${Math.random().toString(36).slice(2)}`;return write('logs',{id,createdAt:new Date().toISOString(),message:String(error?.message||error||'Unknown error'),stack:error?.stack||null,context});}
export async function requestPersistentStorage(){try{return navigator.storage?.persist?await navigator.storage.persist():false;}catch{return false;}}