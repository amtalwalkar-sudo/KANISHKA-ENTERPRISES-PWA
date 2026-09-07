import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../../',import.meta.url);
const read=path=>readFile(new URL(`../../${path}`,import.meta.url),'utf8');

// These are deliberate public compatibility boundaries. Implementation-specific
// contracts must be tested against the implementation target, not these thin files.
const applicationBoundaries={
  'js/application/kfe.js':'js/application/kfe-application-facade.js',
  'js/application/administrator.js':'js/application/administrator-application.js',
  'js/application/work-lifecycle.js':'js/application/work-application-lifecycle.js',
  'js/application/read-models.js':'js/application/read-model-composition.js'
};
const presentationBoundaries={
  'src/components/AuthoritativeRecordForm.vue':'src/components/AuthoritativeRecordFormRole.vue',
  'src/components/FuelForm.vue':'src/components/FuelEntryForm.vue',
  'src/components/VehicleModuleView.vue':'src/components/VehicleModuleRole.vue',
  'src/components/KfeFinancialModuleView.vue':'src/components/FinancialModuleRole.vue',
  'src/components/PerformanceModuleView.vue':'src/components/PerformanceModuleRole.vue',
  'src/components/MaintenanceModuleView.vue':'src/components/MaintenanceModuleRole.vue',
  'src/components/DriverModuleView.vue':'src/components/DriverModuleRole.vue',
  'src/components/LoanModuleView.vue':'src/components/LoanModuleRole.vue'
};

for(const [publicPath,implementationPath] of Object.entries({...applicationBoundaries,...presentationBoundaries})){
  const publicSource=await read(publicPath);
  const implementationSource=await read(implementationPath);
  assert.ok(publicSource.length<1000,`${publicPath} is no longer a thin public boundary`);
  assert.ok(implementationSource.length>1000,`${implementationPath} is unexpectedly empty/thin`);
  assert.ok(publicSource.includes(implementationPath.split('/').at(-1)),`${publicPath} must delegate to ${implementationPath}`);
}

const testFiles=[];
for(const name of ['admin-screen-contract.mjs','administrator-foundation-contract.mjs','app-resilience-reliability-offline.mjs','architecture-boundaries.mjs','clean-architecture-contract.mjs','domain-calculation-verify.mjs','e2e-certification.mjs','fixed-expense-lifecycle-contract.mjs','fixed-expense-persistence-browser.mjs','foundation-audit.mjs','foundation-preflight-accounting-invariants.mjs','foundation-preflight-cross-module.mjs','foundation-preflight-element-wiring.mjs','foundation-preflight.mjs','governance-verify.mjs','kfe-screen-contract.mjs','performance-foundation-contract.mjs','phase-1-structural-pwa-shell.mjs','phase-2-shell-interaction.mjs','phase-3-ui-erp-contract.mjs','phase-5-completion-integrity.mjs','phase-5-dashboard-application-boundary.mjs','phase-5-expenses-application-boundary.mjs','phase-5-expenses-persistence-browser.mjs','phase-5-fuel-application-boundary.mjs','phase-5-fuel-persistence-browser.mjs','phase-5-loans-application-boundary.mjs','phase-5-loans-persistence-browser.mjs','phase-5-maintenance-application-boundary.mjs','phase-5-maintenance-persistence-browser.mjs','phase-5-module-application-contracts.mjs','phase-5-module-expansion.mjs','phase-5-profitability-application-boundary.mjs','phase-5-profitability-read-model-browser.mjs','phase-5-renewals-compliance-application-boundary.mjs','phase-5-renewals-compliance-persistence-browser.mjs','phase-5-replication-contract.mjs','phase-5-revenue-application-boundary.mjs','phase-5-revenue-persistence-browser.mjs','phase-5-vehicle-application-boundary.mjs','phase-5-vehicle-persistence-browser.mjs','phase-5-vehicle-persistence.mjs','phase-5-vehicle-repository-wiring.mjs','phase-6-ui-shell-contract.mjs','phase-7-reliability-contract.mjs','phase-i-operational-lifecycle.mjs','phase-j-financial-lifecycle.mjs','phase-k-persistence-recovery.mjs','phase-l-operational-integrity.mjs','phase-m-application-orchestration.mjs','phase-n-presentation-read-model.mjs','replaceable-shell-contract.mjs','repository-hardening-contract.mjs','settings-contract.mjs','shell-resolver-contract.mjs','three-screen-driver-corrections-contract.mjs','vehicle-domain-contract.mjs','vehicle-driver-ui-decoupling.mjs']) testFiles.push(name);

const thinPaths=[...Object.keys(applicationBoundaries),...Object.keys(presentationBoundaries)];
const stale=[];
for(const name of testFiles){
  const source=await read(`js/testing/${name}`);
  for(const thinPath of thinPaths){
    const escaped=thinPath.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&');
    const staticRead=new RegExp(`(?:readFileSync|readFile)\\([^\\n]*${escaped}`).test(source)
      || new RegExp(`new URL\\(['"](?:\\.\\./)+${escaped.replace(/^js\//,'js/').replace(/^src\//,'src/')}`).test(source);
    if(staticRead) stale.push(`${name} statically inspects thin boundary ${thinPath}`);
  }
}

assert.deepEqual(stale,[],`BOUNDARY_SEGREGATION_AUDIT=FAIL\\n${stale.join('\\n')}`);
console.log(`BOUNDARY_SEGREGATION_AUDIT=PASS (${Object.keys(applicationBoundaries).length+Object.keys(presentationBoundaries).length} thin boundaries, ${testFiles.length} validation sources scanned)`);
