import fs from 'node:fs';
const index=fs.readFileSync('index.html','utf8');
const runtime=fs.readFileSync('js/legacy-runtime.js','utf8');
const app=fs.readFileSync('js/app.js','utf8');
const agg=fs.readFileSync('js/dashboard/aggregator.js','utf8');
const checks=[
  ['UI shell no longer contains the monolithic runtime', !index.includes('async function loadArr')],
  ['legacy runtime externalized', index.includes('js/legacy-runtime.js')],
  ['module shell loaded', index.includes('js/ui-shell.js')],
  ['composition root exists', fs.existsSync('js/app.js')],
  ['all seven screens composed', ['work','fuel','expenses','revenue','maintenance','loan','renewals'].every(x=>app.includes(x))],
  ['dashboard consumes screen view models', agg.includes('getViewModel')],
  ['legacy runtime preserved during extraction', runtime.includes('async function loadArr')]
];
for(const [n,ok] of checks){ console.log(`${ok?'PASS':'FAIL'} ${n}`); if(!ok) process.exitCode=1; }
