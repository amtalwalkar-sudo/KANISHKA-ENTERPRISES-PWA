import {all,remove,write} from './hardened-db.js';

// Infrastructure-only outbox delivery. Raw domain records remain authoritative.
let flushPromise=null;

export async function queueOutbox(payload){
  if(!payload||typeof payload!=='object')throw new TypeError('payload must be an object');
  const id=payload.id??(globalThis.crypto?.randomUUID?.()||`outbox-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  if(typeof id!=='string'||!id)throw new TypeError('outbox id must be a non-empty string');
  const createdAt=payload.created_at??payload.queuedAt??new Date().toISOString();
  const existing=(await all('outbox')).find(entry=>entry.id===id);
  const attempts=Number(existing?.attempt_count??existing?.attemptCount??payload.attempt_count??payload.attemptCount??0);
  const entry={...existing,...payload,id,created_at:createdAt,queuedAt:payload.queuedAt??existing?.queuedAt??createdAt,deliveryKey:payload.deliveryKey??existing?.deliveryKey??id,attempt_count:attempts,attemptCount:attempts,status:'PENDING',nextRetryAt:payload.nextRetryAt??existing?.nextRetryAt??createdAt};
  await write('outbox',entry);
  return structuredClone(entry);
}

export async function flushOutbox(send){
  if(typeof send!=='function')throw new TypeError('send must be a function');
  if(flushPromise)return flushPromise;
  flushPromise=(async()=>{
    const entries=(await all('outbox')).filter(entry=>{const status=String(entry?.status||'PENDING').toUpperCase();return status==='PENDING';}).filter(entry=>{
      const next=Date.parse(String(entry?.nextRetryAt||entry?.created_at||''));
      return !Number.isFinite(next)||next<=Date.now();
    }).sort((a,b)=>{
      const byTime=Date.parse(String(a?.queuedAt||a?.created_at||''))-Date.parse(String(b?.queuedAt||b?.created_at||''));
      return byTime||String(a?.id||'').localeCompare(String(b?.id||''));
    });
    for(const entry of entries){
      try{
        await send(structuredClone(entry));
        if(entry?.id!=null)await remove('outbox',entry.id);
      }catch(error){
        const attempts=Number(entry?.attempt_count??entry?.attemptCount??0)+1;
        await write('outbox',{...entry,attempt_count:attempts,attemptCount:attempts,lastError:String(error?.message||error||'Delivery failed'),lastAttemptAt:new Date().toISOString(),nextRetryAt:new Date().toISOString(),status:'PENDING'});
        throw error;
      }
    }
  })();
  try{return await flushPromise;}finally{flushPromise=null;}
}
