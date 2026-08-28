import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../../',import.meta.url);
const read=async path=>readFile(new URL(path,root),'utf8');
const app=await read('src/App.vue');
const contract=await read('js/application/ui-contract.js');
const dispatcher=await read('js/application/command-dispatcher.js');
const pkg=JSON.parse(await read('package.json'));
const html=await read('index.html');
const css=await read('src/styles/structural-shell.css');

assert.match(html,/id=["']app["']/,'PWA mount target missing');
assert.doesNotMatch(app,/indexedDB|IDBDatabase|createRepository|openDatabase/i,'UI must not access persistence');
assert.doesNotMatch(app,/from ["'][^"']*\/domain\//,'UI must not import domain modules');
assert.match(contract,/UI_CONTRACT_VERSION=1/,'UI contract must be versioned');
assert.match(dispatcher,/isUiCommand/,'application command boundary must validate UI commands');
assert.match(css,/safe-area-inset/i,'safe-area handling missing');
assert.match(css,/overscroll-behavior-y\s*:\s*contain/i,'viewport containment missing');
assert.match(css,/min-width\s*:\s*48px|min-height\s*:\s*48px/i,'touch-target foundation missing');
assert.match(css,/prefers-reduced-motion/i,'reduced-motion foundation missing');

const requiredScripts=['validate:phase-1','validate:phase-2','validate:phase-3','validate:phase-4','validate:foundation-audit'];
for(const script of requiredScripts) assert.equal(typeof pkg.scripts[script],'string',`${script} must remain registered`);

const validationSources=[
  ['ARCHITECTURE','js/12-step-verify.mjs'],
  ['PHASE_1','js/testing/phase-1-structural-pwa-shell.mjs'],
  ['PHASE_2','js/testing/phase-2-shell-interaction.mjs'],
  ['PHASE_3','js/testing/phase-3-ui-erp-contract.mjs'],
  ['PHASE_4','js/testing/phase-4-work-session-vertical-slice.mjs'],
  ['ERP_FOUNDATION','js/foundation-hardening-verify.mjs']
];
for(const [name,path] of validationSources){
  const source=await read(path);
  assert.ok(source.length>0,`${name} validation source missing or empty`);
}

console.log('FOUNDATION_AUDIT=PASS');
