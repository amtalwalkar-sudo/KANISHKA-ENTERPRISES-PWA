import assert from 'node:assert/strict';
import {createRevenueApplicationBoundary,REVENUE_MODULE_ID} from '../application/revenue-module.js';

const calls=[];
const boundary=createRevenueApplicationBoundary({
  dispatch:command=>{calls.push(['dispatch',command]);return command;},
  query:request=>{calls.push(['query',request]);return request;}
});

assert.equal(boundary.contract.module.id,REVENUE_MODULE_ID);
assert.deepEqual(boundary.create({}),{module:REVENUE_MODULE_ID,type:'CREATE',input:{}});
assert.deepEqual(boundary.update({id:'revenue-1'}),{module:REVENUE_MODULE_ID,type:'UPDATE',input:{id:'revenue-1'}});
assert.deepEqual(boundary.get('revenue-1'),{module:REVENUE_MODULE_ID,type:'GET',id:'revenue-1'});
assert.deepEqual(boundary.list(),{module:REVENUE_MODULE_ID,type:'LIST'});
assert.equal(calls.length,4);
assert.throws(()=>createRevenueApplicationBoundary(),/dispatch and query are required/);
console.log('PHASE_5_REVENUE_APPLICATION_BOUNDARY=PASS');
