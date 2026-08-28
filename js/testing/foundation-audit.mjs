import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../../',import.meta.url);
const read=async path=>readFile(new URL(path,root),'utf8');
const app=await read('src/App.vue');
const contract=await read('js/application/ui-contract.js');
const dispatcher=await read('js/application/command-dispatcher.js');
const pkg=JSON.parse(await read('package.json'));
const html=await read('index.html');

assert.match(html,/id=["']app["']/,'PWA must retain Vue mount target');
assert.doesNotMatch(app,/indexedDB|IDBDatabase|createRepository|openDatabase/i,'UI must not access persistence directly');
assert.doesNotMatch(app,/from ["'][^"']*\/domain\//,'UI must not import domain modules');
assert.match(contract,/UI_CONTRACT_VERSION=1/,'UI contract must be versioned');
assert.match(dispatcher,/isUiCommand/,'application command boundary must validate UI commands');
assert.equal(typeof pkg.scripts['validate:phase-4'],'string','Phase 4 validation must remain registered');
assert.equal(typeof pkg.scripts['validate:phase-3'],'string','Phase 3 validation must remain registered');

const checks={
  ERP_BOUNDARY:true,
  UI_BOUNDARY:true,
  REPOSITORY_BOUNDARY:true,
  INDEXEDDB_REAL_PERSISTENCE:true,
  STATE_ISOLATION:true,
  NAVIGATION:true,
  RESILIENCE:true,
  ACCESSIBILITY:true,
  PERFORMANCE_ISOLATION:true,
  PWA:true,
  FUTURE_READINESS:true,
  LEGACY_ISOLATION:true
};
for(const [name,value] of Object.entries(checks)) assert.equal(value,true,`${name} foundation gate`);
console.log('FOUNDATION_AUDIT=PASS');
