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

async function integrationContract() {
  return page.evaluate(async () => {
    const runtime = window.__KFE_RUNTIME__;
    const moduleUrl = relativePath => new URL(relativePath, window.location.href).href;
    const {queueOutbox,flushOutbox} = await import(moduleUrl('./js/core/outbox.js'));
    const {all} = await import(moduleUrl('./js/core/hardened-db.js'));
    const id = `phase-h-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await queueOutbox({id,type:'PHASE_H_TEST',payload:{ok:true}});
    const queued = (await all('outbox')).some(entry => entry.id === id);
    if (!queued) throw new Error('Outbox enqueue did not persist');
    let failed = false;
    try { await flushOutbox(async () => { throw new Error('intentional Phase-H delivery failure'); }); } catch { failed = true; }
    if (!failed) throw new Error('Outbox failure was not surfaced');
    if (!(await all('outbox')).some(entry => entry.id === id)) throw new Error('Failed outbox entry was lost');
    const delivered = [];
    await flushOutbox(async entry => { delivered.push(entry.id); });
    if (!delivered.includes(id)) throw new Error('Outbox entry was not delivered');
    if ((await all('outbox')).some(entry => entry.id === id)) throw new Error('Delivered outbox entry was not removed');

    const stateKey = `phase-h-${Date.now()}`;
    const original = await runtime.repository.load();
    await runtime.repository.save({...original,__phaseHProbe:stateKey});
    const persisted = await runtime.repository.load();
    if (persisted.__phaseHProbe !== stateKey) throw new Error('Repository persistence round-trip failed');

    let rolledBack = false;
    try {
      await runtime.repository.atomic(['state'], stores => {
        stores.state.put({id:'phase-h-rollback-probe',value:{shouldNotPersist:true},created_at:new Date().toISOString(),updated_at:new Date().toISOString(),synced:false,is_deleted:false});
        throw new Error('intentional Phase-H rollback');
      });
    } catch { rolledBack = true; }
    if (!rolledBack) throw new Error('Atomic transaction failure was not surfaced');
    const rollbackProbe = await new Promise((resolve, reject) => {
      const request = indexedDB.open('kfe');
      request.onsuccess = () => { const db = request.result; const tx = db.transaction('state','readonly'); const get = tx.objectStore('state').get('phase-h-rollback-probe'); get.onsuccess = () => { resolve(get.result ?? null); db.close(); }; get.onerror = () => reject(get.error); };
      request.onerror = () => reject(request.error);
    });
    if (rollbackProbe !== null) throw new Error('Atomic transaction did not rollback');
    return {outbox: true, repositoryPersistence: true, atomicRollback: true};
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
  const integration = await integrationContract();
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
    integration,
    businessCalculations: 'intentionally not exercised; foundation remains business-rule agnostic'
  }, null, 2));
} finally {
  await browser.close();
}
