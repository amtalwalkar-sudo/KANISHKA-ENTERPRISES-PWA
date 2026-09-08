import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createScreenMetadata, validateScreenMetadata, KFE_SCREEN_METADATA_RULES } from '../ui/screen-contract.js';
import { sanitizeDecimalInput, isValidDecimalInput } from '../ui/decimal-input.js';
import { CONFLICT_STATES, createConflictState, reviewConflict, resolveConflict } from '../core/conflict-resolution.js';

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const exists = (path) => fs.existsSync(new URL(`../../${path}`, import.meta.url));

const router = read('js/ui/router.js');
const lifecycle = read('js/ui/lifecycle.js');
const accessibility = read('js/ui/accessibility.js');
const forms = read('src/components/KfeFormShell.vue');
const shell = read('src/presentation/shell/shells/current/CurrentShell.vue');
const app = read('src/App.vue');
const css = read('src/styles/shell.css');
const repository = read('js/core/repository.js');
const db = read('js/core/hardened-db.js');
const decimal = read('js/ui/decimal-input.js');
const presentationApi = read('src/presentation/application/presentation-api.js');
const navigation = read('js/ui/navigation.js');
const uiContract = read('js/application/ui-contract.js');

// ---------------------------------------------------------------------------
// 1. Routing and lifecycle reliability
// ---------------------------------------------------------------------------
assert.match(router, /popstate/);
assert.match(router, /handleBack/);
assert.match(router, /routeHistory/);
assert.match(router, /sessionStorage/);
assert.doesNotMatch(router, /history\.back\(\)/);
assert.match(lifecycle, /visibilitychange/);
assert.match(lifecycle, /online/);
assert.match(lifecycle, /offline/);
assert.match(accessibility, /prefers-reduced-motion/);

// ---------------------------------------------------------------------------
// 2. Input and double-submit protection
// ---------------------------------------------------------------------------
assert.match(forms, /SUBMIT_COOLDOWN_MS/);
assert.match(forms, /submitTimer/);
assert.match(decimal, /sanitizeDecimalInput/);
assert.match(decimal, /isValidDecimalInput/);
assert.equal(sanitizeDecimalInput('₹ 1,234.567'), '1.23');
assert.equal(sanitizeDecimalInput('12,50'), '12.50');
assert.equal(sanitizeDecimalInput('-12.50'), '12.50');
assert.equal(isValidDecimalInput('123.45'), true);
assert.equal(isValidDecimalInput('123.456'), false);

// ---------------------------------------------------------------------------
// 3. Current production presentation boundary
// ---------------------------------------------------------------------------
assert.match(shell, /Performance/);
assert.match(shell, /Admin/);
assert.doesNotMatch(shell, /Work.*Performance.*Timeline.*Admin/s);
assert.equal((shell.match(/\{ id: 'Performance'/g) || []).length, 1);
assert.equal((shell.match(/\{ id: 'Admin'/g) || []).length, 1);
assert.match(shell, /Settings/);
assert.match(shell, /Backup/);
assert.match(shell, /Restore/);
assert.match(shell, /Data reset/);
assert.match(shell, /location\.hash/);
assert.match(shell, /hashchange/);
assert.match(shell, /<header/);
assert.match(shell, /<main/);
assert.match(shell, /<nav/);
assert.equal((shell.match(/<main/g) || []).length, 1, 'structural shell must have one main viewport');
assert.doesNotMatch(shell, /kfe-swipe-bar|KfeSwipeBar/);
assert.match(app, /PerformanceModuleView/);
assert.match(app, /AdminModuleView/);
assert.doesNotMatch(app, /WorkSessionView|KfeTimelineView|StatusModuleView|empty-module/);
assert.match(navigation, /Performance/);
assert.match(navigation, /Admin/);
assert.doesNotMatch(navigation, /Timeline|Status|More/);
assert.doesNotMatch(presentationApi, /WorkSessionView|KfeTimelineView|workSessionReadModel|timelineReadModel/);
assert.doesNotMatch(uiContract, /START_DAY|selectModule|MORE_MODULES|PRIMARY_MODULES/);

// ---------------------------------------------------------------------------
// 4. Deleted legacy presentation wiring stays deleted
// ---------------------------------------------------------------------------
for (const path of [
  'js/ui/module-navigation.js',
  'js/ui/module-contracts.js',
  'js/ui/module-states.js',
  'js/ui/timeline.js',
  'src/components/WorkSessionView.vue',
  'src/components/KfeTimelineView.vue',
  'src/styles/timeline-horizons.css',
  'src/presentation/application/presentation-runtime.js',
]) {
  assert.equal(exists(path), false, `legacy presentation file remains deleted: ${path}`);
}

// ---------------------------------------------------------------------------
// 5. Screen metadata contract
// ---------------------------------------------------------------------------
const metadata = createScreenMetadata({ id: 'phase-7', title: 'Reliability' });
assert.equal(validateScreenMetadata(metadata, KFE_SCREEN_METADATA_RULES), true);

// ---------------------------------------------------------------------------
// 6. Conflict-resolution contract
// ---------------------------------------------------------------------------
assert.ok(CONFLICT_STATES);
const conflict = createConflictState({
  entityType: 'WorkSession',
  entityId: 'phase-7-test',
  local: { version: 1 },
  remote: { version: 2 },
});
const reviewedConflict = reviewConflict(conflict);
assert.equal(reviewedConflict.state, CONFLICT_STATES.REVIEW);
assert.ok(resolveConflict(reviewedConflict, { strategy: 'remote' }));

console.log('Phase 7 reliability contract: PASS');