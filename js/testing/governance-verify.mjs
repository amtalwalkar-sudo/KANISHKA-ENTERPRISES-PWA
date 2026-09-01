import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const fail = (message) => { throw new Error(`KFE GOVERNANCE GATE: ${message}`); };

const spec = JSON.parse(read('spec/kfe-2.0-governance.json'));
const architecture = JSON.parse(read('spec/architecture/layers.json'));
const contracts = JSON.parse(read('spec/contracts/ui.json'));
const calculations = JSON.parse(read('spec/calculations/index.json'));
const future = JSON.parse(read('spec/future/capabilities.json'));
const golden = JSON.parse(read('spec/golden/financial-vectors.json'));

assert.equal(spec.status, 'authoritative');
assert.match(spec.traceability, /SPECIFICATION.*CONTRACT.*TEST.*IMPLEMENTATION/);
assert.ok(spec.frozenRules.length >= 10, 'Frozen KFE rule set is unexpectedly incomplete');
assert.equal(spec.currentScope, 'Single vehicle ERP');
assert.ok(spec.forbiddenInCurrentScope.includes('GPS'));
assert.ok(spec.forbiddenInCurrentScope.includes('multiple vehicles'));
assert.ok(spec.forbiddenInCurrentScope.includes('multiple drivers'));
assert.equal(future.capabilities.gps, 'future');
assert.equal(future.capabilities.kfeAdvisor, 'future');

assert.equal(spec.stateGovernance.invariants.find(i => i.id === 'KFE-GOV-STATE-001')?.id, 'KFE-GOV-STATE-001');
assert.equal(spec.stateGovernance.invariants.find(i => i.id === 'KFE-GOV-STATE-002')?.id, 'KFE-GOV-STATE-002');
assert.match(spec.stateGovernance.staleLoopPrevention, /Never iterate on a stale failure/i);

if (process.env.GITHUB_ACTIONS === 'true') {
  const expectedSha = process.env.KFE_VALIDATED_SHA;
  const observedSha = process.env.KFE_OBSERVED_CODE_SHA;
  const ciRunSha = process.env.KFE_CI_RUN_SHA;
  if (!expectedSha || !observedSha || !ciRunSha) fail('STATE_MISMATCH: required CI state SHAs are missing');
  if (expectedSha !== observedSha || expectedSha !== ciRunSha) {
    fail(`STATE_MISMATCH: expected=${expectedSha} observed=${observedSha} ci=${ciRunSha}`);
  }
}

for (const [name, dirs] of Object.entries(architecture.layers)) {
  for (const dir of dirs) if (name !== 'futureIntegrations' && !exists(dir)) fail(`architecture path missing: ${dir}`);
}
for (const file of [
  'spec/KFE-SPECIFICATION.md',
  'spec/kfe-2.0-governance.json',
  'spec/architecture/layers.json',
  'spec/contracts/ui.json',
  'spec/calculations/index.json',
  'spec/future/capabilities.json',
  'spec/golden/financial-vectors.json',
  'docs/AI-ENGINEERING-CONTRACT.md'
]) if (!exists(file)) fail(`required governance file missing: ${file}`);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(rel));
    else if (/\.(js|mjs|vue)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

for (const file of walk('src')) {
  const text = read(file);
  for (const token of ['js/core/idb', 'js/core/repository', 'js/core/store']) {
    if (text.includes(token)) fail(`presentation persistence bypass '${token}' in ${file}`);
  }
}
for (const file of walk('js/domain')) {
  const text = read(file);
  for (const token of ['src/', 'js/application/', 'js/services/', 'js/pwa/']) {
    if (text.includes(token)) fail(`forbidden domain dependency token '${token}' in ${file}`);
  }
}
for (const file of walk('js/application')) {
  const text = read(file);
  for (const token of ['src/', 'js/core/idb']) {
    if (text.includes(token)) fail(`forbidden application dependency token '${token}' in ${file}`);
  }
}

const app = read('src/App.vue');
const requiredModules = Object.entries(contracts.currentScope)
  .filter(([, contract]) => contract?.required === true)
  .map(([module]) => module);
for (const module of requiredModules) {
  if (!app.includes(module)) fail(`required current-scope UI module is not represented in src/App.vue: ${module}`);
}
if (contracts.currentScope.Driver?.required === true) {
  if (!/DriverModuleView/.test(app)) fail('DriverModuleView is required by the UI contract but is not wired into App.vue');
  const vehicle = read('src/components/VehicleModuleView.vue');
  if (!/emit\('open', 'Driver'\)/.test(vehicle)) fail("VehicleModuleView must emit open/Driver according to the UI contract");
}
if (!/save-request/.test(read('src/components/HistoricalEntriesView.vue'))) fail('Historical Entries save-request contract missing');

for (const file of [...walk('src'), ...walk('js/domain'), ...walk('js/application'), ...walk('js/core')]) {
  const text = read(file);
  if (/Tax Reserve|tax reserve/i.test(text)) fail(`forbidden Tax Reserve concept found in production runtime: ${file}`);
}

const sw = read('service-worker.js');
const shellMatch = sw.match(/const APP_SHELL=\[(.*?)\];/s);
if (!shellMatch) fail('service-worker APP_SHELL declaration missing');
const paths = [...shellMatch[1].matchAll(/['"]([^'"]+)['"]/g)].map(m => m[1]).filter(p => p.startsWith('./'));
for (const asset of paths) {
  const normalized = asset.replace(/^\.\//, '');
  if (normalized !== '' && !exists(normalized)) fail(`service-worker APP_SHELL references missing asset: ${asset}`);
}
const main = read('src/main.js');
if (!/navigator\.serviceWorker\.register/.test(main)) fail('service-worker registration is not present in src/main.js');
if (!/event\.request\.mode==='navigate'/.test(sw)) fail('SPA navigation fallback guard is missing from service-worker.js');

const { profitability } = await import(path.join(root, 'js/domain/dashboard.js'));
const vector = golden.vectors.find(v => v.id === 'PROFITABILITY-001');
if (!vector) fail('required profitability golden vector is missing');
const result = profitability(vector.input);
assert.deepEqual(result.value, vector.expected, 'Profitability golden vector mismatch');
assert.equal(calculations.calculations.profitability.version, 1);
assert.equal(calculations.calculations.currency.version, 1);
assert.equal(calculations.calculations.loan.version, 1);
assert.equal(golden.expansionPolicy.includes('approved specification'), true);

console.log('KFE 2.0 Governance Gate: PASS');
console.log('Specification authority, state synchronization, current-scope UI contracts, architecture contract, Tax Reserve exclusion, PWA integrity, service-worker registration, future-scope markers, and financial golden vector verified.');
