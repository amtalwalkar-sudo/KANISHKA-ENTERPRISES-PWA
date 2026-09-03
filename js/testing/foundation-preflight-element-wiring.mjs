import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const components=path.join(root,'src','components');
const appPath=path.join(root,'src','App.vue');
const failures=[];
const checks=[];
const assert=(condition,message)=>{checks.push(message);if(!condition)failures.push(message);};
const read=file=>fs.readFileSync(file,'utf8');

assert(fs.existsSync(appPath),'App.vue exists');
const app=read(appPath);
assert(/import\s*\{\s*application\s*\}\s*from\s*['"]\.\.\/js\/app\.js['"]/.test(app),'Presentation imports the application boundary through js/app.js');
assert(!/from\s+['"][^'"]*(?:repository|infrastructure|database)[^'"]*['"]/.test(app),'App.vue does not import repository/infrastructure/database modules directly');

const destinations=['Work','Performance','Timeline','More'];
for(const name of destinations)assert(app.includes(`'${name}'`),`Primary destination wired: ${name}`);
const modules=['Vehicle','Driver','Fuel','Expenses','Revenue','Loans','Maintenance','Compliance','Dashboard','Profitability','Historical Entries'];
for(const name of modules)assert(app.includes(`'${name}'`),`Module destination wired: ${name}`);

const componentFiles=fs.readdirSync(components).filter(name=>name.endsWith('.vue'));
const displayOnly=new Set(['KfeTimelineView.vue']);
const productionScreens=[
  'WorkSessionView.vue','PerformanceModuleView.vue','KfeTimelineView.vue','KfeModuleView.vue',
  'KfeFinancialModuleView.vue','VehicleModuleView.vue','MaintenanceModuleView.vue',
  'ComplianceModuleView.vue','LoanModuleView.vue','MoneyModuleView.vue','HistoricalEntriesView.vue',
  'FuelHistoryView.vue','FuelQuickEntry.vue'
];
for(const name of productionScreens){
  const file=path.join(components,name);
  assert(fs.existsSync(file),`Production screen exists: ${name}`);
  if(!fs.existsSync(file))continue;
  const text=read(file);
  assert(/<template(?:\s|>)/.test(text),`${name}: UI template renders`);
  assert(/<script(?:\s|>)/.test(text),`${name}: script boundary exists`);
  if(!displayOnly.has(name))assert(/@(?:click|submit|change|input|save-request|back|open|fuel-edit|fuel-undo|calculation-request|reset-request)/.test(text)||/defineEmits\s*\(/.test(text),`${name}: interactive/event surface exists`);
}

const eventWiring=[
  ['VehicleModuleView','@save-request="handleSaveRequest"'],
  ['MaintenanceModuleView','@save-request="handleSaveRequest"'],
  ['ComplianceModuleView','@save-request="handleSaveRequest"'],
  ['LoanModuleView','@save-request="handleSaveRequest"'],
  ['MoneyModuleView','@save-request="handleSaveRequest"'],
  ['HistoricalEntriesView','@save-request="handleHistoricalSave"'],
  ['MoneyModuleView','@fuel-edit="handleFuelEdit"'],
  ['MoneyModuleView','@fuel-undo="handleFuelUndo"']
];
for(const [component,wiring] of eventWiring)assert(app.includes(wiring),`App event wiring present: ${component} ${wiring}`);

const appImports=app.match(/import\s+(?:\{[^}]+\}|\w+)\s+from\s+['"]\.\/components\/([^'"]+\.vue)['"]/g)||[];
for(const statement of appImports){const match=statement.match(/\.\/components\/([^'"]+\.vue)/);if(match)assert(componentFiles.includes(match[1]),`App import resolves: ${match[1]}`);}

const allVue=fs.readdirSync(components).filter(name=>name.endsWith('.vue'));
for(const name of allVue){
  const text=read(path.join(components,name));
  if(/from\s+['"][^'"]*(?:repository|infrastructure|database)[^'"]*['"]/.test(text))failures.push(`${name}: presentation must not import repository/infrastructure/database directly`);
}

console.log(`FOUNDATION_PREFLIGHT_ELEMENT_WIRING_CHECKS=${checks.length}`);
if(failures.length){console.error('FOUNDATION_PREFLIGHT_ELEMENT_WIRING_FAILED');for(const f of failures)console.error(`- ${f}`);process.exit(1);}
console.log('FOUNDATION_PREFLIGHT_ELEMENT_WIRING=PASS');
