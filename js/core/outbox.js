import {all,remove} from './hardened-db.js';

// Infrastructure-only outbox delivery. Raw domain records remain authoritative.
export async function flushOutbox(send){
  if(typeof send!=='function')throw new TypeError('send must be a function');
  const entries=await all('outbox');
  for(const entry of entries){
    await send(entry);
    if(entry?.id!=null)await remove('outbox',entry.id);
  }
}
