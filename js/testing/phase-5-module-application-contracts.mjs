import assert from 'node:assert/strict';
import {APPLICATION_MODULES} from '../application/module-registry.js';
import {MODULE_APPLICATION_CONTRACTS,applicationContractByModuleId} from '../application/module-contracts.js';

assert.equal(MODULE_APPLICATION_CONTRACTS.length,APPLICATION_MODULES.length);
for(const module of APPLICATION_MODULES){
  const contract=applicationContractByModuleId(module.id);
  assert.ok(contract,`missing contract for ${module.id}`);
  assert.equal(contract.module.id,module.id);
  assert.equal(contract.version,1);
  assert.ok(Array.isArray(contract.commands));
  assert.ok(Array.isArray(contract.queries));
  if(['profitability','dashboard'].includes(module.id)) assert.deepEqual(contract.commands,[]);
  else assert.deepEqual(contract.commands,['CREATE','UPDATE']);
  if(['profitability','dashboard'].includes(module.id)) assert.deepEqual(contract.queries,['GET']);
  else assert.deepEqual(contract.queries,['GET','LIST']);
}
assert.equal(applicationContractByModuleId('not-a-module'),null);
console.log('PHASE_5_MODULE_APPLICATION_CONTRACTS=PASS');
