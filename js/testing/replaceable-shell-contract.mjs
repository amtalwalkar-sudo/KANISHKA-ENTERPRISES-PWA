import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function walk(dir) {
  const output = [];
  if (!fs.existsSync(dir)) return output;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...walk(absolute));
    else if (/\.(?:vue|js|mjs)$/.test(entry.name)) output.push(absolute);
  }
  return output;
}

function relative(file) {
  return path.relative(root, file).replaceAll(path.sep, '/');
}

function runRecursivePresentationWiringAudit() {
  const files = [
    ...walk(path.join(root, 'src/components')),
    ...walk(path.join(root, 'src/presentation')),
  ];
  const violations = [];
  const controlledAppBridge = new Set([
    'src/presentation/application/presentation-api.js',
  ]);

  for (const file of files) {
    const name = relative(file);
    const source = fs.readFileSync(file, 'utf8');

    if (/from\s+['"][^'"]*(?:^|\/)js\/app\.js['"]/.test(source) && !controlledAppBridge.has(name)) {
      violations.push(`${name}: direct import of js/app.js bypasses the presentation boundary`);
    }

    if (/from\s+['"][^'"]*(?:core\/repository|core\/db|core\/database|repository\.js|dexie)[^'"]*['"]/i.test(source)) {
      violations.push(`${name}: presentation code must not import repository/database infrastructure directly`);
    }

    if (/\b(?:indexedDB|IDBDatabase|Dexie)\b/.test(source)) {
      violations.push(`${name}: presentation code must not access IndexedDB/Dexie directly`);
    }

    if (name.startsWith('src/components/') && /\b(?:localStorage|sessionStorage)\b/.test(source)) {
      violations.push(`${name}: presentation components must not access browser storage directly; use an approved application/UI infrastructure boundary`);
    }
  }

  return { filesScanned: files.length, violations };
}

const contract = read('src/presentation/shell/shell-contract.js');
const registry = read('src/presentation/shell/shell-registry.js');
const resolver = read('src/presentation/shell/shell-resolver.js');
const main = read('src/main.js');
const current = read('src/presentation/shell/shells/current/CurrentShell.vue');
const api = read('src/presentation/application/presentation-api.js');
const appShell = read('src/App.vue');
const fuelForm = read('src/components/FuelForm.vue');

const checks = [
  ['shell contract version exists', contract.includes("KFE_SHELL_CONTRACT_VERSION = '1.0.0'")],
  ['current shell is registered', registry.includes("KFE_SHELL_NAMES.CURRENT")],
  ['resolver validates selection', resolver.includes('normalizeShellName')],
  ['resolver has safe current fallback', resolver.includes('getShell(KFE_SHELL_NAMES.CURRENT)')],
  ['main resolves shell before mount', main.includes('resolveKfeShell()')],
  ['main mounts resolved shell component', main.includes('resolvedShell.shell.component')],
  ['current shell delegates to existing App', current.includes("import App from '../../../../App.vue';")],
  ['presentation API has stable version', api.includes("version: '1.0.0'")],
  ['presentation API separates reads and commands', api.includes('read: Object.freeze(read)') && api.includes('commands: Object.freeze(commands)')],
  ['presentation API does not expose repository', !api.includes("../core/repository") && !api.includes('IndexedDB')],
  ['App shell no longer imports application singleton', !appShell.includes("import { application } from '../js/app.js'") && !appShell.includes("import { application } from '../js/app.js';")],
  ['Quick Fuel no longer imports application singleton', !fuelForm.includes("import { application } from '../../js/app.js'") && !fuelForm.includes("import { application } from '../../js/app.js';")],
  ['presentation runtime exists for legacy shell consumers', fs.existsSync(path.join(root, 'src/presentation/application/presentation-runtime.js'))],
];

const audit = runRecursivePresentationWiringAudit();
checks.push([
  `recursive presentation wiring audit (${audit.filesScanned} files)`,
  audit.violations.length === 0,
]);

const failures = checks.filter(([, ok]) => !ok);
if (failures.length || audit.violations.length) {
  console.error('REPLACEABLE SHELL CONTRACT: FAIL');
  for (const [name] of failures) console.error(`- ${name}`);
  for (const violation of audit.violations) console.error(`- ${violation}`);
  process.exit(1);
}
console.log(`REPLACEABLE SHELL CONTRACT: PASS (${checks.length}/${checks.length}); recursive wiring audit PASS (${audit.filesScanned} files)`);
