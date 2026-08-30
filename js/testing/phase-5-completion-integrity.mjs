import assert from 'node:assert/strict';
import {applicationContractByModuleId} from '../application/module-contracts.js';
const modules=['vehicle','fuel','expenses','revenue','loans','renewals-compliance','maintenance','profitability','dashboard'];
for(const id of modules){const c=applicationContractByModuleId(id);assert.ok(c,`Missing canonical contract: ${id}`);assert.equal(c.module.id,id);}
for(const id of ['profitability','dashboard']){const c=applicationContractByModuleId(id);assert.equal(c.module.commands.length,0);assert.deepEqual(c.queries,['GET']);}
console.log('PHASE_5_COMPLETION_INTEGRITY=PASS');
