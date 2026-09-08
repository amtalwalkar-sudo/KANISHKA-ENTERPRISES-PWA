import {all,remove,write} from './hardened-db.js';

// Infrastructure-only outbox delivery. Raw domain records remain authoritative.
let flushPromise=null;

export async function queueOutbox(payload){
  if(!payload||typeof payload!=='object')throw new TypeError('payload must be an object');
  const id=payload.id??(globalThis.crypto?.randomUUID?.()||`outbox-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  if(typeof id!=='string'||!id)throw new TypeError('outbox id must be a non-empty string');
  const queuedAt=payload.queuedAt??new Date().toISOString();
  const existing=(await all('outbox')).find(entry=>entry.id===id);
  const entry={...existing,...payload,id,queuedAt,deliveryKey:payload.deliveryKey??existing?.deliveryKey??id,attemptCount:Number(existing?.attemptCount??payload.attemptCount??0),status:'PENDING',nextRetryAt:payload.nextRetryAt??existing?.nextRetryAt??queuedAt};
  await write('outbox',entry);
  return structuredClone(entry);
}

export async function flushOutbox(send){
  if(typeof send!=='function')throw new TypeError('send must be a function');
  if(flushPromise)return flushPromise;
  flushPromise=(async()=>{
    const entries=(await all('outbox')).filter(entry=>String(entry?.status||'PENDING')==='PENDING').filter(entry=>{
      const next=Date.parse(String(entry?.nextRetryAt||''));
      return !Number.isFinite(next)||next<=Date.now();
    }).sort((a,b)=>{
      const byTime=Date.parse(String(a?.queuedAt||''))-Date.parse(String(b?.queuedAt||''));
      return byTime||String(a?.id||'').localeCompare(String(b?.id||''));
    });
    for(const entry of entries){
      try{
        await send(structuredClone(entry));
        if(entry?.id!=null)await remove('outbox',entry.id);
      }catch(error){
        const attempts=Number(entry?.attemptCount||0)+1;
        await write('outbox',{...entry,attemptCount:attempts,lastError:String(error?.message||error||'Delivery failed'),lastAttemptAt:new Date().toISOString(),nextRetryAt:new Date().toISOString(),status:'PENDING'});
        throw error;
      }
    }
  })();
  try{return await flushPromise;}finally{flushPromise=null;}
}
