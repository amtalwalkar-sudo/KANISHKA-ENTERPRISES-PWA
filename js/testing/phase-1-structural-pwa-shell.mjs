import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../../src/App.vue',import.meta.url),'utf8');
const css=await readFile(new URL('../../src/styles/shell.css',import.meta.url),'utf8');
for(const token of ['kfe-shell','kfe-topbar','kfe-viewport','kfe-bottom-nav']) assert.ok(app.includes(token),`App.vue missing ${token}`);
assert.ok(app.includes('<header'),'top bar markup missing');
assert.ok(app.includes('<main'),'main viewport markup missing');
assert.ok(app.includes('<nav'),'bottom navigation markup missing');
assert.ok(css.includes('env(safe-area-inset-top'),'top safe-area handling missing');
assert.ok(css.includes('env(safe-area-inset-bottom'),'bottom safe-area handling missing');
assert.ok(css.includes('overscroll-behavior-y:contain'),'viewport overscroll containment missing');
assert.ok(css.includes('min-width:48px')&&css.includes('min-height:48px'),'touch target foundation missing');
assert.ok(css.includes('prefers-reduced-motion:reduce'),'reduced-motion foundation missing');
assert.equal((app.match(/<main/g)||[]).length,1,'structural shell must have one main viewport');
console.log('PHASE_1_STRUCTURAL_PWA_SHELL=PASS');
