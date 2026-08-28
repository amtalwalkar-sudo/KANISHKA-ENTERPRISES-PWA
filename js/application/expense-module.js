import {applicationContractByModuleId} from './module-contracts.js';

export const EXPENSE_MODULE_ID='expenses';

export function expenseApplicationContract(){
  const contract=applicationContractByModuleId(EXPENSE_MODULE_ID);
  if(!contract) throw new Error('Expenses application contract is unavailable');
  return contract;
}

export function createExpenseApplicationBoundary({dispatch,query}={}){
  if(typeof dispatch!=='function'||typeof query!=='function') throw new Error('dispatch and query are required');
  return Object.freeze({
    contract:expenseApplicationContract(),
    create:input=>dispatch({module:EXPENSE_MODULE_ID,type:'CREATE',input}),
    update:input=>dispatch({module:EXPENSE_MODULE_ID,type:'UPDATE',input}),
    get:id=>query({module:EXPENSE_MODULE_ID,type:'GET',id}),
    list:()=>query({module:EXPENSE_MODULE_ID,type:'LIST'})
  });
}
