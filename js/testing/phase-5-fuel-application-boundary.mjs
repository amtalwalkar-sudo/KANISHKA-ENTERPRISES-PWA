import assert from 'node:assert/strict';
import {createFuelApplicationBoundary,FUEL_MODULE_ID} from '../application/fuel-module.js';

const calls=[];
const boundary=createFuelApplicationBoundary({
  dispatch:command=>{calls.push(['dispatch',command]);return command;},
  query:request=>{calls.push(['query',request]);return request;}
});

assert.equal(boundary.contract.module.id,FUEL_MODULE_ID);
assert.deepEqual(boundary.create({}),{module:FUEL_MODULE_ID,type:'CREATE',input:{}});
assert.deepEqual(boundary.update({id:'fuel-1'}),{module:FUEL_MODULE_ID,type:'UPDATE',input:{id:'fuel-1'}});
assert.deepEqual(boundary.get('fuel-1'),{module:FUEL_MODULE_ID,type:'GET',id:'fuel-1'});
assert.deepEqual(boundary.list(),{module:FUEL_MODULE_ID,type:'LIST'});
assert.equal(calls.length,4);
assert.throws(()=>createFuelApplicationBoundary(),/dispatch and query are required/);
console.log('PHASE_5_FUEL_APPLICATION_BOUNDARY=PASS');
