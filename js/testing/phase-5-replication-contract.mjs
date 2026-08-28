import assert from 'node:assert/strict';
import {APPLICATION_MODULES} from '../application/module-registry.js';
import {createModuleReplicationContract,isModuleReplicationContract,MODULE_REPLICATION_CONTRACT_VERSION,MODULE_REPLICATION_STAGES} from '../application/module-replication-contract.js';

assert.equal(APPLICATION_MODULES.length,10);
for(const module of APPLICATION_MODULES){
  const contract=createModuleReplicationContract(module.id);
  assert.equal(contract.version,MODULE_REPLICATION_CONTRACT_VERSION);
  assert.equal(isModuleReplicationContract(contract),true);
  assert.deepEqual(contract.stages,[...MODULE_REPLICATION_STAGES]);
}
assert.throws(()=>createModuleReplicationContract(''),/moduleId is required/);
assert.equal(isModuleReplicationContract({version:1,moduleId:'x',stages:['PRESENTATION']}),false);
console.log('PHASE_5_REPLICATION_CONTRACT=PASS');
