import assert from 'node:assert/strict';
import {APPLICATION_MODULES,moduleById,moduleByRoute} from '../application/module-registry.js';

const expected=['vehicle','work-sessions','fuel','expenses','revenue','loans','renewals-compliance','maintenance','profitability','dashboard'];
assert.deepEqual(APPLICATION_MODULES.map(module=>module.id),expected);
assert.equal(new Set(APPLICATION_MODULES.map(module=>module.id)).size,expected.length);
assert.equal(new Set(APPLICATION_MODULES.map(module=>module.route)).size,expected.length);
for(const module of APPLICATION_MODULES){
  assert.ok(module.label);
  assert.ok(module.route);
  assert.equal(moduleById(module.id),module);
  assert.equal(moduleByRoute(module.route),module);
  assert.equal(Object.isFrozen(module),true);
}
assert.equal(moduleById('not-a-module'),null);
assert.equal(moduleByRoute('not-a-route'),null);
assert.equal(Object.isFrozen(APPLICATION_MODULES),true);
console.log('PHASE_5_MODULE_EXPANSION=PASS');
