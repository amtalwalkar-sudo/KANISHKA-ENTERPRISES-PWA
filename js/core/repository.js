// Persistence boundary. UI/view-models/application/domain code never access storage directly.
import {openKfeDb,read,write,remove,all,runAtomicTransaction,STORE_NAMES,DB_NAME,DB_VERSION} from './hardened-db.js';
import {createRecord,assertAuthoritativeRecord,updateRecord,softDeleteRecord} from './record.js';
import {createConfigurationSchema,assertConfigurationSchema} from './schemas.js';
const KEY='kfe:state:v1';
function clone(value){return structuredClone(value);}
function assertStoreName(name){if(typeof name!=='string'||!name)throw new TypeError('Repository store name is required');return name;}

export function createEntityRepository(storeName,{notify=()=>{}}={}){
  assertStoreName(storeName);
  return Object.freeze({
    async get(id){return read(storeName,id);},
    async list(){return all(storeName);},
    async create(data={},meta={}){const record=createRecord(data,meta);await write(storeName,record);notify({type:'create',store:storeName,id:record.id});return clone(record);},
    async update(existing,changes={}){const record=updateRecord(existing,changes);await write(storeName,record);notify({type:'update',store:storeName,id:record.id});return clone(record);},
    async softDelete(existing){const record=softDeleteRecord(existing);await write(storeName,record);notify({type:'soft-delete',store:storeName,id:record.id});return clone(record);},
    assert:assertAuthoritativeRecord
  });
}

export function createConfigurationRepository(storeName,{notify=()=>{}}={}){
  assertStoreName(storeName);
  return Object.freeze({
    async get(id){const record=await read(storeName,id);return record?assertConfigurationSchema(record):null;},
    async list(){return (await all(storeName)).map(assertConfigurationSchema);},
    async create(options={}){const record=createConfigurationSchema(options);await write(storeName,record);notify({type:'create',store:storeName,id:record.id});return clone(record);},
    async update(existing,changes={}){
      assertConfigurationSchema(existing);
      const record=createConfigurationSchema({
        data:{...existing,...changes},
        meta:{id:existing.id,user_id:existing.user_id,created_at:existing.created_at,updated_at:new Date().toISOString(),synced:false,is_deleted:existing.is_deleted},
        effective_from:changes.effective_from??existing.effective_from,
        effective_to:changes.effective_to??existing.effective_to,
        version:changes.version??existing.version
      });
      await write(storeName,record);notify({type:'update',store:storeName,id:record.id});return clone(record);
    },
    assert:assertConfigurationSchema
  });
}

export function createRepository({initial={},onMutation=null}={}){
  let memory=clone(initial);
  let hydrationPromise=null;
  const listeners=new Set();
  if(typeof onMutation==='function')listeners.add(onMutation);
  function notifyMutation(event){for(const listener of listeners){try{listener(event);}catch{}}}
  function subscribeMutations(listener){if(typeof listener!=='function')throw new TypeError('Repository mutation listener is required');listeners.add(listener);return ()=>listeners.delete(listener);}
  async function load(){
    if(hydrationPromise)return hydrationPromise;
    hydrationPromise=(async()=>{
      await openKfeDb();
      const record=await read('state',KEY);
      memory=record?.value?clone(record.value):clone(initial);
      return clone(memory);
    })();
    try{return await hydrationPromise;}
    catch(error){hydrationPromise=null;throw error;}
  }
  async function save(next){memory=clone(next);const now=new Date().toISOString();await write('state',{id:KEY,value:memory,created_at:now,updated_at:now,synced:false,is_deleted:false});notifyMutation({type:'save-state',store:'state',id:KEY});return clone(memory);}
  async function clear(){memory=clone(initial);await remove('state',KEY);notifyMutation({type:'clear-state',store:'state',id:KEY});return clone(memory);}
  async function atomic(storeNames,operation){const db=await openKfeDb();const result=await runAtomicTransaction(db,storeNames,operation);notifyMutation({type:'atomic',stores:[...storeNames]});return result;}
  async function exportSnapshot(){
    await openKfeDb();
    const stores={};
    for(const name of STORE_NAMES)stores[name]=await all(name);
    return clone({schemaVersion:1,dbName:DB_NAME,dbVersion:DB_VERSION,createdAt:new Date().toISOString(),stores});
  }
  async function importSnapshot(snapshot){
    if(!snapshot||typeof snapshot!=='object'||snapshot.schemaVersion!==1||snapshot.dbName!==DB_NAME||!Number.isInteger(snapshot.dbVersion)||snapshot.dbVersion>DB_VERSION||!snapshot.stores||typeof snapshot.stores!=='object')throw new TypeError('Invalid KFE backup file');
    const names=Object.keys(snapshot.stores);
    if(names.some(name=>!STORE_NAMES.includes(name)))throw new TypeError('Backup contains an unknown KFE data store');
    for(const name of names)if(!Array.isArray(snapshot.stores[name]))throw new TypeError(`Backup store ${name} is invalid`);
    for(const name of names)for(const record of snapshot.stores[name])if(!record||typeof record!=='object'||typeof record.id!=='string')throw new TypeError(`Backup record in ${name} is invalid`);
    const db=await openKfeDb();
    const result=await runAtomicTransaction(db,STORE_NAMES,(stores)=>{
      for(const name of STORE_NAMES)stores[name].clear();
      for(const name of names)for(const record of snapshot.stores[name])stores[name].put(record);
      return true;
    });
    memory=clone(initial);hydrationPromise=null;notifyMutation({type:'restore',stores:[...STORE_NAMES]});return result;
  }
  const entity=store=>createEntityRepository(store,{notify:notifyMutation});
  const configuration=store=>createConfigurationRepository(store,{notify:notifyMutation});
  return {load,save,clear,atomic,exportSnapshot,importSnapshot,subscribeMutations,createRecord:(data,meta)=>createRecord(data,meta),updateRecord:(existing,changes)=>updateRecord(existing,changes),softDeleteRecord,assertRecord:assertAuthoritativeRecord,entity,configuration,async getIdempotency(id){return read('idempotency',id);},async saveIdempotency(entry){const result=await write('idempotency',entry);notifyMutation({type:'idempotency',store:'idempotency',id:entry?.id});return result;}};
}
