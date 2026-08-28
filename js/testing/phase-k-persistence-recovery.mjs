import assert from 'node:assert/strict';
import {runAtomicTransaction} from '../core/transaction.js';
import {createSnapshot,restoreSnapshot,validateSnapshot,KFE_BACKUP_VERSION} from '../core/backup.js';
import {queueOutbox,flushOutbox} from '../core/outbox.js';
import {DB_NAME,DB_VERSION,STORE_NAMES,STORES,read,write,all,remove,bufferCrash} from '../core/hardened-db.js';

class FakeRequest { constructor(){this.result=undefined;this.error=null;this.onsuccess=null;this.onerror=null;} }
class FakeObjectStore {
  constructor(name,map,tx){this.name=name;this.map=map;this.tx=tx;}
  put(value){const r=new FakeRequest();this.tx.track();queueMicrotask(()=>{try{if(this.tx.aborted)throw this.tx.error||new Error('transaction aborted');const key=value?.id;if(key==null)throw new Error('id required');this.map.set(key,structuredClone(value));r.result=key;r.onsuccess?.();this.tx.pendingDone();}catch(e){r.error=e;this.tx.abort(e);r.onerror?.();}});return r;}
  get(key){const r=new FakeRequest();this.tx.track();queueMicrotask(()=>{if(this.tx.aborted){r.error=this.tx.error;r.onerror?.();return;}r.result=this.map.has(key)?structuredClone(this.map.get(key)):undefined;r.onsuccess?.();this.tx.pendingDone();});return r;}
  getAll(){const r=new FakeRequest();this.tx.track();queueMicrotask(()=>{if(this.tx.aborted){r.error=this.tx.error;r.onerror?.();return;}r.result=[...this.map.values()].map(v=>structuredClone(v));r.onsuccess?.();this.tx.pendingDone();});return r;}
  delete(key){const r=new FakeRequest();this.tx.track();queueMicrotask(()=>{if(this.tx.aborted){r.error=this.tx.error;r.onerror?.();return;}this.map.delete(key);r.result=undefined;r.onsuccess?.();this.tx.pendingDone();});return r;}
  clear(){const r=new FakeRequest();this.tx.track();queueMicrotask(()=>{if(this.tx.aborted){r.error=this.tx.error;r.onerror?.();return;}this.map.clear();r.result=undefined;r.onsuccess?.();this.tx.pendingDone();});return r;}
}
class FakeTransaction {
  constructor(db,names){this.db=db;this.names=Array.isArray(names)?names:[names];this.error=null;this.oncomplete=null;this.onerror=null;this.onabort=null;this.aborted=false;this.pending=0;this.finished=false;this.snapshots=new Map(this.names.map(name=>[name,new Map([...db.stores.get(name).entries()].map(([k,v])=>[k,structuredClone(v)]))]));}
  objectStore(name){if(!this.names.includes(name))throw new Error(`Store not in transaction: ${name}`);if(!this.db.stores.has(name))throw new Error(`Unknown store: ${name}`);return new FakeObjectStore(name,this.db.stores.get(name),this);}
  track(){this.pending++;}
  pendingDone(){if(this.pending>0)this.pending--;this.finishIfReady();}
  finishIfReady(){if(this.aborted||this.finished||this.pending!==0)return;this.finished=true;queueMicrotask(()=>this.oncomplete?.());}
  abort(error=new Error('aborted')){if(this.aborted||this.finished)return;this.aborted=true;this.error=error;for(const [name,snapshot] of this.snapshots){const map=this.db.stores.get(name);map.clear();for(const [key,value] of snapshot)map.set(key,structuredClone(value));}queueMicrotask(()=>this.onabort?.());}
}
class FakeDb {
  constructor(){this.stores=new Map(STORE_NAMES.map(n=>[n,new Map()]));this.objectStoreNames={contains:n=>this.stores.has(n)};}
  transaction(names){return new FakeTransaction(this,names);}
  close(){}
}
const fakeDb=new FakeDb();
globalThis.indexedDB={open(){const r=new FakeRequest();queueMicrotask(()=>{r.result=fakeDb;r.onupgradeneeded?.();r.onsuccess?.();});return r;}};

assert.equal(DB_NAME,'kfe');
assert.equal(DB_VERSION,4);
assert.equal(STORE_NAMES.length,Object.keys(STORES).length);
assert.ok(STORE_NAMES.includes('vehicles'));
assert.ok(STORE_NAMES.includes('work_sessions'));
assert.ok(STORE_NAMES.includes('maintenance_records'));
assert.ok(STORE_NAMES.includes('loans'));
assert.ok(STORE_NAMES.includes('calculation_results'));

const vehicle={id:'vehicle-1',registration:'KFE-TEST'};
await write('vehicles',vehicle);
assert.deepEqual(await read('vehicles','vehicle-1'),vehicle);

await runAtomicTransaction(fakeDb,['vehicles','work_sessions'],(stores)=>{
  stores.vehicles.put({id:'vehicle-2',registration:'ATOMIC'});
  stores.work_sessions.put({id:'shift-1',vehicleId:'vehicle-2'});
  return true;
});
assert.equal((await all('vehicles')).length,2);
assert.equal((await all('work_sessions')).length,1);

const beforeVehicles=await all('vehicles');
await assert.rejects(
  runAtomicTransaction(fakeDb,['vehicles','work_sessions'],(stores)=>{
    stores.vehicles.put({id:'rollback-vehicle'});
    throw new Error('intentional rollback');
  }),
  /intentional rollback/
);
assert.deepEqual(await all('vehicles'),beforeVehicles);

const snapshot=createSnapshot({
  stores:{vehicles:[{id:'restore-vehicle',registration:'RESTORED'}],work_sessions:[{id:'restore-shift',vehicleId:'restore-vehicle'}]},
  configuration:[{id:'cfg-1',effective_from:'2026-08-28T00:00:00.000Z'}],
  relationships:[{from:'restore-shift',to:'restore-vehicle'}],
  calculationVersions:[{calculation:'profitability',version:1}]
});
assert.equal(snapshot.schemaVersion,KFE_BACKUP_VERSION);
assert.equal(validateSnapshot(snapshot),true);
await restoreSnapshot(fakeDb,snapshot);
assert.deepEqual(await all('vehicles'),snapshot.stores.vehicles);
assert.deepEqual(await all('work_sessions'),snapshot.stores.work_sessions);

const original=[...snapshot.stores.vehicles];
await assert.rejects(restoreSnapshot(fakeDb,{...snapshot,stores:{...snapshot.stores,vehicles:[{id:'bad'}]}},async()=>{throw new Error('record validation failure');}),/record validation failure/);
assert.deepEqual(await all('vehicles'),original);

await queueOutbox({id:'outbox-1',type:'TEST',payload:{ok:true}});
assert.equal((await all('outbox')).length,1);
await assert.rejects(flushOutbox(async()=>{throw new Error('delivery failed');}),/delivery failed/);
assert.equal((await all('outbox')).length,1);
let delivered=[];
await flushOutbox(async(entry)=>{delivered.push(entry.id);});
assert.deepEqual(delivered,['outbox-1']);
assert.equal((await all('outbox')).length,0);

const crashError=new Error('crash-test');
await bufferCrash(crashError,{phase:'K'});
const logs=await all('logs');
assert.equal(logs.length,1);
assert.equal(logs[0].message,'crash-test');
assert.equal(logs[0].context.phase,'K');

await remove('vehicles','restore-vehicle');
assert.equal(await read('vehicles','restore-vehicle'),undefined);

console.log('KFE Phase K persistence/recovery: PASS');
