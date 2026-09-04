import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const administratorSource=await readFile(new URL('../application/administrator.js',import.meta.url),'utf8');
const uiShellSource=await readFile(new URL('../ui-shell.js',import.meta.url),'utf8');

// Vehicle/Driver business rules must not depend on browser/UI concerns.
for(const forbidden of [
  /\b(?:window|document|HTMLElement|CustomEvent|localStorage|sessionStorage|indexedDB|navigator)\b/,
  /(?:from|import)\s*["'][^"']*(?:\/ui\/|ui-shell|src\/)[^"']*["']/
]){
  assert.equal(forbidden.test(administratorSource),false,`Vehicle/Driver application is coupled to UI/browser concern: ${forbidden}`);
}

// The UI shell may consume application/view-model APIs, but Vehicle/Driver application
// code must never be imported by the shell itself. This keeps the shell replaceable.
assert.equal(/(?:from|import)\s*["'][^"']*application\/administrator\.js["']/.test(uiShellSource),false,'UI shell imports Vehicle/Driver administrator logic directly');
assert.equal(/(?:from|import)\s*["'][^"']*application\/vehicle-module\.js["']/.test(uiShellSource),false,'UI shell imports Vehicle application logic directly');

// Prove the Vehicle/Driver application can be instantiated in a plain Node runtime
// with a repository contract and without browser globals.
const {createAdministratorApplication}=await import('../application/administrator.js');
const maps=new Map();
const entity=name=>{if(!maps.has(name))maps.set(name,new Map());const map=maps.get(name);return {async list(){return [...map.values()]},async get(id){return map.get(id)||null},async create(value){map.set(value.id,value);return value},async update(existing,changes){const next={...existing,...changes};map.set(existing.id,next);return next}}};
const repository={entity,async atomic(names,fn){const stores=Object.fromEntries(names.map(name=>[name,{put(value){if(!maps.has(name))maps.set(name,new Map());maps.get(name).set(value.id,value)}}]));return fn(stores)}};
const app=createAdministratorApplication({repository});
const vehicle=await app.createVehicle({registration_number:'MH 01 UI 0001',make:'Decoupled',model:'Test',fuel_type:'CNG',acquisition_date:'2026-09-04',acquisition_type:'NEW',acquisition_odometer:0,acquisition_cost:1});
assert.equal(vehicle.lifecycle_status,'ACTIVE');
const driver=await app.createDriver({name:'Decoupled Driver',licence_number:'DL-UI-0001'});
const assignment=await app.assignDriver({vehicle_id:vehicle.id,driver_id:driver.id,start_date:'2026-09-04'});
assert.equal(assignment.status,'ACTIVE');

console.log('VEHICLE_DRIVER_UI_DECOUPLING=PASS');
