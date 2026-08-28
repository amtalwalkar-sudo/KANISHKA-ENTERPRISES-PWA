import {applicationContractByModuleId} from './module-contracts.js';

export const REVENUE_MODULE_ID='revenue';

export function revenueApplicationContract(){
  const contract=applicationContractByModuleId(REVENUE_MODULE_ID);
  if(!contract) throw new Error('Revenue application contract is unavailable');
  return contract;
}

export function createRevenueApplicationBoundary({dispatch,query}={}){
  if(typeof dispatch!=='function'||typeof query!=='function') throw new Error('dispatch and query are required');
  return Object.freeze({
    contract:revenueApplicationContract(),
    create:input=>dispatch({module:REVENUE_MODULE_ID,type:'CREATE',input}),
    update:input=>dispatch({module:REVENUE_MODULE_ID,type:'UPDATE',input}),
    get:id=>query({module:REVENUE_MODULE_ID,type:'GET',id}),
    list:()=>query({module:REVENUE_MODULE_ID,type:'LIST'})
  });
}
