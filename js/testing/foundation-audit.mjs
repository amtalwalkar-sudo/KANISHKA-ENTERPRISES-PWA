import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../../',import.meta.url);
const read=async path=>readFile(new URL(path,root),'utf8');
const app=await read('src/App.vue');
const contract=await read('js/application/ui-contract.js');
const dispatcher=await read('js/application/command-dispatcher.js');
const pkg=JSON.parse(await read('package.json'));
const html=await read('index.html');
const css=await read('src/styles/shell.css');
const specification=await read('spec/KFE-SPECIFICATION.md');
const governance=JSON.parse(await read('spec/kfe-2.0-governance.json'));
const telemetry=await read('js/services/operational-telemetry.js');

assert.match(html,/id=["'](?:app|vue-runtime)["']/,'PWA mount target missing');
assert.doesNotMatch(app,/indexedDB|IDBDatabase|createRepository|openDatabase/i,'UI must not access persistence');
assert.doesNotMatch(app,/from ["'][^"']*\/domain\//,'UI must not import domain modules');
assert.match(contract,/UI_CONTRACT_VERSION=1/,'UI contract must be versioned');
assert.match(dispatcher,/isUiCommand/,'application command boundary must validate UI commands');
assert.match(css,/safe-area-inset/i,'safe-area handling missing');
assert.match(css,/overscroll-behavior-y\s*:\s*contain/i,'viewport containment missing');
assert.match(css,/min-width\s*:\s*48px|min-height\s*:\s*48px/i,'touch-target foundation missing');
assert.match(css,/prefers-reduced-motion/i,'reduced-motion foundation missing');

assert.match(specification,/Break handling is not part of the current Work product contract/,'current Work scope must explicitly exclude Break');
assert.equal(governance.forbiddenInCurrentScope.includes('GPS integrations'),false,'GPS evidence must remain permitted as supplementary Work telemetry');
assert.match(governance.frozenRules.find(rule=>rule.includes('Every Work lifecycle transition'))||'',/GPS evidence is supplementary/,'GPS evidence rule missing');
assert.match(telemetry,/location_status:'PENDING'/,'operational events must begin with explicit pending location state');
assert.match(telemetry,/location_status:'UNAVAILABLE'/,'GPS failure must be recorded explicitly');
assert.match(telemetry,/place_name_status:'PENDING'/,'place resolution must begin explicitly pending');
assert.match(telemetry,/place_name_status:'UNAVAILABLE'/,'place resolution failure must be explicit');
assert.match(telemetry,/latitude:position\.coords\.latitude/,'captured GPS latitude must be retained');
assert.match(telemetry,/longitude:position\.coords\.longitude/,'captured GPS longitude must be retained');

const requiredScripts=['validate:phase-1','validate:phase-2','validate:phase-3','validate:foundation-audit'];
for(const script of requiredScripts) assert.equal(typeof pkg.scripts[script],'string',`${script} must remain registered`);

const validationSources=[
  ['ARCHITECTURE','js/12-step-verify.mjs'],
  ['PHASE_1','js/testing/phase-1-structural-pwa-shell.mjs'],
  ['PHASE_2','js/testing/phase-2-shell-interaction.mjs'],
  ['PHASE_3','js/testing/phase-3-ui-erp-contract.mjs'],
  ['ERP_FOUNDATION','js/foundation-hardening-verify.mjs']
];
for(const [name,path] of validationSources){
  const source=await read(path);
  assert.ok(source.length>0,`${name} validation source missing or empty`);
}

console.log('FOUNDATION_AUDIT=PASS');
