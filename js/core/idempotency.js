// KFE foundation idempotency contract. No business semantics.
export function createOperationId(){return crypto.randomUUID();}
export function assertOperationId(value){if(typeof value!=='string'||!value.trim())throw new TypeError('operationId is required');return value;}
export async function withIdempotency(repository,operationId,operation){
  assertOperationId(operationId);if(typeof operation!=='function')throw new TypeError('operation must be a function');
  const existing=await repository.getIdempotency?.(operationId);if(existing)return existing.result;
  const result=await operation();
  await repository.saveIdempotency?.({id:operationId,result,created_at:new Date().toISOString(),is_deleted:false});
  return result;
}
