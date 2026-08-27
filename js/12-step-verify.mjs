import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html');
const app=read('js/app.js');
const idb=read('js/core/idb.js');
const repo=read('js/core/repository.js');
const pkg=read('package.json');
const main=read('src/main.js');
const vue=read('src/App.vue');

const legacyPaths=[
  'js/legacy-runtime.js',
  'js/ui-shell.js',
  'js/dashboard/aggregator.js',
  'js/domain/expenses.js',
  'js/domain/fuel.js',
  'js/domain/loan.js',
  'js/domain/maintenance.js',
  'js/domain/renewals.js',
  'js/domain/revenue.js',
  'js/domain/work.js',
  'tests/business-runtime.mjs',
  '.github/workflows/business-runtime-validation.yml',
  '.github/workflows/complete-ui-shell-migration.yml'
];

const checks=[
  ['1. Legacy business runtime is absent', legacyPaths.every(p=>!fs.existsSync(p))],
  ['2. Root HTML contains only neutral Vue bootstrap', !index.includes('firebase') && !index.includes('legacy-runtime') && !index.includes('startWork')],
  ['3. Vue + Vite composition root exists', pkg.includes('"vue"') && pkg.includes('"vite"') && fs.existsSync('src/App.vue') && fs.existsSync('src/main.js')],
  ['4. Vue bootstrap has no business calculations', !vue.includes('calculate') && !vue.includes('Work sessions') && !vue.includes('Revenue')],
  ['5. Application composition root is business-neutral', !app.includes('createWorkScreen') && !app.includes('createFuelScreen') && !app.includes('createDashboardAggregator')],
  ['6. Business calculation modules are not wired', !app.includes('/domain/') && !main.includes('/domain/')],
  ['7. Repository remains the persistence boundary', repo.includes('openKfeDb') && !app.includes('localStorage')],
  ['8. IndexedDB foundation remains versioned', idb.includes('DB_VERSION')],
  ['9. Outbox foundation remains present', idb.includes('outbox') && idb.includes('flushOutbox')],
  ['10. PWA foundation remains present', fs.existsSync('js/pwa')],
  ['11. Business runtime package script is absent', !pkg.includes('test:business-runtime')],
  ['12. Vue mount target is present', main.includes("app.mount('#vue-runtime')") && index.includes('id="vue-runtime"')]
];

let failed=0;
for(const [name,ok] of checks){ console.log(`${ok?'PASS':'FAIL'} ${name}`); if(!ok) failed++; }
if(failed) process.exitCode=1;
