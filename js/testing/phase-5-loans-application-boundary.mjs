import assert from 'node:assert/strict';
import {createLoanApplicationBoundary,LOAN_MODULE_ID} from '../application/loan-module.js';

const calls=[];
const boundary=createLoanApplicationBoundary({
  dispatch:command=>{calls.push(['dispatch',command]);return command;},
  query:request=>{calls.push(['query',request]);return request;}
});

assert.equal(boundary.contract.module.id,LOAN_MODULE_ID);
assert.deepEqual(boundary.create({}),{module:LOAN_MODULE_ID,type:'CREATE',input:{}});
assert.deepEqual(boundary.update({id:'loan-1'}),{module:LOAN_MODULE_ID,type:'UPDATE',input:{id:'loan-1'}});
assert.deepEqual(boundary.get('loan-1'),{module:LOAN_MODULE_ID,type:'GET',id:'loan-1'});
assert.deepEqual(boundary.list(),{module:LOAN_MODULE_ID,type:'LIST'});
assert.equal(calls.length,4);
assert.throws(()=>createLoanApplicationBoundary(),/dispatch and query are required/);
console.log('PHASE_5_LOANS_APPLICATION_BOUNDARY=PASS');
