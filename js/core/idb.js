// KFE IndexedDB foundation: explicit schema versions + non-destructive migrations.
const DB_NAME='kfe';
export const DB_VERSION=1;

export const STORES={
  state:{keyPath:'id'},
  rides:{keyPath:'id'},
  logs:{keyPath:'id'},
  settings:{keyPath:'id'}
};

export function openKfeDb(){
  return new Promise((resolve,reject)=>{
    if(typeof indexedDB==='undefined'){reject(new Error('IndexedDB unavailable'));return;}
    const request=indexedDB.open(DB_NAME,DB_VERSION);
    request.onupgradeneeded=event=>{
      const db=request.result;
      if(!db.objectStoreNames.contains('state')) db.createObjectStore('state',STORES.state);
      if(!db.objectStoreNames.contains('rides')) db.createObjectStore('rides',STORES.rides);
      if(!db.objectStoreNames.contains('logs')) db.createObjectStore('logs',STORES.logs);
      if(!db.objectStoreNames.contains('settings')) db.createObjectStore('settings',STORES.settings);
      // Future schema changes MUST increment DB_VERSION and add a migration branch here.
      // Never delete/replace an existing store without an explicit migration.
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error('IndexedDB open failed'));
  });
}

export async function read(storeName,id){const db=await openKfeDb();return new Promise((resolve,reject)=>{const r=db.transaction(storeName,'readonly').objectStore(storeName).get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function write(storeName,value){const db=await openKfeDb();return new Promise((resolve,reject)=>{const r=db.transaction(storeName,'readwrite').objectStore(storeName).put(value);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function remove(storeName,id){const db=await openKfeDb();return new Promise((resolve,reject)=>{const r=db.transaction(storeName,'readwrite').objectStore(storeName).delete(id);r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);});}
