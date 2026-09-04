import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createAdministratorApplication,ADMINISTRATOR_VEHICLE_SOURCES} from '../application/administrator.js';

const schema=readFileSync(new URL('../core/hardened-db.js',import.meta.url),'utf8');
assert.match(schema,/DB_VERSION\s*=\s*8\s*;/);
for(const store of ['vehicles','drivers','vehicle_driver_assignments','vehicle_odometer_readings','vehicle_disposal_records','vehicle_lifecycle_events'])assert.match(schema,new RegExp(`${store}\\s*:`));

const data=new Map();
function entity(name){
  if(!data.has(name))data.set(name,new Map());
  const map=data.get(name);
  return {async list(){return [...map.values()]},async get(id){return map.get(id)||null},async create(value){map.set(value.id,value);return value},async update(existing,changes){const next={...existing,...changes,updated_at:new Date().toISOString()};map.set(existing.id,next);return next}};
}
const repository={entity,async atomic(names,fn){const stores=Object.fromEntries(names.map(name=>[name,{put(value){if(!data.has(name))data.set(name,new Map());data.get(name).set(value.id,value)}}]));return fn(stores);}};
const app=createAdministratorApplication({repository});
const makeVehicle=async(registration,odometer=100)=>app.createVehicle({registration_number:registration,make:'Test',model:'Van',variant:'Diesel',fuel_type:'CNG',acquisition_date:'2026-09-04',acquisition_type:'USED',acquisition_odometer:odometer,acquisition_cost:500000});

const vehicle=await makeVehicle('MH 01 AB 1234',82450);
assert.equal(vehicle.current_odometer,82450);
assert.equal((await app.listOdometerHistory(vehicle.id))[0].source,'ACQUISITION');
assert.equal((await app.listVehicleLifecycleHistory(vehicle.id))[0].event_type,'ACQUISITION');
await assert.rejects(()=>app.createVehicle({registration_number:'mh 01 ab 1234',make:'Other',model:'Van',fuel_type:'CNG',acquisition_date:'2026-09-04',acquisition_type:'USED',acquisition_odometer:1}),/already exists/);
await assert.rejects(()=>app.recordOdometer({vehicle_id:vehicle.id,odometer:82000,source:'FUEL'}),/backwards/);
await app.recordOdometer({vehicle_id:vehicle.id,odometer:83000,source:'FUEL'});
assert.equal((await app.getVehicle(vehicle.id)).current_odometer,83000);
await assert.rejects(()=>app.recordOdometer({vehicle_id:vehicle.id,odometer:83001,source:'UNKNOWN'}),/Unknown odometer source/);

const driver=await app.createDriver({name:'Driver One',licence_number:'DL-123',licence_expiry:'2027-09-04'});
const assignment=await app.assignDriver({vehicle_id:vehicle.id,driver_id:driver.id,start_date:'2026-09-04'});
assert.equal(assignment.status,'ACTIVE');
const vehicle2=await makeVehicle('MH 02 CD 5678',100);
await assert.rejects(()=>app.assignDriver({vehicle_id:vehicle2.id,driver_id:driver.id,start_date:'2026-09-05'}),/Driver assignment dates overlap/);

const driver2=await app.createDriver({name:'Driver Two',licence_number:'DL-456'});
await assert.rejects(()=>app.assignDriver({vehicle_id:vehicle.id,driver_id:driver2.id,start_date:'2026-09-05'}),/Vehicle already has an active assignment/);
await assert.rejects(()=>app.closeAssignment(assignment.id,{end_date:'2026-09-03'}),/cannot be before Start Date/);

await app.reassignDriver({driver_id:driver.id,new_vehicle_id:vehicle2.id,start_date:'2026-09-10'});
const assignments=await app.listDriverAssignments(driver.id);
assert.equal(assignments.length,2);
assert.equal(assignments.find(x=>x.vehicle_id===vehicle.id).end_date,'2026-09-10');
assert.equal(assignments.find(x=>x.vehicle_id===vehicle2.id).status,'ACTIVE');

const vehicle3=await makeVehicle('MH 03 EF 9012',200);
await assert.rejects(()=>app.reassignDriver({driver_id:driver.id,new_vehicle_id:'missing',start_date:'2026-09-20'}),/Vehicle not found/);
const afterFailedReassignment=await app.listDriverAssignments(driver.id);
assert.equal(afterFailedReassignment.find(x=>x.vehicle_id===vehicle2.id).status,'ACTIVE');
assert.equal(afterFailedReassignment.find(x=>x.vehicle_id===vehicle2.id).end_date,null);

