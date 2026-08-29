// KFE foundation idempotency contract. No business semantics.
export function createOperationId(){return crypto.randomUUID();}
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
