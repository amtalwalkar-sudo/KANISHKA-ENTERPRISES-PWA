import assert from 'node:assert/strict';

const requiredChecks=[
  'UI renders',
  'all required elements are reachable',
  'valid input succeeds',
  'invalid input fails correctly',
  'busy/loading state works',
  'cancel/close works',
  'persistence occurs',
  'reload recovers state',
  'edit works',
  'delete/soft-delete works where applicable',
  'application boundary is respected',
  'repository boundary is respected',
  'business invariants hold',
  'cross-module effects are correct',
  'browser E2E succeeds',
  'resilience/offline behavior succeeds'
];

const applicableChecks=new Set(requiredChecks);
assert.equal(requiredChecks.length,16);
assert.equal(applicableChecks.size,16);

// Keep the production-screen contract explicit and reviewable. Individual
// screen suites provide the executable evidence; this gate prevents the
// Master CI contract from silently losing required coverage.
const contractPath='docs/KFE-SCREEN-CONTRACT.md';
const fs=await import('node:fs/promises');
const contract=await fs.readFile(contractPath,'utf8');
for(const check of requiredChecks){
  assert.ok(contract.toLowerCase().includes(check.toLowerCase()),`Missing KFE Screen Contract item: ${check}`);
}

console.log('KFE_SCREEN_CONTRACT=PASS');
console.log(`KFE_SCREEN_CONTRACT_ITEMS=${requiredChecks.length}`);
