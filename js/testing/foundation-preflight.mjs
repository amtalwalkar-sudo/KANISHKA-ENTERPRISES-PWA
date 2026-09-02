import {spawnSync} from 'node:child_process';

const gates=[
 ['Full Element-Wiring Verification','js/testing/foundation-preflight-element-wiring.mjs'],
 ['Cross-Module Integration Verification','js/testing/foundation-preflight-cross-module.mjs'],
 ['Accounting / Business-Rule Invariant Verification','js/testing/foundation-preflight-accounting-invariants.mjs']
];
const failures=[];
console.log('FOUNDATION_PREFLIGHT_START');
for(const [name,file] of gates){
 console.log(`FOUNDATION_PREFLIGHT_GATE_START=${name}`);
 const result=spawnSync(process.execPath,[file],{stdio:'inherit'});
 if(result.status!==0){failures.push(name);console.error(`FOUNDATION_PREFLIGHT_GATE_FAILED=${name}`);break;}
 console.log(`FOUNDATION_PREFLIGHT_GATE_PASS=${name}`);
}
if(failures.length){console.error('FOUNDATION_PREFLIGHT=FAIL');process.exit(1);}
console.log('FOUNDATION_PREFLIGHT=PASS');
