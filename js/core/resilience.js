import {requestPersistentStorage,bufferCrash} from './hardened-db.js';
import {queueOutbox,flushOutbox} from './outbox.js';

const CHANNEL='kfe-sync';
let channel=null;
let cleanupFns=[];
let sendOutboxFn=async()=>{};

function onError(event){void bufferCrash(event.error||new Error(event.message),{source:event.filename||null,line:event.lineno||null,column:event.colno||null});}
function onRejection(event){void bufferCrash(event.reason instanceof Error?event.reason:new Error(String(event.reason)),{type:'unhandledrejection'});}

export async function initializeResilience({sendOutbox=async()=>{}}={}){
  sendOutboxFn=sendOutbox;
  await requestPersistentStorage();
  if('BroadcastChannel' in globalThis){channel=new BroadcastChannel(CHANNEL);channel.onmessage=event=>globalThis.dispatchEvent(new CustomEvent('kfe:sync',{detail:event.data}));}
  window.addEventListener('error',onError);
  window.addEventListener('unhandledrejection',onRejection);
  cleanupFns=[()=>window.removeEventListener('error',onError),()=>window.removeEventListener('unhandledrejection',onRejection)];
  void flushOutbox(sendOutboxFn);
}

export async function enqueueNetworkMutation(payload){await queueOutbox(payload);if(navigator.onLine)void flushOutbox(sendOutboxFn);}
export function broadcast(type,payload){channel?.postMessage({type,payload,at:Date.now()});}
export function closeResilience(){cleanupFns.forEach(fn=>fn());cleanupFns=[];channel?.close();channel=null;}

export function createResourceScope(){const cleanups=new Set();return{add(fn){cleanups.add(fn);return()=>cleanups.delete(fn);},clear(){for(const fn of cleanups){try{fn();}catch{}}cleanups.clear();}};}

export function startGeolocation(onPosition,options={}){if(!navigator.geolocation)return()=>{};const id=navigator.geolocation.watchPosition(onPosition,()=>{},options);return()=>navigator.geolocation.clearWatch(id);}
