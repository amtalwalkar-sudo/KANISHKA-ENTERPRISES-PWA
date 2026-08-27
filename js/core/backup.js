// Versioned KFE snapshot contract. Derived state is never authoritative.
export const KFE_BACKUP_VERSION='kfe_backup_v2';
export function createSnapshot({stores,configuration=[],relationships=[],calculationVersions=[]}={}){
  return {schemaVersion:KFE_BACKUP_VERSION,createdAt:new Date().toISOString(),stores,configuration,relationships,calculationVersions};
}
export function validateSnapshot(snapshot){
  if(!snapshot||snapshot.schemaVersion!==KFE_BACKUP_VERSION)throw new TypeError('Unsupported KFE backup schema');
  if(!snapshot.stores||typeof snapshot.stores!=='object')throw new TypeError('Backup stores are required');
  if(!Array.isArray(snapshot.configuration)||!Array.isArray(snapshot.relationships)||!Array.isArray(snapshot.calculationVersions))throw new TypeError('Backup contract is invalid');
  return true;
}
export async function restoreSnapshot(db,snapshot,validateRecords,validateRelationships){
  validateSnapshot(snapshot); if(validateRecords)await validateRecords(snapshot.stores); if(validateRelationships)validateRelationships(snapshot.stores,snapshot.relationships);
  const names=Object.keys(snapshot.stores); const {runAtomicTransaction}=await import('./transaction.js');
  return runAtomicTransaction(db,names,(stores)=>{for(const name of names){const store=stores[name];for(const record of snapshot.stores[name]||[])store.put(record);}return true;});
}
