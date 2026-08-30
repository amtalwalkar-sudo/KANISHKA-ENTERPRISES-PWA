// KFE foundation idempotency contract. No business semantics.
function generateId(){
  if(typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function')return crypto.randomUUID();
  if(typeof crypto!=='undefined'&&typeof crypto.getRandomValues==='function'){
    const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);bytes[6]=(bytes[6]&0x0f)|0x40;bytes[8]=(bytes[8]&0x3f)|0x80;
    const hex=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
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