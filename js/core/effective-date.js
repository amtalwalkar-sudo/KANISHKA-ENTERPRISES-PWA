// KFE foundation contract: configuration is effective-dated.
// No business values or formulas belong here.
export function isIsoUtcTimestamp(value){
  if(typeof value!=='string') return false;
  const date=new Date(value);
  return Number.isFinite(date.getTime())&&value===date.toISOString();
}

export function createEffectiveConfiguration({id,value,effective_from,effective_to=null,version=1}={}){
  if(typeof id!=='string'||!id) throw new TypeError('Configuration requires a stable id');
  if(!isIsoUtcTimestamp(effective_from)) throw new TypeError('Configuration requires effective_from as an ISO/UTC timestamp');
  if(effective_to!==null&&!isIsoUtcTimestamp(effective_to)) throw new TypeError('effective_to must be an ISO/UTC timestamp or null');
  if(effective_to!==null&&effective_to<=effective_from) throw new RangeError('effective_to must be later than effective_from');
  if(!Number.isInteger(version)||version<1) throw new TypeError('Configuration version must be a positive integer');
  return Object.freeze({id,value,effective_from,effective_to,version});
}

export function configurationEffectiveAt(configuration,at){
  if(!configuration?.effective_from||!isIsoUtcTimestamp(at)) return false;
  return configuration.effective_from<=at&&(configuration.effective_to===null||at<configuration.effective_to);
}
