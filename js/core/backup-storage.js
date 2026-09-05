const DB_NAME='kfe-backup';
const DB_VERSION=1;
const STORES={meta:{keyPath:'id'},payload:{keyPath:'id'},keys:{keyPath:'id'}};
let dbPromise=null;
function requestResult(request){return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('KFE backup storage request failed'));});}
function open(){
  if(dbPromise)return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    if(typeof indexedDB==='undefined'){dbPromise=null;reject(new Error('IndexedDB unavailable'));return;}
    const request=indexedDB.open(DB_NAME,DB_VERSION);
    request.onupgradeneeded=()=>{for(const [name,definition] of Object.entries(STORES))if(!request.result.objectStoreNames.contains(name))request.result.createObjectStore(name,definition);};
    request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();dbPromise=null;};resolve(db);};
    request.onerror=()=>{dbPromise=null;reject(request.error||new Error('KFE backup database failed to open'));};
  });
  return dbPromise;
}
export async function closeBackupStorage(){if(!dbPromise)return;try{const db=await dbPromise;db.close();}finally{dbPromise=null;}}
export async function resetBackupStorage(){await closeBackupStorage();await new Promise((resolve,reject)=>{if(typeof indexedDB==='undefined'){reject(new Error('IndexedDB unavailable'));return;}const request=indexedDB.deleteDatabase(DB_NAME);request.onsuccess=()=>resolve();request.onerror=()=>reject(request.error||new Error('KFE backup data reset failed'));request.onblocked=()=>reject(new Error('KFE backup data reset blocked by an open database connection'));});}
async function get(store,id){const db=await open();return requestResult(db.transaction(store,'readonly').objectStore(store).get(id));}
async function put(store,value){const db=await open();return requestResult(db.transaction(store,'readwrite').objectStore(store).put(value));}
async function remove(store,id){const db=await open();return requestResult(db.transaction(store,'readwrite').objectStore(store).delete(id));}
export const LOCAL_BACKUP_ID='current';
export const LOCAL_SAFETY_BACKUP_ID='safety';
export const LOCAL_BACKUP_KEY_ID='device';
export async function readMeta(){return get('meta',LOCAL_BACKUP_ID);}
export async function writeMeta(meta){return put('meta',{...meta,id:LOCAL_BACKUP_ID});}
export async function readSafetyMeta(){return get('meta',LOCAL_SAFETY_BACKUP_ID);}
export async function writeSafetyMeta(meta){return put('meta',{...meta,id:LOCAL_SAFETY_BACKUP_ID});}
export async function readPayload(id=LOCAL_BACKUP_ID){return get('payload',id);}
export async function writePayload(payload,id=LOCAL_BACKUP_ID){return put('payload',{...payload,id});}
export async function readDeviceKey(){return get('keys',LOCAL_BACKUP_KEY_ID);}
export async function writeDeviceKey(key){return put('keys',{id:LOCAL_BACKUP_KEY_ID,key});}
export async function clearLocalBackup(){await remove('meta',LOCAL_BACKUP_ID);await remove('payload',LOCAL_BACKUP_ID);}
