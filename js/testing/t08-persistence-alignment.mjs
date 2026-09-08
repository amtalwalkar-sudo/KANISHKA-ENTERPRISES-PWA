import assert from 'node:assert/strict';
import {queueOutbox,flushOutbox} from '../core/outbox.js';

const memory = new Map();
const db = {
  transaction() {
    const store = {
      put(value) {
        const request = {onsuccess:null,onerror:null,result:value.id,error:null};
        queueMicrotask(() => { memory.set(value.id,structuredClone(value));request.onsuccess?.(); });
        return request;
      },
      delete(id) {
        const request = {onsuccess:null,onerror:null,result:undefined,error:null};
        queueMicrotask(() => { memory.delete(id);request.onsuccess?.(); });
        return request;
      },
      getAll() {
        const request = {onsuccess:null,onerror:null,result:null,error:null};
        queueMicrotask(() => { request.result=[...memory.values()].map(value=>structuredClone(value));request.onsuccess?.(); });
        return request;
      }
    };
    return {objectStore:()=>store};
  }
};
globalThis.indexedDB={open(){const request={result:db,onupgradeneeded:null,onsuccess:null,onerror:null,error:null};queueMicrotask(()=>request.onsuccess?.());return request;}};

const first=await queueOutbox({id:'t08-1',type:'FIRST'});
const second=await queueOutbox({id:'t08-2',type:'SECOND'});
assert.equal(first.attemptCount,0);
assert.equal(second.attemptCount,0);
assert.equal(first.deliveryKey,'t08-1');

const delivered=[];
await assert.rejects(flushOutbox(async entry=>{
  delivered.push(entry.id);
  if(entry.id==='t08-1')throw new Error('offline transport');
}),/offline transport/);
assert.deepEqual(delivered,['t08-1']);
assert.ok(memory.has('t08-1'));
assert.ok(memory.has('t08-2'));
assert.equal(memory.get('t08-1').attemptCount,1);
assert.equal(memory.get('t08-1').status,'PENDING');
assert.equal(memory.get('t08-1').lastError,'offline transport');

const retryDelivered=[];
await flushOutbox(async entry=>retryDelivered.push(entry.id));
assert.deepEqual(retryDelivered,['t08-1','t08-2']);
assert.equal(memory.size,0);

await queueOutbox({id:'t08-concurrent',type:'CONCURRENT'});
let concurrentCalls=0;
const send=async()=>{concurrentCalls+=1;await new Promise(resolve=>setTimeout(resolve,0));};
await Promise.all([flushOutbox(send),flushOutbox(send)]);
assert.equal(concurrentCalls,1);
assert.equal(memory.size,0);

console.log('T08 persistence alignment contract: PASS');
console.log('PASS durable outbox metadata, ordered failure retention, retry, and concurrent-flush serialization');
