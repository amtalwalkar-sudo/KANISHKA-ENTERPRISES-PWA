// Atomic restore orchestration. No business formulas.
import {STORE_NAMES,openKfeDb} from './hardened-db.js';
import {restoreSnapshot,validateSnapshot} from './backup.js';
import {assertAuthoritativeRecord} from './record.js';
import {validateReferences} from './referential-integrity.js';
export class InvalidBackupSchemaError extends Error { constructor(message='Backup violates KFE FSM invariants'){super(message);this.name='InvalidBackupSchemaError';} }
export async function validateAuthoritativeStores(stores){
  for(const records of Object.values(stores||{})) for(const record of records||[]) if(record?.id) assertAuthoritativeRecord(record);
  return true;
}
export function validateBackupFSMInvariants(stores){
  const days=(stores?.work_days||[]).filter(record=>record&&!record.is_deleted&&record.status!=='CANCELLED');
  const shifts=(stores?.work_sessions||[]).filter(record=>record&&!record.is_deleted&&record.status==='OPEN');
  const openDays=days.filter(record=>record.status==='OPEN');
  if(openDays.length>1) throw new InvalidBackupSchemaError('Backup contains multiple active day records');
  const completedDates=new Set(days.filter(record=>record.status==='COMPLETED').map(record=>record.business_date));
  if(shifts.some(record=>completedDates.has(record.business_date))) throw new InvalidBackupSchemaError('Backup contains an open shift for a completed day');
  return true;
}
export async function restoreKfeSnapshot(snapshot,relationships=[]){
  validateSnapshot(snapshot);await validateAuthoritativeStores(snapshot.stores);validateBackupFSMInvariants(snapshot.stores);validateReferences(snapshot.stores,relationships.length?relationships:snapshot.relationships);
  const db=await openKfeDb();const names=STORE_NAMES.filter(name=>Object.prototype.hasOwnProperty.call(snapshot.stores,name));
  return restoreSnapshot(db,{...snapshot,stores:Object.fromEntries(names.map(name=>[name,snapshot.stores[name]]))},stores=>{validateAuthoritativeStores(stores);return validateBackupFSMInvariants(stores);},(stores,rels)=>validateReferences(stores,relationships.length?relationships:rels));
}
