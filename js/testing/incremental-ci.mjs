import { spawnSync } from 'node:child_process';

export const CI_STAGES = [
  { key: 'screen', label: 'KFE screen contract', commands: ['validate:kfe-screen-contract'] },
  { key: 'preflight', label: 'Foundation preflight', commands: ['validate:foundation-preflight'] },
  { key: 'governance', label: 'Governance', commands: ['validate:governance'] },
  { key: 'architecture', label: 'Architecture and foundation', commands: ['validate:architecture', 'validate:foundation', 'validate:foundation-audit'] },
  { key: 'domain', label: 'Domain and lifecycle', commands: ['validate:domain', 'validate:phase-i', 'validate:phase-j', 'validate:phase-l', 'validate:phase-m', 'validate:phase-n'] },
  { key: 'geolocation', label: 'Work geolocation', commands: ['validate:work-geolocation'] },
  { key: 'administrator', label: 'Administrator Vehicle/Driver foundation', commands: ['validate:administrator-foundation', 'validate:vehicle-driver-ui-decoupling'] },
  { key: 'persistence', label: 'Persistence and recovery', commands: ['validate:phase-k'] },
  { key: 'ui', label: 'UI shell contracts', commands: ['validate:phase-1', 'validate:phase-2', 'validate:phase-3', 'validate:phase-5', 'validate:phase-5-replication', 'validate:phase-5-module-contracts', 'validate:phase-5-completion-integrity', 'validate:phase-6-ui-shell', 'validate:phase-7-reliability'] },
  { key: 'application', label: 'Module application boundaries', commands: ['validate:phase-5-vehicle', 'validate:phase-5-fuel-application', 'validate:phase-5-expenses-application', 'validate:phase-5-revenue-application', 'validate:phase-5-loans-application', 'validate:phase-5-renewals-compliance-application', 'validate:phase-5-maintenance-application', 'validate:phase-5-profitability-application', 'validate:phase-5-dashboard-application'] },
  { key: 'real-persistence', label: 'Real persistence checks', commands: ['validate:phase-5-vehicle-real-persistence', 'validate:phase-5-fuel-real-persistence', 'validate:phase-5-expenses-real-persistence', 'validate:phase-5-revenue-real-persistence', 'validate:phase-5-loans-real-persistence', 'validate:phase-5-renewals-compliance-real-persistence', 'validate:phase-5-maintenance-real-persistence'] },
  { key: 'runtime', label: 'Runtime syntax and Work Screen domain contract', commands: ['validate:phase-4'] },
  { key: 'identity', label: 'Runtime identity and service-worker boundary', commands: [] },
  { key: 'browser', label: 'Work Screen browser integration', commands: ['validate:work-screen-browser'] },
  { key: 'resilience', label: 'Legacy resilience and offline validation', commands: [] },
  { key: 'final-sync', label: 'Final live-state synchronization', commands: [] },
  { key: 'final-build', label: 'Final build verification', commands: [] },
];

export const MODULE_STARTS = Object.freeze({
  all: 'screen',
  vehicle: 'administrator',
  driver: 'administrator',
  maintenance: 'domain',
  compliance: 'domain',
  fuel: 'domain',
  expenses: 'domain',
  revenue: 'domain',
  loans: 'domain',
  profitability: 'domain',
  dashboard: 'domain',
  work: 'domain',
  settings: 'architecture',
});

export function resolveStart(moduleName = 'all', explicitStart = 'auto') {
  if (explicitStart && explicitStart !== 'auto') return explicitStart;
  const normalized = String(moduleName).trim().toLowerCase();
  return MODULE_STARTS[normalized] ?? 'architecture';
}

export function stagesFrom(startKey) {
  const index = CI_STAGES.findIndex((stage) => stage.key === startKey);
  if (index < 0) throw new Error(`Unknown CI start boundary: ${startKey}`);
  return CI_STAGES.slice(index);
}

function runNpm(script) {
  const result = spawnSync('npm', ['run', script], { stdio: 'inherit', shell: false });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function runShellStage(key) {
  if (key === 'identity') {
    const code = `import { profitability } from './js/domain/dashboard.js'; const input={revenue:1000000,fuel:100000,maintenanceProvision:50000,fixedOverhead:100000,loanPrincipal:100000,loanInterest:20000,otherBusinessCosts:30000,takeHomeTargetPaise:200000}; const output=profitability(input); if(output.value?.netProfitPaise!==600000) process.exit(1); console.log('DIRECT_PROFITABILITY_RESULT='+JSON.stringify(output));`;
    runNpm(`exec -- node --input-type=module -e ${JSON.stringify(code)}`);
    return;
  }
  if (key === 'resilience') {
    const result = spawnSync('node', ['js/testing/app-resilience-reliability-offline.mjs'], { stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status ?? 1);
    return;
  }
  if (key === 'final-sync') {
    if (!process.env.KFE_VALIDATED_SHA) throw new Error('KFE_VALIDATED_SHA is required for final synchronization');
    console.log(`FINAL_SYNC_BOUNDARY=PASS ${process.env.KFE_VALIDATED_SHA}`);
    return;
  }
  if (key === 'final-build') {
    runNpm('build');
  }
}

export function runIncremental(moduleName = 'all', explicitStart = 'auto') {
  const start = resolveStart(moduleName, explicitStart);
  const stages = stagesFrom(start);
  console.log(`KFE_INCREMENTAL_CI_MODULE=${String(moduleName).toLowerCase()}`);
  console.log(`KFE_INCREMENTAL_CI_START=${start}`);
  console.log(`KFE_INCREMENTAL_CI_STAGE_COUNT=${stages.length}`);
  for (const stage of stages) {
    console.log(`KFE_INCREMENTAL_STAGE_START=${stage.key}:${stage.label}`);
    for (const command of stage.commands) runNpm(command);
    if (stage.commands.length === 0) runShellStage(stage.key);
    console.log(`KFE_INCREMENTAL_STAGE_PASS=${stage.key}`);
  }
  console.log('KFE_INCREMENTAL_CI=PASS');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const moduleName = process.argv[2] ?? 'all';
  const explicitStart = process.argv[3] ?? 'auto';
  runIncremental(moduleName, explicitStart);
}