const beforeUpdate=await app.getVehicle(vehicle.id);
const updated=await app.updateVehicle(vehicle.id,{make:'Updated',lifecycle_status:'SOLD',current_odometer:999999,sale_amount_paise:1});
assert.equal(updated.make,'Updated');
assert.equal(updated.lifecycle_status,beforeUpdate.lifecycle_status);
assert.equal(updated.current_odometer,beforeUpdate.current_odometer);
assert.equal(updated.sale_amount_paise,beforeUpdate.sale_amount_paise);
await app.updateVehicle(vehicle.id,{acquisition_cost:510000});
assert.equal((await app.listVehicleLifecycleHistory(vehicle.id)).some(x=>x.event_type==='HISTORICAL_CORRECTION'),true);

await app.retireVehicle(vehicle3.id,{retirement_date:'2026-10-01',retirement_odometer:200,reason:'Retired'});
assert.equal((await app.getVehicle(vehicle3.id)).lifecycle_status,'RETIRED');
assert.equal((await app.listVehicleLifecycleHistory(vehicle3.id)).at(-1).event_type,'RETIREMENT');
await assert.rejects(()=>app.sellVehicle(vehicle3.id,{sale_date:'2026-09-30',sale_odometer:200,sale_amount:350000}),/cannot precede retirement date/);
await app.sellVehicle(vehicle3.id,{sale_date:'2026-10-05',sale_odometer:205,sale_amount:350000});
const sold=await app.getVehicle(vehicle3.id);
assert.equal(sold.lifecycle_status,'SOLD');
assert.equal(sold.sale_amount_paise,35000000);
const soldHistory=await app.listVehicleLifecycleHistory(vehicle3.id);
assert.deepEqual(soldHistory.map(x=>x.event_type),['ACQUISITION','RETIREMENT','SALE']);
assert.equal(soldHistory.at(-1).amount_paise,35000000);
assert.equal((await app.listVehicleDisposals()).some(x=>x.vehicle_id===vehicle3.id&&x.amount_paise===35000000),true);

const vehicle4=await makeVehicle('MH 04 GH 3456',300);
await app.transferVehicle(vehicle4.id,{transfer_date:'2026-11-01',transfer_odometer:310,transfer_amount:100000,transfer_reference:'TR-1'});
assert.equal((await app.getVehicle(vehicle4.id)).lifecycle_status,'TRANSFERRED');
assert.equal((await app.listVehicleLifecycleHistory(vehicle4.id)).at(-1).event_type,'TRANSFER');
await assert.rejects(()=>app.recordOdometer({vehicle_id:vehicle4.id,odometer:311,source:'FUEL'}),/left active use/);

data.clear();
const inactiveDriver=await app.createDriver({name:'Driver Three',licence_number:'DL-789'});
const vehicle5=await makeVehicle('MH 05 IJ 7890',400);
assert.equal((await app.listDriverAssignments(inactiveDriver.id)).length,0);
const a5=await app.assignDriver({vehicle_id:vehicle5.id,driver_id:inactiveDriver.id,start_date:'2026-09-04'});
await assert.rejects(()=>app.deactivateDriver(inactiveDriver.id,{date:'2026-09-03'}),/cannot be before Start Date/);
assert.equal((await app.getVehicle(vehicle5.id)).lifecycle_status,'ACTIVE');
assert.equal((await app.listVehicleAssignments(vehicle5.id)).find(x=>x.id===a5.id).status,'ACTIVE');
await app.deactivateDriver(inactiveDriver.id,{date:'2026-09-10',reason:'Left'});
const deactivatedAssignment=(await app.listVehicleAssignments(vehicle5.id)).find(x=>x.id===a5.id);
assert.equal(deactivatedAssignment.status,'INACTIVE');
assert.equal(deactivatedAssignment.end_date,'2026-09-10');
assert.equal((await app.getDriver(inactiveDriver.id)).status,'INACTIVE');

assert.equal(ADMINISTRATOR_VEHICLE_SOURCES.HISTORICAL_CORRECTION>ADMINISTRATOR_VEHICLE_SOURCES.WORK_SESSION,true);
console.log('Administrator vehicle/driver comprehensive contract: PASS');
