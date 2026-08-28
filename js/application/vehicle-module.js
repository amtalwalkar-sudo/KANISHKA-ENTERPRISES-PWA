import {applicationContractByModuleId} from './module-contracts.js';

export const VEHICLE_MODULE_ID='vehicle';

export function vehicleApplicationContract(){
  const contract=applicationContractByModuleId(VEHICLE_MODULE_ID);
  if(!contract) throw new Error('Vehicle application contract is unavailable');
  return contract;
}

export function createVehicleApplicationBoundary({dispatch,query}={}){
  if(typeof dispatch!=='function'||typeof query!=='function') throw new Error('dispatch and query are required');
  return Object.freeze({
    contract:vehicleApplicationContract(),
    create:input=>dispatch({module:VEHICLE_MODULE_ID,type:'CREATE',input}),
    update:input=>dispatch({module:VEHICLE_MODULE_ID,type:'UPDATE',input}),
    get:id=>query({module:VEHICLE_MODULE_ID,type:'GET',id}),
    list:()=>query({module:VEHICLE_MODULE_ID,type:'LIST'})
  });
}
