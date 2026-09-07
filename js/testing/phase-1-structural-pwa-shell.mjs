import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const shell=await readFile(new URL('../../src/presentation/shell/shells/current/CurrentShell.vue',import.meta.url),'utf8');
const css=await readFile(new URL('../../src/styles/shell.css',import.meta.url),'utf8');
for(const token of ['driver-shell','driver-header','driver-content','quick-dock']) assert.ok(shell.includes(token),`CurrentShell.vue missing ${token}`);
assert.ok(shell.includes('<header'),'top bar markup missing');
assert.ok(shell.includes('<main'),'main viewport markup missing');
assert.ok(shell.includes('<nav'),'bottom navigation markup missing');
assert.ok(css.includes('env(safe-area-inset-top'),'top safe-area handling missing');
assert.ok(css.includes('env(safe-area-inset-bottom'),'bottom safe-area handling missing');
assert.ok(css.includes('overscroll-behavior-y:contain'),'viewport overscroll containment missing');
assert.ok(css.includes('min-width:48px')&&css.includes('min-height:48px'),'touch target foundation missing');
assert.ok(css.includes('prefers-reduced-motion:reduce'),'reduced-motion foundation missing');
assert.equal((shell.match(/<main/g)||[]).length,1,'structural shell must have one main viewport');
console.log('PHASE_1_STRUCTURAL_PWA_SHELL=PASS');
