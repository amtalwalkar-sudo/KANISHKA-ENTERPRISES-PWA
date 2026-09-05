import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {generateFiveYearFixture,TEST_DATA_ID,TEST_PERIOD} from './kfe-5-year-test-fixture.mjs';

const BASE_URL = process.env.KFE_TEST_BASE_URL || 'http://127.0.0.1:4173/';
const fixture = generateFiveYearFixture();
const browser = await chromium.launch({headless:true});
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e?.message || e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
let original = null;
try {
  await page.goto(BASE_URL, {waitUntil:'networkidle'});
  await page.locator('.kfe-shell').waitFor({state:'visible', timeout:30000});
  original = await page.evaluate(() => window.__KFE_RUNTIME__.repository.exportSnapshot());
  await page.evaluate(snapshot => window.__KFE_RUNTIME__.repository.importSnapshot(snapshot), fixture);
  const observed = await page.evaluate(async asOf => {
    const runtime = window.__KFE_RUNTIME__;
    const snapshot = await runtime.repository.exportSnapshot();
    const performance = await runtime.application.getPerformance(asOf);
    const timeline = await runtime.application.getTimeline('Long-term', asOf);
    return {counts:Object.fromEntries(Object.entries(snapshot.stores).map(([name,rows])=>[name,rows.length])),performance,timelineEvents:timeline.events.length};
  }, '2026-09-05T12:00:00.000Z');
  assert.equal(observed.counts.vehicles, fixture.stores.vehicles.length);
  assert.equal(observed.counts.work_sessions, fixture.stores.work_sessions.length);
  assert.equal(observed.counts.rides, fixture.stores.rides.length);
  assert.equal(observed.counts.fuel_records, fixture.stores.fuel_records.length);
  assert.equal(observed.counts.loan_payments, fixture.stores.loan_payments.length);
  assert.equal(observed.counts.renewals_compliance, fixture.stores.renewals_compliance.length);
  assert.equal(observed.counts.work_sessions, fixture.expected.workingDays);
  assert.equal(observed.counts.fuel_records, fixture.expected.workingDays);
  const expectedTimeline = ['work_sessions','fuel_records','expense_records','revenue_records','maintenance_records','renewals_compliance','loan_payments'].reduce((n,k)=>n+fixture.stores[k].length,0);
  assert.equal(observed.timelineEvents, expectedTimeline);
  assert.ok(Number(observed.performance.businessKm)>0);
  assert.ok(Number(observed.performance.revenuePaise)>0);
  assert.ok(Number(observed.performance.fuelPaise)>0);
  await page.evaluate(snapshot => window.__KFE_RUNTIME__.repository.importSnapshot(snapshot), original);
  const restored = await page.evaluate(() => window.__KFE_RUNTIME__.repository.exportSnapshot());
  assert.equal(Object.values(restored.stores).flat().filter(row => row.test_data_id === TEST_DATA_ID).length, 0);
  assert.equal(restored.dbName, 'kfe');
  assert.ok(restored.dbVersion >= 9);
  console.log(`KFE_5Y_FIXTURE=PASS ${TEST_PERIOD.start}..${TEST_PERIOD.end}`);
  console.log(`KFE_5Y_CLEANUP=PASS ${TEST_DATA_ID}`);
} finally {
  if (original) { try { await page.evaluate(snapshot => window.__KFE_RUNTIME__.repository.importSnapshot(snapshot), original); } catch (error) { errors.push(`Cleanup restore failed: ${error?.message || error}`); } }
  assert.deepEqual(errors, [], `Browser console/page errors: ${errors.join(' | ')}`);
  await context.close(); await browser.close();
}
