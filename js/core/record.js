// KFE foundation: authoritative local record contract. No business rules.
export const RECORD_METADATA_FIELDS=Object.freeze(['id','user_id','created_at','updated_at','synced','is_deleted']);
const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function uuid(){
  if(typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function')return crypto.randomUUID();
  if(typeof crypto!=='undefined'&&typeof crypto.getRandomValues==='function'){const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);bytes[6]=(bytes[6]&0x0f)|0x40;bytes[8]=(bytes[8]&0x3f)|0x80;const hex=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;}
  const r=()=>Math.floor(Math.random()*0xffffffff).toString(16).padStart(8,'0');return `${r()}-${r().slice(0,4)}-4${r().slice(0,3)}-8${r().slice(0,3)}-${r()}${r().slice(0,4)}`;
}
export function utcNow(){return new Date().toISOString();}
export function assertUuid(value,name='id'){if(typeof value!=='string'||!UUID_RE.test(value))throw new TypeError(`${name} must be a UUID`);return value;}
export function assertUtc(value,name='timestamp'){if(typeof value!=='string'||new Date(value).toISOString()!==value)throw new TypeError(`${name} must be an ISO/UTC timestamp`);return value;}
export function createRecord(data={},meta={}){const now=utcNow();const record={...data,id:meta.id||uuid(),user_id:meta.user_id??null,created_at:meta.created_at||now,updated_at:meta.updated_at||now,synced:meta.synced===true,is_deleted:meta.is_deleted===true};assertUuid(record.id);assertUtc(record.created_at,'created_at');assertUtc(record.updated_at,'updated_at');return Object.freeze(record);}
export function updateRecord(existing,changes={}){assertAuthoritativeRecord(existing);const nextDeleted=Object.prototype.hasOwnProperty.call(changes,'is_deleted')?changes.is_deleted:existing.is_deleted;return createRecord({...existing,...changes},{id:existing.id,user_id:existing.user_id,created_at:existing.created_at,updated_at:utcNow(),synced:false,is_deleted:nextDeleted});}
export function softDeleteRecord(existing){return updateRecord(existing,{is_deleted:true});}
export function assertAuthoritativeRecord(record){if(!record||typeof record!=='object')throw new TypeError('Record must be an object');assertUuid(record.id);assertUtc(record.created_at,'created_at');assertUtc(record.updated_at,'updated_at');if(record.user_id!==null&&record.user_id!==undefined)assertUuid(record.user_id,'user_id');if(typeof record.synced!=='boolean'||typeof record.is_deleted!=='boolean')throw new TypeError('Record sync/delete metadata is invalid');return record;}
export function createTransactionalRecord(data={},meta={}){return createRecord(data,meta);}
export function assertTransactionalRecord(record){return assertAuthoritativeRecord(record);}
