import assert from 'node:assert/strict';
import {createVehicleApplicationBoundary,VEHICLE_MODULE_ID} from '../application/vehicle-module.js';

const calls=[];
const boundary=createVehicleApplicationBoundary({
  dispatch:command=>{calls.push(['dispatch',command]);return command;},
  query:request=>{calls.push(['query',request]);return request;}
});

assert.equal(boundary.contract.module.id,VEHICLE_MODULE_ID);
assert.deepEqual(boundary.create({}),{module:VEHICLE_MODULE_ID,type:'CREATE',input:{}});
assert.deepEqual(boundary.update({id:'vehicle-1'}),{module:VEHICLE_MODULE_ID,type:'UPDATE',input:{id:'vehicle-1'}});
assert.deepEqual(boundary.get('vehicle-1'),{module:VEHICLE_MODULE_ID,type:'GET',id:'vehicle-1'});
assert.deepEqual(boundary.list(),{module:VEHICLE_MODULE_ID,type:'LIST'});
assert.equal(calls.length,4);
assert.throws(()=>createVehicleApplicationBoundary(),/dispatch and query are required/);
console.log('PHASE_5_VEHICLE_APPLICATION_BOUNDARY=PASS');
