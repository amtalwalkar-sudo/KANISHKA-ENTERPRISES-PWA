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

  const observed = await page.evaluate(async ({testDataId, asOf}) => {
    const runtime = window.__KFE_RUNTIME__;
    const snapshot = await runtime.repository.exportSnapshot();
    const performance = await runtime.application.getPerformance(asOf);
    const timeline = await runtime.application.getTimeline('Day', asOf);
    const counts = Object.fromEntries(Object.entries(snapshot.stores).map(([name, rows]) => [name, rows.filter(row => row.test_data_id === testDataId).length]));
    return {counts, performance, timelineEvents: timeline.events.length};
  }, {testDataId:TEST_DATA_ID, asOf:'2026-09-05T12:00:00.000Z'});

  assert.ok(observed.counts.vehicles >= 1, 'vehicle fixture was not persisted');
  assert.ok(observed.counts.work_sessions > 1000, 'five-year work sessions were not persisted');
  assert.ok(observed.counts.rides > 10000, 'five-year rides were not persisted');
  assert.equal(observed.counts.fuel_records, observed.counts.work_sessions, 'full-tank fuel coverage does not match work days');
  assert.ok(observed.counts.loan_payments === 60, '60-month loan schedule was not persisted');
  assert.ok(observed.counts.renewals_compliance > 10, 'renewal/compliance events were not persisted');
  assert.ok(observed.timelineEvents > 1000, 'timeline did not observe the loaded history');
  assert.ok(Number(observed.performance.businessKm) > 0, 'performance read model did not observe business KM');
  assert.ok(Number(observed.performance.revenuePaise) > 0, 'performance read model did not observe revenue');
  assert.ok(Number(observed.performance.fuelPaise) > 0, 'performance read model did not observe fuel');

  // Safe cleanup: restore exactly what existed before the synthetic fixture was loaded.
  await page.evaluate(snapshot => window.__KFE_RUNTIME__.repository.importSnapshot(snapshot), original);
  const restored = await page.evaluate(() => window.__KFE_RUNTIME__.repository.exportSnapshot());
  const leaked = Object.values(restored.stores).flat().filter(row => row.test_data_id === TEST_DATA_ID);
  assert.equal(leaked.length, 0, 'synthetic test records leaked after cleanup');
  assert.equal(restored.dbName, 'kfe');
  assert.ok(restored.dbVersion >= 9, 'KFE schema unexpectedly regressed during fixture round-trip');

  console.log(`KFE_5Y_FIXTURE=PASS ${TEST_PERIOD.start}..${TEST_PERIOD.end}`);
  console.log(`KFE_5Y_CLEANUP=PASS ${TEST_DATA_ID}`);
} finally {
  if (original) {
    try {
      await page.evaluate(snapshot => window.__KFE_RUNTIME__.repository.importSnapshot(snapshot), original);
    } catch (error) {
      errors.push(`Cleanup restore failed: ${error?.message || error}`);
    }
  }
  assert.deepEqual(errors, [], `Browser console/page errors: ${errors.join(' | ')}`);
  await context.close();
  await browser.close();
}
