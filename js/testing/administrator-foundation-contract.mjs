import assert from 'node:assert/strict';
import {createAdministratorApplication,ADMINISTRATOR_VEHICLE_SOURCES} from '../application/administrator.js';
const data=new Map();
function entity(name){if(!data.has(name))data.set(name,new Map());const map=data.get(name);return {async list(){return [...map.values()]},async get(id){return map.get(id)||null},async create(value){map.set(value.id,value);return value},async update(existing,changes){const next={...existing,...changes,updated_at:new Date().toISOString()};map.set(existing.id,next);return next}}}
const repository={entity,async atomic(names,fn){const stores=Object.fromEntries(names.map(name=>[name,{put(value){data.get(name)||data.set(name,new Map());data.get(name).set(value.id,value);}}]));return fn(stores)}};
const app=createAdministratorApplication({repository});
const vehicle=await app.createVehicle({registration_number:'MH 01 AB 1234',make:'Test',model:'Van',variant:'Diesel',fuel_type:'CNG',acquisition_date:'2026-09-04',acquisition_type:'USED',acquisition_odometer:82450,acquisition_cost:500000});
assert.equal(vehicle.current_odometer,82450);assert.equal((await app.listOdometerHistory(vehicle.id))[0].source,'ACQUISITION');
await assert.rejects(()=>app.createVehicle({registration_number:'mh 01 ab 1234',make:'Other',model:'Van',fuel_type:'CNG',acquisition_date:'2026-09-04',acquisition_type:'USED',acquisition_odometer:1}),/already exists/);
await assert.rejects(()=>app.recordOdometer({vehicle_id:vehicle.id,odometer:82000,source:'FUEL'}),/backwards/);
await app.recordOdometer({vehicle_id:vehicle.id,odometer:83000,source:'FUEL'});assert.equal((await app.getVehicle(vehicle.id)).current_odometer,83000);
const driver=await app.createDriver({name:'Driver One',licence_number:'DL-123',licence_expiry:'2027-09-04'});
const assignment=await app.assignDriver({vehicle_id:vehicle.id,driver_id:driver.id,start_date:'2026-09-04'});assert.equal(assignment.status,'ACTIVE');
await assert.rejects(()=>app.assignDriver({vehicle_id:vehicle.id,driver_id:driver.id,start_date:'2026-09-05'}),/active vehicle assignment/);
const vehicle2=await app.createVehicle({registration_number:'MH 02 CD 5678',make:'Test',model:'Van',fuel_type:'CNG',acquisition_date:'2026-09-04',acquisition_type:'USED',acquisition_odometer:100});
await app.reassignDriver({driver_id:driver.id,new_vehicle_id:vehicle2.id,start_date:'2026-09-10'});assert.equal((await app.listDriverAssignments(driver.id)).length,2);
await app.sellVehicle(vehicle.id,{sale_date:'2026-10-01',sale_odometer:83000,sale_amount:350000});assert.equal((await app.getVehicle(vehicle.id)).sale_amount_paise,35000000);
assert.equal(ADMINISTRATOR_VEHICLE_SOURCES.HISTORICAL_CORRECTION>ADMINISTRATOR_VEHICLE_SOURCES.WORK_SESSION,true);
console.log('Administrator vehicle/driver contract: PASS');
