// Persistence boundary. UI/view-models/application/domain code never access storage directly.
import {openKfeDb,read,write,remove,all,runAtomicTransaction} from './hardened-db.js';
import {createRecord,assertAuthoritativeRecord,updateRecord,softDeleteRecord} from './record.js';
import {createConfigurationSchema,assertConfigurationSchema} from './schemas.js';
const KEY='kfe:state:v1';
function clone(value){return structuredClone(value);}
function assertStoreName(name){if(typeof name!=='string'||!name)throw new TypeError('Repository store name is required');return name;}

// Base repository for all domain entities. Metadata is created/validated here,
// at the persistence boundary, rather than being trusted from callers.
export function createEntityRepository(storeName){
  assertStoreName(storeName);
  return Object.freeze({
    async get(id){return read(storeName,id);},
    async list(){return all(storeName);},
    async create(data={},meta={}){const record=createRecord(data,meta);await write(storeName,record);return clone(record);},
    async update(existing,changes={}){const record=updateRecord(existing,changes);await write(storeName,record);return clone(record);},
    async softDelete(existing){const record=softDeleteRecord(existing);await write(storeName,record);return clone(record);},
    assert:assertAuthoritativeRecord
  });
}

// Configuration repository: configuration records carry effective dating and
// versioning in addition to the authoritative metadata contract.
export function createConfigurationRepository(storeName){
  assertStoreName(storeName);
  return Object.freeze({
    async get(id){const record=await read(storeName,id);return record?assertConfigurationSchema(record):null;},
    async list(){return (await all(storeName)).map(assertConfigurationSchema);},
    async create(options={}){const record=createConfigurationSchema(options);await write(storeName,record);return clone(record);},
    async update(existing,changes={}){
      assertConfigurationSchema(existing);
      const record=createConfigurationSchema({
        data:{...existing,...changes},
        meta:{id:existing.id,user_id:existing.user_id,created_at:existing.created_at,updated_at:new Date().toISOString(),synced:false,is_deleted:existing.is_deleted},
        effective_from:changes.effective_from??existing.effective_from,
        effective_to:changes.effective_to??existing.effective_to,
        version:changes.version??existing.version
      });
      await write(storeName,record);return clone(record);
    },
    assert:assertConfigurationSchema
  });
}

export function createRepository({initial={}}={}){
  let memory=clone(initial);let hydrated=false;
  async function load(){if(hydrated)return clone(memory);hydrated=true;await openKfeDb();const record=await read('state',KEY);memory=record?.value?clone(record.value):clone(initial);return clone(memory);}
  // `state` is an internal singleton keyed by a stable namespace key, not a
  // domain entity; entity repositories above enforce the UUID contract.
  async function save(next){memory=clone(next);const now=new Date().toISOString();await write('state',{id:KEY,value:memory,created_at:now,updated_at:now,synced:false,is_deleted:false});return clone(memory);}
  async function clear(){memory=clone(initial);await remove('state',KEY);return clone(memory);}
  async function atomic(storeNames,operation){const db=await openKfeDb();return runAtomicTransaction(db,storeNames,operation);}
  return {load,save,clear,atomic,createRecord:(data,meta)=>createRecord(data,meta),updateRecord:(existing,changes)=>updateRecord(existing,changes),softDeleteRecord,assertRecord:assertAuthoritativeRecord,entity:(store)=>createEntityRepository(store),configuration:(store)=>createConfigurationRepository(store),async getIdempotency(id){return read('idempotency',id);},async saveIdempotency(entry){return write('idempotency',entry);}};
}
