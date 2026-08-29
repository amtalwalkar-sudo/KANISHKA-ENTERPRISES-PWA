import {applicationContractByModuleId} from './module-contracts.js';

export const LOAN_MODULE_ID='loans';

export function loanApplicationContract(){
  const contract=applicationContractByModuleId(LOAN_MODULE_ID);
  if(!contract) throw new Error('Loan application contract is unavailable');
  return contract;
}

export function createLoanApplicationBoundary({dispatch,query,paymentQuery,amortizationCalculator,prepaymentCalculator}={}){
  if(typeof dispatch!=='function'||typeof query!=='function') throw new Error('dispatch and query are required');
  return Object.freeze({
    contract:loanApplicationContract(),
    create:input=>dispatch({module:LOAN_MODULE_ID,type:'CREATE',input}),
    update:input=>dispatch({module:LOAN_MODULE_ID,type:'UPDATE',input}),
    get:id=>query({module:LOAN_MODULE_ID,type:'GET',id}),
    list:()=>query({module:LOAN_MODULE_ID,type:'LIST'}),
    listPayments:()=>{
      if(typeof paymentQuery!=='function') throw new Error('paymentQuery is unavailable');
      return paymentQuery({module:LOAN_MODULE_ID,type:'PAYMENT_LIST'});
    },
    calculateAmortization:input=>{
      if(typeof amortizationCalculator!=='function') throw new Error('amortizationCalculator is unavailable');
      return amortizationCalculator(input);
    },
    calculatePrepayment:input=>{
      if(typeof prepaymentCalculator!=='function') throw new Error('prepaymentCalculator is unavailable');
      return prepaymentCalculator(input);
    }
  });
}
