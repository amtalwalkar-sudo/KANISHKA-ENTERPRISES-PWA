import {all,remove,write} from '../core/hardened-db.js';

const LOCK_NAME='kfe-outbox-sync';
const DEFAULT_BASE_DELAY_MS=1000;
const DEFAULT_MAX_DELAY_MS=300000;

function isOnline(){return globalThis.navigator?.onLine!==false;}
function isAck(response){
  if(response===true)return true;
  if(response&&typeof response==='object'){
    if(response.ok===true)return true;
    if(Number.isInteger(response.status)&&response.status>=200&&response.status<300)return true;
  }
  return false;
}
function due(entry,now=Date.now()){
  const next=Date.parse(String(entry?.nextRetryAt||''));
  return !Number.isFinite(next)||next<=now;
}
function orderedPending(entries,now=Date.now()){
  return entries.filter(entry=>String(entry?.status||'PENDING')==='PENDING'&&due(entry,now)).sort((a,b)=>{
    const aTime=Date.parse(String(a?.queuedAt||''));
    const bTime=Date.parse(String(b?.queuedAt||''));
    const byTime=(Number.isFinite(aTime)?aTime:0)-(Number.isFinite(bTime)?bTime:0);
    return byTime||String(a?.id||'').localeCompare(String(b?.id||''));
  });
}
function retryAt(attemptCount,baseDelayMs,maxDelayMs){
  const exponent=Math.max(0,Math.min(30,attemptCount-1));
  const delay=Math.min(maxDelayMs,baseDelayMs*(2**exponent));
  return new Date(Date.now()+delay).toISOString();
}

export function createSyncEngine({send=null,reconcile=async()=>{},baseDelayMs=DEFAULT_BASE_DELAY_MS,maxDelayMs=DEFAULT_MAX_DELAY_MS,lockName=LOCK_NAME}={}){
  if(send!==null&&typeof send!=='function')throw new TypeError('send must be a function or null');
  if(typeof reconcile!=='function')throw new TypeError('reconcile must be a function');
  if(!Number.isFinite(baseDelayMs)||baseDelayMs<0)throw new RangeError('baseDelayMs must be non-negative');
  if(!Number.isFinite(maxDelayMs)||maxDelayMs<baseDelayMs)throw new RangeError('maxDelayMs must be at least baseDelayMs');

  let transport=send;
  let running=false;
  let flushPromise=null;
  let disposed=false;
  const onlineHandler=()=>{void flush();};

  async function dispatchUnlocked(){
    if(disposed||!isOnline())return {status:'OFFLINE',processed:0};
    if(typeof transport!=='function')return {status:'NO_TRANSPORT',processed:0};
    const entries=orderedPending(await all('outbox'));
    let processed=0;
    for(const entry of entries){
      if(disposed||!isOnline())return {status:'OFFLINE',processed};
      try{
        const response=await transport(structuredClone(entry));
        if(!isAck(response))throw new Error('Sync transport did not acknowledge the outbox entry');
        await reconcile(structuredClone(entry),response);
        await remove('outbox',entry.id);
        processed+=1;
      }catch(error){
        const attemptCount=Number(entry?.attemptCount||0)+1;
        await write('outbox',{
          ...entry,
          attemptCount,
          lastError:String(error?.message||error||'Sync delivery failed'),
          lastAttemptAt:new Date().toISOString(),
          nextRetryAt:retryAt(attemptCount,baseDelayMs,maxDelayMs),
          status:'PENDING'
        });
        return {status:'RETRY_SCHEDULED',processed,failedId:entry.id,attemptCount};
      }
    }
    return {status:'IDLE',processed};
  }

  async function flush(){
    if(disposed||running||!isOnline())return {status:disposed?'DISPOSED':'BUSY_OR_OFFLINE',processed:0};
    if(flushPromise)return flushPromise;
    const execute=async()=>{
      running=true;
      try{
        const locks=globalThis.navigator?.locks;
        if(locks?.request){
          return await locks.request(lockName,{ifAvailable:true},async lock=>lock?dispatchUnlocked():{status:'LOCK_BUSY',processed:0});
        }
        return await dispatchUnlocked();
      }finally{running=false;}
    };
    flushPromise=execute();
    try{return await flushPromise;}finally{flushPromise=null;}
  }

  function setTransport(nextTransport){
    if(nextTransport!==null&&typeof nextTransport!=='function')throw new TypeError('transport must be a function or null');
    transport=nextTransport;
    if(typeof transport==='function'&&isOnline())void flush();
  }

  function start(){
    if(disposed)return;
    window.addEventListener('online',onlineHandler);
    void flush();
  }
  function stop(){
    if(disposed)return;
    disposed=true;
    window.removeEventListener('online',onlineHandler);
  }

  return Object.freeze({flush,setTransport,start,stop,online:isOnline});
}
