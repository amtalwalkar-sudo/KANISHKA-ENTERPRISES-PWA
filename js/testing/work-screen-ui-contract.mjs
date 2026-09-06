import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const view = await fs.readFile(new URL('../../src/components/WorkSessionView.vue', import.meta.url), 'utf8');
const css = await fs.readFile(new URL('../../src/components/work-session.css', import.meta.url), 'utf8');

assert.ok(view.includes('Hello, Welcome to Kanishka Enterprises'), 'Start of Day welcome banner is missing.');
assert.ok(view.includes("screenState === 'DAY_ENDED'"), 'Day Ended state branch is missing.');
assert.ok(view.includes('Kms run'), 'Kms run metric is missing.');
assert.ok(view.includes('Dead kms'), 'Dead kms metric is missing.');
assert.ok(view.includes('Revenue'), 'Revenue metric is missing.');
assert.ok(view.includes('Target'), 'Target metric is missing.');
assert.ok(view.includes("model.value?.state === 'DAY_ENDED' ? await application.getWorkSummary() : null"), 'Shift summary must only be loaded after the day has ended.');
assert.ok(!view.includes('Ready for the next operational day'), 'Legacy Day Ended copy must be removed.');
assert.ok(!view.includes('Your latest authoritative odometer is prefilled when you start the day.'), 'Legacy odometer copy must be removed.');
assert.ok(css.includes('.welcome-card'), 'Welcome card styling is missing.');
assert.ok(css.includes('.shift-summary-grid'), 'Shift summary grid styling is missing.');

console.log('PASS: Work screen Day Start welcome and Day Ended summary UI contract');
