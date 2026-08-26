// Persistence boundary. UI, view-models and domain code never access storage directly.
import {openKfeDb,read,write,remove} from './idb.js';
const KEY='kfe:state:v1';
function clone(value){return structuredClone(value);}

export function createRepository({initial={}}={}){
  let memory=clone(initial);
  let hydrated=false;
  return {
    async load(){
      if(hydrated) return clone(memory);
      hydrated=true;
      try{
        await openKfeDb();
        const record=await read('state',KEY);
        memory=record?.value?clone(record.value):clone(initial);
      }catch{memory=clone(initial);}
      return clone(memory);
    },
    async save(next){
      memory=clone(next);
      try{await write('state',{id:KEY,value:memory,updatedAt:Date.now()});}catch{/* memory remains authoritative for this session */}
      return clone(memory);
    },
    async clear(){
      memory=clone(initial);
      try{await remove('state',KEY);}catch{}
      return clone(memory);
    }
  };
}
