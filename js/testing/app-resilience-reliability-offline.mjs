import { chromium } from 'playwright';

const BASE = process.env.KFE_BASE_URL || 'http://127.0.0.1:4173/';
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
page.setDefaultTimeout(10000);
const errors = [];
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
page.on('requestfailed', r => errors.push(`requestfailed: ${r.url()} :: ${r.failure()?.errorText || 'unknown'}`));

async function boot() {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__KFE_RUNTIME__ && window.KFE_VIEW_MODELS && window.KFE_DASHBOARD_SNAPSHOT);
}

async function assertRuntime() {
  const state = await page.evaluate(() => ({
    models: Object.keys(window.KFE_VIEW_MODELS || {}),
    runtimeKeys: Object.keys(window.__KFE_RUNTIME__ || {}),
    actions: Object.keys(window.__KFE_RUNTIME__?.actions || {}),
    dashboard: !!window.KFE_DASHBOARD_SNAPSHOT,
    active: document.querySelector('.tab-panel.active')?.id || null,
    tabs: document.querySelectorAll('#tabbar button').length,
    sw: !!navigator.serviceWorker?.controller
  }));
  for (const name of ['work','fuel','expenses','revenue','maintenance','loan','renewals']) if (!state.models.includes(name)) throw new Error(`Missing view-model: ${name}`);
  for (const name of ['workViewModel','fuelViewModel','expensesViewModel','revenueViewModel']) if (!state.runtimeKeys.includes(name)) throw new Error(`Missing runtime VM: ${name}`);
  for (const name of ['startWork','endWork']) if (!state.actions.includes(name)) throw new Error(`Missing runtime action: ${name}`);
  if (!state.dashboard) throw new Error('Dashboard snapshot unavailable');
  if (state.active !== 'tab-work') throw new Error(`Unexpected active tab: ${state.active}`);
  if (state.tabs < 5) throw new Error(`Unexpected tab count: ${state.tabs}`);
  return state;
}

async function readSessions() {
  return page.evaluate(() => JSON.parse(window.localStorage.getItem('betafleet_sessions') || '[]'));
}

await boot();
const origin = await page.evaluate(() => location.origin);
if (!/^https?:$/.test(new URL(origin).protocol)) throw new Error(`Unsafe test origin: ${origin}`);
await page.evaluate(() => window.localStorage.clear());

const coldStarts = [];
for (let i = 0; i < 5; i++) { await boot(); coldStarts.push(await assertRuntime()); }

for (let i = 0; i < 3; i++) {
  for (const tab of ['fuel','expenses','dashboard','backup','work']) {
    await page.locator(`#nav-${tab}`).click();
    await page.waitForTimeout(30);
    const active = await page.locator('.tab-panel.active').getAttribute('id');
    if (active !== `tab-${tab}`) throw new Error(`Navigation failed: ${tab} -> ${active}`);
  }
}

await page.locator('#nav-work').click();
await page.locator('#start-odo').fill('12345');
await page.evaluate(() => window.__KFE_RUNTIME__.actions.startWork({ startOdo: 12345, now: 1700000000000 }));
await page.waitForTimeout(100);
const beforeReload = await readSessions();
if (beforeReload.length !== 1 || beforeReload[0].startOdo !== 12345 || beforeReload[0].status !== 'Open') throw new Error(`Persistence failed before reload: ${JSON.stringify(beforeReload)}`);

await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__KFE_RUNTIME__ && window.KFE_VIEW_MODELS && window.KFE_DASHBOARD_SNAPSHOT);
const afterReload = await readSessions();
if (JSON.stringify(afterReload) !== JSON.stringify(beforeReload)) throw new Error(`Persistence changed after reload: ${JSON.stringify(afterReload)}`);
await assertRuntime();

await page.evaluate(async () => {
  if (!navigator.serviceWorker?.controller) {
    await new Promise(resolve => {
      const timer = setTimeout(resolve, 2000);
      navigator.serviceWorker?.addEventListener('controllerchange', () => { clearTimeout(timer); resolve(); }, { once: true });
    });
  }
});
if (!(await page.evaluate(() => !!navigator.serviceWorker?.controller))) throw new Error('Service worker did not control the app after online boot');

await context.setOffline(true);
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => window.__KFE_RUNTIME__ && window.KFE_VIEW_MODELS && window.KFE_DASHBOARD_SNAPSHOT, null, { timeout: 5000 });
const offlineState = await assertRuntime();
const offlineStored = await readSessions();
if (offlineStored.length !== 1 || offlineStored[0].startOdo !== 12345) throw new Error(`Offline persistence failed: ${JSON.stringify(offlineStored)}`);
await context.setOffline(false);
if (errors.length) throw new Error(errors.join('\n'));
console.log(JSON.stringify({ ok: true, appResilience: { coldStarts: coldStarts.length, passed: true }, reliability: { repeatedNavigation: true, persistenceAcrossReload: true }, offlineFirst: { serviceWorkerControlled: true, cachedReload: true, persistedState: true }, offlineState }, null, 2));
await browser.close();
