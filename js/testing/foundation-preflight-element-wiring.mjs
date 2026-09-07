import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const components = path.join(root, 'src', 'components');
const appPath = path.join(root, 'src', 'App.vue');
const failures = [];
const checks = [];

const assert = (condition, message) => {
  checks.push(message);
  if (!condition) failures.push(message);
};
const read = (file) => fs.readFileSync(file, 'utf8');

assert(fs.existsSync(appPath), 'App.vue exists');
const app = read(appPath);
assert(/import\s*\{\s*kfePresentationApi\s*\}\s*from\s*['"]\.\/presentation\/application\/presentation-api\.js['"]/.test(app), 'Presentation imports the application through the presentation API boundary');
assert(!/from\s+['"][^'"]*(?:repository|infrastructure|database)[^'"]*['"]/.test(app), 'App.vue does not import repository/infrastructure/database modules directly');

const destinations = ['Work', 'Performance', 'Timeline', 'Admin'];
for (const name of destinations) assert(app.includes(`'${name}'`), `Primary destination available: ${name}`);
assert(!app.includes("'More'"), 'Obsolete More primary destination absent');
assert(app.includes('activeModule'), 'App keeps a minimal module presentation boundary');
assert(app.includes('class="empty-module" aria-label="Work"'), 'Work presentation surface is blank');
assert(app.includes('class="empty-module" aria-label="Timeline"'), 'Timeline presentation surface is blank');
assert(!app.includes('KfeSettingsView'), 'Legacy full Settings presentation is not mounted by App');
assert(!app.includes('handleSaveRequest'), 'Legacy App save-request wiring is absent');
assert(!app.includes('handleHistoricalSave'), 'Legacy App historical-save wiring is absent');
assert(!app.includes('AuthoritativeRecordForm'), 'Legacy historical correction form is not mounted by App');

const componentFiles = fs.readdirSync(components).filter((name) => name.endsWith('.vue'));
const appImports = app.match(/import\s+(?:\{[^}]+\}|\w+)\s+from\s+['"]\.\/components\/([^'"]+\.vue)['"]/g) || [];
for (const statement of appImports) {
  const match = statement.match(/\.\/components\/([^'"]+\.vue)/);
  if (match) assert(componentFiles.includes(match[1]), `App import resolves: ${match[1]}`);
}

for (const name of componentFiles) {
  const text = read(path.join(components, name));
  if (/from\s+['"][^'"]*(?:repository|infrastructure|database)[^'"]*['"]/.test(text)) {
    failures.push(`${name}: presentation must not import repository/infrastructure/database directly`);
  }
}

const shellPath = path.join(root, 'src', 'presentation', 'shell', 'shells', 'current', 'CurrentShell.vue');
assert(fs.existsSync(shellPath), 'Current shell exists');
if (fs.existsSync(shellPath)) {
  const shell = read(shellPath);
  assert(shell.includes('Backup'), 'Settings menu exposes Backup');
  assert(shell.includes('Restore'), 'Settings menu exposes Restore');
  assert(shell.includes('Data reset'), 'Settings menu exposes Data reset');
  assert(!shell.includes('openSettings'), 'Legacy full Settings navigation is absent');
  for (const name of destinations) assert(shell.includes(`id: '${name}'`), `Bottom navigation available: ${name}`);
  assert(!shell.includes('Theme'), 'Theme presentation is absent from the current shell');
  assert(!shell.includes('ambient'), 'Ambient presentation is absent from the current shell');
}

console.log(`FOUNDATION_PREFLIGHT_ELEMENT_WIRING_CHECKS=${checks.length}`);
if (failures.length) {
  console.error('FOUNDATION_PREFLIGHT_ELEMENT_WIRING_FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('FOUNDATION_PREFLIGHT_ELEMENT_WIRING=PASS');
