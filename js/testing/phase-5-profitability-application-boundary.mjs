import assert from 'node:assert/strict';
import {createProfitabilityApplicationBoundary,PROFITABILITY_MODULE_ID} from '../application/basic-profitability.js';
const calls=[];const boundary=createProfitabilityApplicationBoundary({query:request=>{calls.push(request);return request;}});
assert.equal(boundary.contract.module.id,PROFITABILITY_MODULE_ID);
assert.deepEqual(boundary.get({period:'test'}),{module:PROFITABILITY_MODULE_ID,type:'GET',input:{period:'test'}});
assert.equal(calls.length,1);
assert.throws(()=>createProfitabilityApplicationBoundary(),/query is required/);
assert.equal(Object.keys(boundary).sort().join(','),'contract,get');
console.log('PHASE_5_BASIC_PROFITABILITY_APPLICATION_BOUNDARY=PASS');
