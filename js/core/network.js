import {flushOutbox} from './idb.js';

export function createNetworkManager({sendOutbox=async()=>{},onStatus=()=>{}}={}){
  let retrying=false;
  const flush=async()=>{
    if(!navigator.onLine||retrying)return;
    retrying=true;
    try{await flushOutbox(sendOutbox);}finally{retrying=false;}
  };
  const online=()=>{onStatus(true);void flush();};
  const offline=()=>onStatus(false);
  window.addEventListener('online',online);
  window.addEventListener('offline',offline);
  onStatus(navigator.onLine);
  void flush();
  return {flush,online:()=>navigator.onLine,dispose(){window.removeEventListener('online',online);window.removeEventListener('offline',offline);}};
}
