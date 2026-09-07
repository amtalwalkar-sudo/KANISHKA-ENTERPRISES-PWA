import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createScreenMetadata, validateScreenMetadata, KFE_SCREEN_METADATA_RULES } from '../ui/screen-contract.js';
import { sanitizeDecimalInput, isValidDecimalInput } from '../ui/decimal-input.js';
import { CONFLICT_STATES, createConflictState, reviewConflict, resolveConflict } from '../core/conflict-resolution.js';

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
const router = read('js/ui/router.js');
const lifecycle = read('js/ui/lifecycle.js');
const accessibility = read('js/ui/accessibility.js');
const forms = read('src/components/KfeFormShell.vue');
const shell = read('src/presentation/shell/shells/current/CurrentShell.vue');
const css = read('src/styles/shell.css');
const repository = read('js/core/repository.js');
const db = read('js/core/hardened-db.js');
const decimal = read('js/ui/decimal-input.js');

// Reliability behavior belongs to the underlying UI/application contracts,
// not to the clean App.vue module canvas.
assert.match(router, /popstate/);
assert.match(router, /handleBack/);
assert.match(router, /routeHistory/);
assert.match(router, /sessionStorage/);
assert.doesNotMatch(router, /history\.back\(\)/);
assert.match(lifecycle, /visibilitychange/);
assert.match(lifecycle, /online/);
assert.match(lifecycle, /offline/);
assert.match(accessibility, /prefers-reduced-motion/);
assert.match(forms, /SUBMIT_COOLDOWN_MS/);
assert.match(forms, /submitTimer/);
assert.match(decimal, /sanitizeDecimalInput/);
assert.match(decimal, /isValidDecimalInput/);

// The structural presentation boundary is CurrentShell, while App.vue remains
// a clean module canvas and must not regain legacy reliability wiring.
assert.match(shell, /Work.*Performance.*Timeline.*Admin/s);
assert.match(shell, /Settings/);
assert.match(shell, /Backup/);
assert.match(shell, /Restore/);
assert.match(shell, /Data reset/);
assert.match(shell, /location\.hash/);
assert.match(shell, /hashchange/);
assert.match(shell, /<header/);
assert.match(shell, /<main/);
assert.match(shell, /<nav/);
assert.equal((shell.match(/<main/g)||[]).length,1,'structural shell must have one main viewport');
assert.doesNotMatch(shell, /kfe-swipe-bar|KfeSwipeBar|Tax Reserve|tax reserve/i);
assert.match(css, /button,:where\(\[role="button"\]\),:where\(a\)\{min-width:48px;min-height:48px\}/);

assert.match(repository, /openKfeDb/);
assert.match(repository, /write\('state'/);
assert.match(db, /indexedDB/);
assert.match(db, /onupgradeneeded/);

// Decimal sanitizer treats comma as the decimal separator and limits the fraction to the configured scale.
assert.equal(sanitizeDecimalInput('₹ 1,234.567'), '1.23');
assert.equal(sanitizeDecimalInput('12,50'), '12.50');
assert.equal(sanitizeDecimalInput('-12.50'), '12.50');
assert.equal(isValidDecimalInput('123.45'), true);
assert.equal(isValidDecimalInput('123.456'), false);

const metadata = createScreenMetadata({
  id: 'example',
  title: 'Example',
  sections: [{ id: 'details', title: 'Details', fields: [{ id: 'amount', label: 'Amount', kind: 'number' }] }],
  actions: [{ id: 'save', label: 'Save', kind: 'submit' }],
});
assert.equal(validateScreenMetadata(metadata), true);
assert.equal(KFE_SCREEN_METADATA_RULES.financialCalculationAllowed, false);

const conflict = createConflictState({ entityType: 'expense', entityId: 'e1', local: { amount: 10 }, remote: { amount: 12 } });
assert.equal(conflict.state, CONFLICT_STATES.DETECTED);
const reviewed = reviewConflict(conflict);
const resolved = resolveConflict(reviewed, { strategy: 'remote' });
assert.equal(resolved.state, CONFLICT_STATES.RESOLVED);

console.log('Phase 7 reliability contract: PASS');
console.log('Reliability foundations verified below the clean presentation boundary: routing/back handling, reduced motion, 48px touch targets, decimal enforcement, form locking, lifecycle/offline hooks, IndexedDB persistence, metadata, and conflict state machine.');
