import {bufferCrash,all,remove} from '../core/idb.js';

export async function bufferEvent(event){const error=new Error(event?.message||event?.type||'Unknown error');error.stack=event?.stack||null;return bufferCrash(error,{type:event?.type||'event',url:event?.url||null,context:event?.context||{}});}
export async function bufferException(error,context={}){return bufferCrash(error,context);}
export async function bufferNetworkFailure(url,context={}){return bufferEvent({type:'network-failure',url:String(url),context});}
export async function readBufferedEvents(){return all('logs');}
export async function clearBufferedEvents(){for(const item of await all('logs'))await remove('logs',item.id);}
export function installCrashBuffer(){if(globalThis.__KFE_CRASH_BUFFER_INSTALLED__)return;globalThis.__KFE_CRASH_BUFFER_INSTALLED__=true;globalThis.addEventListener?.('error',event=>void bufferException(event.error||new Error(event.message),{source:'window',filename:event.filename||null,line:event.lineno||null,column:event.colno||null}));globalThis.addEventListener?.('unhandledrejection',event=>void bufferException(event.reason instanceof Error?event.reason:new Error(String(event.reason)),{source:'promise'}));}
