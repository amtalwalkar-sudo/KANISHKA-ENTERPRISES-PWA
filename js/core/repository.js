// Persistence boundary. UI/view-models/application/domain code never access storage directly.
import {openKfeDb,read,write,remove} from './idb.js';
import {createRecord,assertAuthoritativeRecord,updateRecord,softDeleteRecord} from './record.js';
const KEY='kfe:state:v1';
function clone(value){return structuredClone(value);}
export function createRepository({initial={}}={}){
  let memory=clone(initial); let hydrated=false;
  async function load(){if(hydrated)return clone(memory);hydrated=true;await openKfeDb();const record=await read('state',KEY);memory=record?.value?clone(record.value):clone(initial);return clone(memory);}
  async function save(next){memory=clone(next);await write('state',{id:KEY,value:memory,updatedAt:Date.now()});return clone(memory);}
  async function clear(){memory=clone(initial);await remove('state',KEY);return clone(memory);}
  return {load,save,clear,createRecord:(data,meta)=>createRecord(data,meta),updateRecord:(existing,changes)=>updateRecord(existing,changes),softDeleteRecord,assertRecord:assertAuthoritativeRecord,async getIdempotency(id){return read('idempotency',id);},async saveIdempotency(entry){return write('idempotency',entry);}};
}
