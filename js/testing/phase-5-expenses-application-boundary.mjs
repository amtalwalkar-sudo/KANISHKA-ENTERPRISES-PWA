import assert from 'node:assert/strict';
import {createExpenseApplicationBoundary,EXPENSE_MODULE_ID} from '../application/expense-module.js';

const calls=[];
const boundary=createExpenseApplicationBoundary({
  dispatch:command=>{calls.push(['dispatch',command]);return command;},
  query:request=>{calls.push(['query',request]);return request;}
});

assert.equal(boundary.contract.module.id,EXPENSE_MODULE_ID);
assert.deepEqual(boundary.create({}),{module:EXPENSE_MODULE_ID,type:'CREATE',input:{}});
assert.deepEqual(boundary.update({id:'expense-1'}),{module:EXPENSE_MODULE_ID,type:'UPDATE',input:{id:'expense-1'}});
assert.deepEqual(boundary.get('expense-1'),{module:EXPENSE_MODULE_ID,type:'GET',id:'expense-1'});
assert.deepEqual(boundary.list(),{module:EXPENSE_MODULE_ID,type:'LIST'});
assert.equal(calls.length,4);
assert.throws(()=>createExpenseApplicationBoundary(),/dispatch and query are required/);
console.log('PHASE_5_EXPENSES_APPLICATION_BOUNDARY=PASS');
