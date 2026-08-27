// KFE IndexedDB foundation: explicit schema versions + atomic transaction support.
const DB_NAME='kfe';
export const DB_VERSION=2;
export const STORES={state:{keyPath:'id'},rides:{keyPath:'id'},logs:{keyPath:'id'},settings:{keyPath:'id'},outbox:{keyPath:'id'}};

export function openKfeDb(){return new Promise((resolve,reject)=>{if(typeof indexedDB==='undefined'){reject(new Error('IndexedDB unavailable'));return;}const request=indexedDB.open(DB_NAME,DB_VERSION);request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('state'))db.createObjectStore('state',STORES.state);if(!db.objectStoreNames.contains('rides'))db.createObjectStore('rides',STORES.rides);if(!db.objectStoreNames.contains('logs'))db.createObjectStore('logs',STORES.logs);if(!db.objectStoreNames.contains('settings'))db.createObjectStore('settings',STORES.settings);if(!db.objectStoreNames.contains('outbox'))db.createObjectStore('outbox',STORES.outbox);};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('IndexedDB open failed'));});}

export function runAtomicTransaction(db,storeNames,operation){
  if(!db)throw new TypeError('IndexedDB connection is required');
  if(!Array.isArray(storeNames)||storeNames.length===0)throw new TypeError('At least one object store is required');
  if(typeof operation!=='function')throw new TypeError('Transaction operation must be a function');
  return new Promise((resolve,reject)=>{
    let settled=false,result;
    let tx;
    try{
      tx=db.transaction(storeNames,'readwrite');
      tx.oncomplete=()=>{if(!settled){settled=true;resolve(result);}};
      tx.onerror=()=>{if(!settled){settled=true;reject(tx.error||new Error('IndexedDB transaction failed'));}};
      tx.onabort=()=>{if(!settled){settled=true;reject(tx.error||new Error('IndexedDB transaction aborted'));}};
      const stores=Object.freeze(Object.fromEntries(storeNames.map(name=>[name,tx.objectStore(name)])));
      result=operation(stores,tx);
    }catch(error){try{tx?.abort();}catch{}if(!settled){settled=true;reject(error);}}
  });
}

export function requestResult(request){return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('IndexedDB request failed'));});}

export async function read(storeName,id){const db=await openKfeDb();return new Promise((resolve,reject)=>{const r=db.transaction(storeName,'readonly').objectStore(storeName).get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function write(storeName,value){const db=await openKfeDb();return new Promise((resolve,reject)=>{const r=db.transaction(storeName,'readwrite').objectStore(storeName).put(value);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function remove(storeName,id){const db=await openKfeDb();return new Promise((resolve,reject)=>{const r=db.transaction(storeName,'readwrite').objectStore(storeName).delete(id);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);});}
export async function all(storeName){const db=await openKfeDb();return new Promise((resolve,reject)=>{const r=db.transaction(storeName,'readonly').objectStore(storeName).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);});}
export async function requestPersistentStorage(){try{if(navigator.storage?.persist){return await navigator.storage.persist();}}catch{}return false;}
export async function queueOutbox(payload){const result=await write('outbox',{id:crypto.randomUUID(),payload,createdAt:Date.now(),attempts:0});try{await navigator.serviceWorker?.ready?.then(reg=>reg.sync?.register('kfe-outbox-retry'));}catch{}return result;}
export async function flushOutbox(send){const pending=await all('outbox');for(const item of pending){try{await send(item.payload);await remove('outbox',item.id);}catch{await write('outbox',{...item,attempts:item.attempts+1,lastAttemptAt:Date.now()});}}return pending.length;}
export async function bufferCrash(error,meta={}){try{return write('logs',{id:crypto.randomUUID(),type:'crash',error:{name:error?.name||'Error',message:error?.message||String(error),stack:error?.stack||null},meta,createdAt:Date.now()});}catch{return null;}}
