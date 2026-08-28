import assert from 'node:assert/strict';
import {APPLICATION_MODULES} from '../application/module-registry.js';
import {MODULE_APPLICATION_CONTRACTS,applicationContractByModuleId} from '../application/module-contracts.js';

assert.equal(MODULE_APPLICATION_CONTRACTS.length,APPLICATION_MODULES.length);
for(const module of APPLICATION_MODULES){
  const contract=applicationContractByModuleId(module.id);
  assert.ok(contract,`missing contract for ${module.id}`);
  assert.equal(contract.module.id,module.id);
  assert.equal(contract.version,1);
  assert.deepEqual(contract.commands,[]);
  assert.deepEqual(contract.queries,[]);
}
assert.equal(applicationContractByModuleId('not-a-module'),null);
console.log('PHASE_5_MODULE_APPLICATION_CONTRACTS=PASS');
