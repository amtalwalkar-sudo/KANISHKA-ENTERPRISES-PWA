import {applicationContractByModuleId} from './module-contracts.js';

export const LOAN_MODULE_ID='loans';

export function loanApplicationContract(){
  const contract=applicationContractByModuleId(LOAN_MODULE_ID);
  if(!contract) throw new Error('Loan application contract is unavailable');
  return contract;
}

export function createLoanApplicationBoundary({dispatch,query}={}){
  if(typeof dispatch!=='function'||typeof query!=='function') throw new Error('dispatch and query are required');
  return Object.freeze({
    contract:loanApplicationContract(),
    create:input=>dispatch({module:LOAN_MODULE_ID,type:'CREATE',input}),
    update:input=>dispatch({module:LOAN_MODULE_ID,type:'UPDATE',input}),
    get:id=>query({module:LOAN_MODULE_ID,type:'GET',id}),
    list:()=>query({module:LOAN_MODULE_ID,type:'LIST'})
  });
}
