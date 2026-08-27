// Atomic restore orchestration. No business formulas.
import {STORE_NAMES,openKfeDb} from './hardened-db.js';
import {restoreSnapshot,validateSnapshot} from './backup.js';
import {assertAuthoritativeRecord} from './record.js';
import {validateReferences} from './referential-integrity.js';
export async function validateAuthoritativeStores(stores){
  for(const records of Object.values(stores||{})) for(const record of records||[]) if(record?.id) assertAuthoritativeRecord(record);
  return true;
}
export async function restoreKfeSnapshot(snapshot,relationships=[]){
  validateSnapshot(snapshot);await validateAuthoritativeStores(snapshot.stores);validateReferences(snapshot.stores,relationships.length?relationships:snapshot.relationships);
  const db=await openKfeDb();const names=STORE_NAMES.filter(name=>Object.prototype.hasOwnProperty.call(snapshot.stores,name));
  return restoreSnapshot(db,{...snapshot,stores:Object.fromEntries(names.map(name=>[name,snapshot.stores[name]]))},validateAuthoritativeStores,(stores,rels)=>validateReferences(stores,relationships.length?relationships:rels));
}
