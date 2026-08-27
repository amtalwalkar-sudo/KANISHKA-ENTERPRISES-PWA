// KFE foundation: authoritative local record contract. No business rules.
export const RECORD_METADATA_FIELDS=Object.freeze(['id','user_id','created_at','updated_at','synced','is_deleted']);
function uuid(){return crypto.randomUUID();}
export function utcNow(){return new Date().toISOString();}
export function assertUtc(value,name='timestamp'){
  if(typeof value!=='string'||new Date(value).toISOString()!==value) throw new TypeError(`${name} must be an ISO/UTC timestamp`);
  return value;
}
export function createRecord(data={},meta={}){
  const now=utcNow();
  const record={...data,id:meta.id||uuid(),user_id:meta.user_id??null,created_at:meta.created_at||now,updated_at:meta.updated_at||now,synced:meta.synced===true,is_deleted:meta.is_deleted===true};
  assertUtc(record.created_at,'created_at'); assertUtc(record.updated_at,'updated_at');
  return Object.freeze(record);
}
export function updateRecord(existing,changes={}){
  if(!existing?.id) throw new TypeError('Cannot update a record without id');
  return createRecord({...existing,...changes},{id:existing.id,user_id:existing.user_id,created_at:existing.created_at,updated_at:utcNow(),synced:false,is_deleted:existing.is_deleted});
}
export function softDeleteRecord(existing){return updateRecord(existing,{is_deleted:true});}
export function assertAuthoritativeRecord(record){
  if(!record||typeof record!=='object') throw new TypeError('Record must be an object');
  if(typeof record.id!=='string'||!record.id) throw new TypeError('Record id is required');
  assertUtc(record.created_at,'created_at'); assertUtc(record.updated_at,'updated_at');
  if(typeof record.synced!=='boolean'||typeof record.is_deleted!=='boolean') throw new TypeError('Record sync/delete metadata is invalid');
  return record;
}
