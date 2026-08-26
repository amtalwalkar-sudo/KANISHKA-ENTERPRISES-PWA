import assert from 'node:assert/strict';
import {createRepository} from '../core/repository.js';
import {createStore} from '../core/store.js';

const backing=new Map();
const storage={getItem:k=>backing.has(k)?backing.get(k):null,setItem:(k,v)=>backing.set(k,v),removeItem:k=>backing.delete(k)};
const repository=createRepository({storage,initial:{work:{onDuty:false},fuel:{items:[]}}});
const store=createStore({work:{onDuty:false},fuel:{items:[]}},repository);

assert.equal(store.get('work').onDuty,false);
store.update('work',s=>({...s,onDuty:true}));
assert.equal(store.get('work').onDuty,true,'local state must update immediately');
const restored=createRepository({storage,initial:{}}).load();
assert.equal(restored.work.onDuty,true,'state must persist through repository only');

const uiShell=await (await import('node:fs/promises')).readFile(new URL('../ui-shell.js',import.meta.url),'utf8');
assert(!/from ['"].*(domain|screens|dashboard)\//.test(uiShell),'UI shell must not import business modules');

console.log('Architecture boundary tests passed: repository, local-first state, UI-shell decoupling.');
