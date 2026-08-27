// KFE physical base schemas. No business values or formulas belong here.
import {createRecord,assertAuthoritativeRecord,assertUuid,assertUtc} from './record.js';

export const TRANSACTIONAL_RECORD_FIELDS=Object.freeze(['id','user_id','created_at','updated_at','synced','is_deleted']);
export const CONFIGURATION_RECORD_FIELDS=Object.freeze([...TRANSACTIONAL_RECORD_FIELDS,'effective_from','effective_to','version']);

export function createTransactionalSchema(data={},meta={}){
  return createRecord(data,meta);
}

export function createConfigurationSchema({data={},meta={},effective_from,effective_to=null,version=1}={}){
  const record=createRecord(data,meta);
  assertUtc(effective_from,'effective_from');
  if(effective_to!==null)assertUtc(effective_to,'effective_to');
  if(effective_to!==null&&effective_to<=effective_from)throw new RangeError('effective_to must be later than effective_from');
  if(!Number.isInteger(version)||version<1)throw new TypeError('Configuration version must be a positive integer');
  return Object.freeze({...record,effective_from,effective_to,version});
}

export function assertTransactionalSchema(record){return assertAuthoritativeRecord(record);}

export function assertConfigurationSchema(record){
  assertAuthoritativeRecord(record);
  assertUtc(record.effective_from,'effective_from');
  if(record.effective_to!==null)assertUtc(record.effective_to,'effective_to');
  if(record.effective_to!==null&&record.effective_to<=record.effective_from)throw new RangeError('effective_to must be later than effective_from');
  if(!Number.isInteger(record.version)||record.version<1)throw new TypeError('Configuration version must be a positive integer');
  return record;
}

export function configurationEffectiveAt(record,at){
  assertConfigurationSchema(record); assertUtc(at,'at');
  return record.effective_from<=at&&(record.effective_to===null||at<record.effective_to);
}
