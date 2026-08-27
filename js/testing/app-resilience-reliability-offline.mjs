import { chromium } from 'playwright';

const BASE = process.env.KFE_BASE_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
page.setDefaultTimeout(10000);

const errors = [];
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

async function boot() {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.KFE_VUE_RUNTIME?.mounted === true);
}

async function foundationContract() {
  return page.evaluate(async () => {
    const runtime = window.__KFE_RUNTIME__;
    if (!runtime) throw new Error('KFE runtime unavailable');
    if (!window.KFE_REPOSITORY) throw new Error('Repository boundary unavailable');
    if (!window.KFE_NETWORK) throw new Error('Network boundary unavailable');
    if (!window.KFE_VIEW_MODELS || typeof window.KFE_VIEW_MODELS !== 'object') throw new Error('View-model boundary unavailable');
    if (!navigator.serviceWorker) throw new Error('Service Worker API unavailable');
    const storagePersistSupported = !!navigator.storage?.persist;
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('kfe');
      request.onsuccess = () => { const db = request.result; resolve({ stores: [...db.objectStoreNames] }); db.close(); };
      request.onerror = () => reject(request.error || new Error('IndexedDB unavailable'));
    });
    return { vueMounted: true, runtime: true, repository: true, network: true, viewModels: true, serviceWorkerApi: true, storagePersistSupported, stores: db.stores };
  });
}

try {
  await boot();

  const starts = [];
  for (let i = 0; i < 3; i++) {
    starts.push(await foundationContract());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.KFE_VUE_RUNTIME?.mounted === true);
  }

  const result = await foundationContract();
  const requiredStores = ['state', 'outbox', 'config', 'audit', 'idempotency'];
  for (const store of requiredStores) {
    if (!result.stores.includes(store)) throw new Error(`Missing foundation store: ${store}`);
  }

  if (errors.length) throw new Error(errors.join('\n'));

  console.log(JSON.stringify({
    ok: true,
    coldStarts: starts.length,
    foundation: {
      vueMounted: true,
      runtime: true,
      repositoryBoundary: true,
      networkBoundary: true,
      viewModelBoundary: true,
      indexedDb: true,
      requiredStores: requiredStores.every(s => result.stores.includes(s)),
      serviceWorkerApi: true,
      storagePersistenceApi: result.storagePersistSupported
    },
    businessCalculations: 'intentionally not exercised; foundation remains business-rule agnostic'
  }, null, 2));
} finally {
  await browser.close();
}
