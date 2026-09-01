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
assert.equal(future.capabilities.gps, 'future');
assert.equal(future.capabilities.kfeAdvisor, 'future');

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

// Production dependency-direction guard. Existing foundation exceptions are explicit and narrow.
const productionRoots = [
  ['src', ['js/application/', 'js/domain/', 'js/core/idb', 'js/core/repository', 'js/core/store']],
  ['js/domain', ['src/', 'js/application/', 'js/services/', 'js/pwa/']],
  ['js/application', ['src/', 'js/core/idb']]
];
function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(rel));
    else if (/\.(js|mjs|vue)$/.test(entry.name)) out.push(rel);
  }
  return out;
}
for (const [dir, forbidden] of productionRoots) {
  if (!exists(dir)) continue;
  for (const file of walk(dir)) {
    const text = read(file);
    for (const token of forbidden) {
      if (text.includes(token)) {
        // Domain may use the shared data-confidence contract from core; it is not a persistence bypass.
        if (dir === 'js/domain' && token === 'js/core/' && !/from ['"]\.\.\/core\/data-confidence\.js['"]/.test(text)) continue;
        fail(`forbidden dependency token '${token}' in ${file}`);
      }
    }
  }
}

// Current UI contract tripwires. These intentionally catch the known Vehicle -> Driver drift.
const app = read('src/App.vue');
const vehicle = read('src/components/VehicleModuleView.vue');
for (const module of Object.keys(contracts.modules)) {
  if (!app.includes(module)) fail(`required UI module is not represented in src/App.vue: ${module}`);
}
if (!/DriverModuleView/.test(app)) fail('DriverModuleView is not wired into App.vue');
if (!/emit\('open', 'Driver'\)/.test(vehicle)) fail("VehicleModuleView must emit open/Driver according to the UI contract");
if (!/save-request/.test(read('src/components/HistoricalEntriesView.vue'))) fail('Historical Entries save-request contract missing');

// Frozen Tax Reserve exclusion applies to production runtime, not governance/tests/docs.
for (const file of [...walk('src'), ...walk('js/domain'), ...walk('js/application'), ...walk('js/core')]) {
  const text = read(file);
  if (/Tax Reserve|tax reserve/i.test(text)) fail(`forbidden Tax Reserve concept found in production runtime: ${file}`);
}

// PWA integrity: every service-worker app-shell URL must resolve to a tracked repository path.
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

// Financial golden vector: execute the current authoritative implementation against an approved case.
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
console.log('Specification authority, architecture contract, UI wiring contract, Tax Reserve exclusion, PWA integrity, service-worker registration, future-scope markers, and financial golden vector verified.');
