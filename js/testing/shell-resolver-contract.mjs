import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const mainSource = await readFile(new URL('../../src/main.js', import.meta.url), 'utf8');
const contractSource = await readFile(new URL('../../src/presentation/shell/shell-contract.js', import.meta.url), 'utf8');
const registrySource = await readFile(new URL('../../src/presentation/shell/shell-registry.js', import.meta.url), 'utf8');
const resolverSource = await readFile(new URL('../../src/presentation/shell/shell-resolver.js', import.meta.url), 'utf8');
const currentShellSource = await readFile(new URL('../../src/presentation/shell/shells/current/CurrentShell.vue', import.meta.url), 'utf8');

assert.match(mainSource, /resolveKfeShell/);
assert.match(mainSource, /resolvedShell\.shell\.component/);
assert.match(contractSource, /KFE_SHELL_CONTRACT_VERSION/);
assert.match(contractSource, /kfe:ui-shell/);
assert.match(registrySource, /KFE_SHELL_NAMES\.CURRENT/);
assert.match(registrySource, /CurrentShell/);
assert.match(resolverSource, /VITE_KFE_UI_SHELL/);
assert.match(resolverSource, /localStorage/);
assert.match(resolverSource, /KFE_SHELL_NAMES\.CURRENT/);
assert.match(currentShellSource, /<App\s*\/>/);
assert.match(currentShellSource, /\.\.\/\.\.\/\.\.\/\.\.\/App\.vue/);

console.log('KFE shell resolver contract: PASS');
