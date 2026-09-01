// KFE foundation idempotency contract. No business semantics.
let fallbackCounter=0;
function uuidFallback(){
  const hex=`${Date.now().toString(16).padStart(16,'0')}${(++fallbackCounter>>>0).toString(16).padStart(16,'0')}`.slice(-32).split('');
  hex[12]='4';hex[16]=['8','9','a','b'][fallbackCounter%4];const value=hex.join('');
  return `${value.slice(0,8)}-${value.slice(8,12)}-${value.slice(12,16)}-${value.slice(16,20)}-${value.slice(20)}`;
}
function generateId(){
  if(typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function')return crypto.randomUUID();
  if(typeof crypto!=='undefined'&&typeof crypto.getRandomValues==='function'){
    const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);bytes[6]=(bytes[6]&0x0f)|0x40;bytes[8]=(bytes[8]&0x3f)|0x80;
    const hex=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }
  return uuidFallback();
}
export function createOperationId(){return generateId();}
export function assertOperationId(value){if(typeof value!=='string'||!value.trim())throw new TypeError('operationId is required');return value;}

const inFlight=new Map();

export async function withIdempotency(repository,operationId,operation){
  assertOperationId(operationId);if(typeof operation!=='function')throw new TypeError('operation must be a function');
  const existing=await repository.getIdempotency?.(operationId);if(existing)return existing.result;
  const running=inFlight.get(operationId);if(running)return running;
  const task=(async()=>{
    const confirmed=await repository.getIdempotency?.(operationId);if(confirmed)return confirmed.result;
    const result=await operation();
    await repository.saveIdempotency?.({id:operationId,result,created_at:new Date().toISOString(),is_deleted:false});
    return result;
  })();
  inFlight.set(operationId,task);
  try{return await task;}finally{inFlight.delete(operationId);}
}
