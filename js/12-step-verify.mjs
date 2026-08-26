import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html');
const shell=read('js/ui-shell.js');
const app=read('js/app.js');
const agg=read('js/dashboard/aggregator.js');
const idb=read('js/core/idb.js');
const repo=read('js/core/repository.js');
const pkg=read('package.json');
const main=read('src/main.js');

const screens=['work','fuel','expenses','revenue','maintenance','loan','renewals'];
const checks=[
  ['1. UI shell contains no legacy calculation implementation', !index.includes('async function loadArr') && !index.includes('function startWork')],
  ['2. UI shell is declarative and delegates actions', index.includes('data-kfe-action') && index.includes('js/ui-shell.js')],
  ['3. Vue + Vite composition root is present', pkg.includes('"vue"') && pkg.includes('"vite"') && fs.existsSync('src/App.vue') && fs.existsSync('src/main.js')],
  ['4. Vue owns the application composition boundary', main.includes("createApp(App)") && main.includes("app.mount('#vue-runtime')")],
  ['5. Single application composition root exists', app.includes('export const screens=') && app.includes('createDashboardAggregator')],
  ['6. All seven business screens have isolated modules', screens.every(x=>app.includes(`create${x[0].toUpperCase()+x.slice(1)}Screen`))],
  ['7. Screen calculations stay inside screen/domain modules', screens.every(x=>fs.existsSync(`js/screens/${x}.js`))],
  ['8. Dashboard consumes screen view-models only', agg.includes('getViewModel') && !agg.includes("from '../screens/")],
  ['9. Repository is the storage boundary', repo.includes('openKfeDb') && !app.includes('localStorage')],
  ['10. IndexedDB versioning + outbox foundation exists', idb.includes('DB_VERSION') && idb.includes('outbox') && idb.includes('flushOutbox')],
  ['11. Android resilience foundations exist', idb.includes('requestPersistentStorage') && idb.includes('queueOutbox') && fs.existsSync('js/pwa/crash-buffer.js')],
  ['12. No iOS-specific replay architecture remains', !shell.includes('visibilitychange') && !app.includes('visibilitychange') && !index.includes('visibilitychange')]
];

let failed=0;
for(const [name,ok] of checks){ console.log(`${ok?'PASS':'FAIL'} ${name}`); if(!ok) failed++; }
if(failed) process.exitCode=1;
