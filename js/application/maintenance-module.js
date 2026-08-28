import {applicationContractByModuleId} from './module-contracts.js';

export const MAINTENANCE_MODULE_ID='maintenance';

export function maintenanceApplicationContract(){
  const contract=applicationContractByModuleId(MAINTENANCE_MODULE_ID);
  if(!contract) throw new Error('Maintenance application contract is unavailable');
  return contract;
}

export function createMaintenanceApplicationBoundary({dispatch,query}={}){
  if(typeof dispatch!=='function'||typeof query!=='function') throw new Error('dispatch and query are required');
  return Object.freeze({
    contract:maintenanceApplicationContract(),
    create:input=>dispatch({module:MAINTENANCE_MODULE_ID,type:'CREATE',input}),
    update:input=>dispatch({module:MAINTENANCE_MODULE_ID,type:'UPDATE',input}),
    get:id=>query({module:MAINTENANCE_MODULE_ID,type:'GET',id}),
    list:()=>query({module:MAINTENANCE_MODULE_ID,type:'LIST'})
  });
}
