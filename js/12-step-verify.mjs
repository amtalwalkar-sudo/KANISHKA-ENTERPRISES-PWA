import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const index=read('index.html');
const app=read('js/app.js');
const db=read('js/core/hardened-db.js');
const repo=read('js/core/repository.js');
const confidence=read('js/core/data-confidence.js');
const effectiveDate=read('js/core/effective-date.js');
const transaction=read('js/core/transaction.js');
const pkg=read('package.json');
const main=read('src/main.js');
const vue=read('src/App.vue');

const legacyPaths=['js/legacy-runtime.js','js/dashboard/aggregator.js','tests/business-runtime.mjs','.github/workflows/business-runtime-validation.yml','.github/workflows/complete-ui-shell-migration.yml'];
const vueHasBusinessCalculation=/\b(?:calculate(?:Work|Fuel|Revenue|Profit|Maintenance)|amortize|projectedFuelCostForKm|businessExpenses|fixedExpensePerBusinessKm|provisionMaintenance|profitability|tomorrowTarget)\s*\(/.test(vue);
const vueHasArithmetic=/\b(?:amount_paise|revenuePaise|expensesPaise|fuelPaise|businessKm|fuelCostPerKm|profit)\s*[+\-*\/%]=?/.test(vue);
const checks=[
['1. Legacy business runtime is absent',legacyPaths.every(p=>!fs.existsSync(p))],
['2. Root HTML contains only neutral Vue bootstrap',!index.includes('firebase')&&!index.includes('legacy-runtime')&&!index.includes('startWork')],
['3. Vue + Vite composition root exists',pkg.includes('"vue"')&&pkg.includes('"vite"')&&fs.existsSync('src/App.vue')&&fs.existsSync('src/main.js')],
['4. Vue bootstrap has no business calculations',!vueHasBusinessCalculation&&!vueHasArithmetic],
['5. Application composition root is business-neutral',!app.includes('createWorkScreen')&&!app.includes('createFuelScreen')&&!app.includes('createDashboardAggregator')],
['6. Application composition does not directly import domain modules',!app.includes('/domain/')&&!main.includes('/domain/')],
['7. Repository remains the persistence boundary',repo.includes('openKfeDb')&&!app.includes('localStorage')],
['8. Canonical IndexedDB foundation is explicitly versioned',db.includes('DB_VERSION')&&/DB_VERSION\s*=\s*\d+\s*;/.test(db)],
['9. Outbox foundation remains present',db.includes('outbox')],
['10. PWA foundation remains present',fs.existsSync('js/pwa')],
['11. Business runtime package script is absent',!pkg.includes('test:business-runtime')],
['12. Vue mount target is present',main.includes("app.mount('#vue-runtime')")&&index.includes('id="vue-runtime"')],
['13. Calculation outputs require dataConfidenceState',confidence.includes('dataConfidenceState')&&confidence.includes('createCalculationResult')],
['14. Calculation confidence states include UNKNOWN and INSUFFICIENT_DATA',confidence.includes("'UNKNOWN'")&&confidence.includes("'INSUFFICIENT_DATA'")],
['15. Effective-dated configuration requires effective_from',effectiveDate.includes('effective_from')&&effectiveDate.includes('createEffectiveConfiguration')],
['16. Effective-date validation is UTC/ISO based',effectiveDate.includes('toISOString')],
['17. Atomic IndexedDB transaction boundary exists',transaction.includes('runAtomicTransaction')&&transaction.includes("'readwrite'")],
['18. Transaction failures abort/rollback',transaction.includes('transaction?.abort')&&transaction.includes('onabort')],
['19. Canonical DB exposes atomic transaction helper',db.includes('runAtomicTransaction')&&db.includes('requestResult')]
];
let failed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}if(failed)process.exitCode=1;
