import {requestPersistentStorage,queueOutbox,flushOutbox,bufferCrash} from './idb.js';

const CHANNEL='kfe-sync';
let channel=null;
let cleanupFns=[];

export async function initializeResilience({sendOutbox=async()=>{},sendCrashes=async()=>{}}={}){
  await requestPersistentStorage();
  if('BroadcastChannel' in globalThis){channel=new BroadcastChannel(CHANNEL);channel.onmessage=event=>globalThis.dispatchEvent(new CustomEvent('kfe:sync',{detail:event.data}));}
  const flush=async()=>{if(!navigator.onLine)return;await flushOutbox(sendOutbox);};
  const online=()=>{void flush();};
  const visible=()=>{if(document.visibilityState==='visible')void flush();};
  window.addEventListener('online',online);document.addEventListener('visibilitychange',visible);
  window.addEventListener('error',event=>{void bufferCrash(event.error||new Error(event.message),{source:event.filename||null,line:event.lineno||null,column:event.colno||null});});
  window.addEventListener('unhandledrejection',event=>{void bufferCrash(event.reason instanceof Error?event.reason:new Error(String(event.reason)),{type:'unhandledrejection'});});
  cleanupFns=[()=>window.removeEventListener('online',online),()=>document.removeEventListener('visibilitychange',visible)];
  void flush();
}

export async function enqueueNetworkMutation(payload){await queueOutbox(payload);if(navigator.onLine)void flushOutbox(async()=>{});}
export function broadcast(type,payload){channel?.postMessage({type,payload,at:Date.now()});}
export function closeResilience(){cleanupFns.forEach(fn=>fn());cleanupFns=[];channel?.close();channel=null;}

// Long-shift resource lifecycle: every watcher/timer/subscription must be registered here.
export function createResourceScope(){const cleanups=new Set();return{add(fn){cleanups.add(fn);return()=>cleanups.delete(fn);},clear(){for(const fn of cleanups){try{fn();}catch{}}cleanups.clear();}};}

export function startGeolocation(onPosition,options={}){if(!navigator.geolocation)return()=>{};const id=navigator.geolocation.watchPosition(onPosition,()=>{},options);return()=>navigator.geolocation.clearWatch(id);}
