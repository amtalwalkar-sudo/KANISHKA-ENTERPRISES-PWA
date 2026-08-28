import assert from 'node:assert/strict';
import {createEntityRepository} from '../core/repository.js';

class Request {
  constructor(){this.result=undefined;this.error=null;this.onsuccess=null;this.onerror=null;}
  succeed(value){this.result=value;queueMicrotask(()=>this.onsuccess?.());return this;}
  fail(error){this.error=error;queueMicrotask(()=>this.onerror?.());return this;}
}
class Store {
  constructor(map){this.map=map;}
  get(key){const r=new Request();return r.succeed(this.map.get(key));}
  getAll(){const r=new Request();return r.succeed([...this.map.values()].map(v=>structuredClone(v)));}
  put(value){this.map.set(value.id,structuredClone(value));const r=new Request();return r.succeed(value.id);}
  delete(key){this.map.delete(key);const r=new Request();return r.succeed(undefined);}
}
class Tx {
  constructor(db,names){this.db=db;this.names=Array.isArray(names)?names:[names];this.oncomplete=null;this.onerror=null;this.onabort=null;this.aborted=false;}
  objectStore(name){if(!this.names.includes(name))throw new Error('Store not in transaction');return new Store(this.db.stores.get(name));}
  abort(){this.aborted=true;this.onabort?.();}
}
class Db {
  constructor(){this.stores=new Map([['vehicles',new Map()],['idempotency',new Map()]]);}
  transaction(names){return new Tx(this,names);}
  close(){}
}
const fakeDb=new Db();
globalThis.indexedDB={open(){const r=new Request();r.result=fakeDb;queueMicrotask(()=>r.onsuccess?.());return r;}};

const repo=createEntityRepository('vehicles');
const created=await repo.create({registration:'KFE-TEST'},{user_id:null});
assert.match(created.id,/^[0-9a-f-]{36}$/i);
assert.equal(created.is_deleted,false);
assert.equal(created.synced,false);
assert.equal((await repo.get(created.id)).registration,'KFE-TEST');

const updated=await repo.update(created,{registration:'KFE-UPDATED'});
assert.equal(updated.id,created.id);
assert.equal(updated.registration,'KFE-UPDATED');
assert.equal(updated.created_at,created.created_at);
assert.notEqual(updated.updated_at,created.updated_at);
assert.equal(updated.synced,false);

const listed=await repo.list();
assert.equal(listed.length,1);
assert.equal(listed[0].registration,'KFE-UPDATED');

const deleted=await repo.softDelete(updated);
assert.equal(deleted.id,created.id);
assert.equal(deleted.is_deleted,true);
assert.equal(deleted.created_at,created.created_at);
assert.equal(deleted.synced,false);
assert.equal((await repo.get(created.id)).is_deleted,true);

// Repository mutations are asynchronous, so invalid-input failures are
// rejected promises rather than synchronous throws.
await assert.rejects(repo.update({...created,id:'not-a-uuid'},{registration:'invalid'}),/id must be a UUID/);
await assert.rejects(repo.update({...created,updated_at:'2026-01-01'},{registration:'invalid'}),/updated_at must be an ISO\/UTC timestamp/);

console.log('KFE Phase L operational integrity: PASS');
