import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html');
const app=read('js/app.js');
const idb=read('js/core/idb.js');
const repo=read('js/core/repository.js');
const confidence=read('js/core/data-confidence.js');
const effectiveDate=read('js/core/effective-date.js');
const transaction=read('js/core/transaction.js');
const pkg=read('package.json');
const main=read('src/main.js');
const vue=read('src/App.vue');

const legacyPaths=[
  'js/legacy-runtime.js','js/ui-shell.js','js/dashboard/aggregator.js',
  'js/domain/expenses.js','js/domain/fuel.js','js/domain/loan.js',
  'js/domain/maintenance.js','js/domain/renewals.js','js/domain/revenue.js',
  'js/domain/work.js','tests/business-runtime.mjs',
  '.github/workflows/business-runtime-validation.yml',
  '.github/workflows/complete-ui-shell-migration.yml'
];

const checks=[
  ['1. Legacy business runtime is absent', legacyPaths.every(p=>!fs.existsSync(p))],
  ['2. Root HTML contains only neutral Vue bootstrap', !index.includes('firebase')&&!index.includes('legacy-runtime')&&!index.includes('startWork')],
  ['3. Vue + Vite composition root exists', pkg.includes('"vue"')&&pkg.includes('"vite"')&&fs.existsSync('src/App.vue')&&fs.existsSync('src/main.js')],
  ['4. Vue bootstrap has no business calculations', !vue.includes('calculate')&&!vue.includes('Work sessions')&&!vue.includes('Revenue')],
  ['5. Application composition root is business-neutral', !app.includes('createWorkScreen')&&!app.includes('createFuelScreen')&&!app.includes('createDashboardAggregator')],
  ['6. Business calculation modules are not wired', !app.includes('/domain/')&&!main.includes('/domain/')],
  ['7. Repository remains the persistence boundary', repo.includes('openKfeDb')&&!app.includes('localStorage')],
  ['8. IndexedDB foundation is explicitly versioned', idb.includes('DB_VERSION')],
  ['9. Outbox foundation remains present', idb.includes('outbox')&&idb.includes('flushOutbox')],
  ['10. PWA foundation remains present', fs.existsSync('js/pwa')],
  ['11. Business runtime package script is absent', !pkg.includes('test:business-runtime')],
  ['12. Vue mount target is present', main.includes("app.mount('#vue-runtime')")&&index.includes('id="vue-runtime"')],
  ['13. Calculation outputs require dataConfidenceState', confidence.includes('dataConfidenceState')&&confidence.includes('createCalculationResult')],
  ['14. Calculation confidence states include UNKNOWN and INSUFFICIENT_DATA', confidence.includes("'UNKNOWN'")&&confidence.includes("'INSUFFICIENT_DATA'")],
  ['15. Effective-dated configuration requires effective_from', effectiveDate.includes('effective_from')&&effectiveDate.includes('createEffectiveConfiguration')],
  ['16. Effective-date validation is UTC/ISO based', effectiveDate.includes('toISOString')],
  ['17. Atomic IndexedDB transaction boundary exists', transaction.includes('runAtomicTransaction')&&transaction.includes("'readwrite'")],
  ['18. Transaction failures abort/rollback', transaction.includes('transaction?.abort')&&transaction.includes('onabort')],
  ['19. IndexedDB exposes atomic transaction helper', idb.includes('runAtomicTransaction')&&idb.includes('requestResult')]
];

let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
if(failed)process.exitCode=1;
