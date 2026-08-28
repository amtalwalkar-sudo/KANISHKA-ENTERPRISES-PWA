import {applicationContractByModuleId} from './module-contracts.js';

export const FUEL_MODULE_ID='fuel';

export function fuelApplicationContract(){
  const contract=applicationContractByModuleId(FUEL_MODULE_ID);
  if(!contract) throw new Error('Fuel application contract is unavailable');
  return contract;
}

export function createFuelApplicationBoundary({dispatch,query}={}){
  if(typeof dispatch!=='function'||typeof query!=='function') throw new Error('dispatch and query are required');
  return Object.freeze({
    contract:fuelApplicationContract(),
    create:input=>dispatch({module:FUEL_MODULE_ID,type:'CREATE',input}),
    update:input=>dispatch({module:FUEL_MODULE_ID,type:'UPDATE',input}),
    get:id=>query({module:FUEL_MODULE_ID,type:'GET',id}),
    list:()=>query({module:FUEL_MODULE_ID,type:'LIST'})
  });
}
