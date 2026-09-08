import assert from 'node:assert/strict';
import {createSyncEngine} from '../infrastructure/sync-engine.js';

const memory=new Map();
const db={transaction(){const store={put(value){const request={onsuccess:null,onerror:null,result:value.id,error:null};queueMicrotask(()=>{memory.set(value.id,structuredClone(value));request.onsuccess?.();});return request;},delete(id){const request={onsuccess:null,onerror:null,result:undefined,error:null};queueMicrotask(()=>{memory.delete(id);request.onsuccess?.();});return request;},getAll(){const request={onsuccess:null,onerror:null,result:null,error:null};queueMicrotask(()=>{request.result=[...memory.values()].map(value=>structuredClone(value));request.onsuccess?.();});return request;}};return {objectStore:()=>store};}};
globalThis.indexedDB={open(){const request={result:db,onupgradeneeded:null,onsuccess:null,onerror:null,error:null};queueMicrotask(()=>request.onsuccess?.());return request;}};
globalThis.navigator={onLine:true};

const {queueOutbox}=await import('../core/outbox.js');
await queueOutbox({id:'t09-1',queuedAt:'2026-01-01T00:00:00.000Z',deliveryKey:'delivery-1',type:'FIRST'});
await queueOutbox({id:'t09-2',queuedAt:'2026-01-01T00:00:01.000Z',deliveryKey:'delivery-2',type:'SECOND'});

const delivered=[];
const reconciled=[];
let attempt=0;
const engine=createSyncEngine({
  send:async entry=>{delivered.push(entry.id);attempt+=1;if(entry.id==='t09-1'&&attempt===1)throw new Error('temporary failure');return {ok:true,serverId:`srv-${entry.id}`};},
  reconcile:async(entry,response)=>reconciled.push([entry.id,response.serverId]),
  baseDelayMs:0,
  maxDelayMs:0,
});

const first=await engine.flush();
assert.equal(first.status,'RETRY_SCHEDULED');
assert.deepEqual(delivered,['t09-1']);
assert.equal(memory.get('t09-1').attemptCount,1);
assert.ok(Date.parse(memory.get('t09-1').nextRetryAt)>=Date.now());
assert.ok(memory.has('t09-2'));

const second=await engine.flush();
assert.equal(second.status,'IDLE');
assert.deepEqual(delivered,['t09-1','t09-1','t09-2']);
assert.deepEqual(reconciled,[['t09-1','srv-t09-1'],['t09-2','srv-t09-2']]);
assert.equal(memory.size,0);

const locked=[];
globalThis.navigator.locks={request:async(_name,_options,callback)=>callback({})};
await queueOutbox({id:'t09-lock',queuedAt:'2026-01-01T00:00:02.000Z'});
const lockEngine=createSyncEngine({send:async entry=>{locked.push(entry.id);return {ok:true};},baseDelayMs:0,maxDelayMs:0});
await Promise.all([lockEngine.flush(),lockEngine.flush()]);
assert.deepEqual(locked,['t09-lock']);

console.log('T09 sync dispatch engine contract: PASS');
console.log('PASS deterministic ordering, exponential retry metadata, acknowledgement, reconciliation, and single-instance locking');
