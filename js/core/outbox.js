import {all,remove,write} from './hardened-db.js';

// Infrastructure-only outbox delivery. Raw domain records remain authoritative.
export async function queueOutbox(payload){
  if(!payload||typeof payload!=='object')throw new TypeError('payload must be an object');
  const id=payload.id??(globalThis.crypto?.randomUUID?.()||`outbox-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const entry={...payload,id,queuedAt:payload.queuedAt??new Date().toISOString()};
  await write('outbox',entry);
  return structuredClone(entry);
}

export async function flushOutbox(send){
  if(typeof send!=='function')throw new TypeError('send must be a function');
  const entries=await all('outbox');
  for(const entry of entries){
    await send(entry);
    if(entry?.id!=null)await remove('outbox',entry.id);
  }
}
