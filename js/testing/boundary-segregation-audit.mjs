import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';

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

const testFiles=(await readdir(new URL('../../js/testing/',import.meta.url),{withFileTypes:true}))
  .filter(entry=>entry.isFile()&&entry.name.endsWith('.mjs'))
  .map(entry=>entry.name);

const thinPaths=[...Object.keys(applicationBoundaries),...Object.keys(presentationBoundaries)];
const stale=[];
for(const name of testFiles){
  const source=await read(`js/testing/${name}`);
  for(const thinPath of thinPaths){
    const relativeFromTesting=thinPath.startsWith('js/')
      ? `../${thinPath.slice(3)}`
      : `../../${thinPath}`;
    const escaped=relativeFromTesting.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&');
    const directPath=thinPath.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&');
    const staticRead=new RegExp(`(?:readFileSync|readFile)\\([^\\n]*${directPath}`).test(source)
      || new RegExp(`new URL\\(['"]${escaped}`).test(source);
    if(staticRead) stale.push(`${name} statically inspects thin boundary ${thinPath}`);
  }
}

assert.deepEqual(stale,[],`BOUNDARY_SEGREGATION_AUDIT=FAIL\\n${stale.join('\\n')}`);
console.log(`BOUNDARY_SEGREGATION_AUDIT=PASS (${Object.keys(applicationBoundaries).length+Object.keys(presentationBoundaries).length} thin boundaries, ${testFiles.length} validation sources scanned)`);
