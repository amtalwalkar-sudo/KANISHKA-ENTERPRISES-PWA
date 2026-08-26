import {calculateMonthlyInterest,calculateEmi,allocatePayment} from '../domain/loan.js';
export function createLoanScreen({state}){
  return {getViewModel(){const s=state.get('loan')||{};const principal=Number(s.principal)||0;const rate=Number(s.annualRate)||0;const months=Number(s.months)||0;const payment=Number(s.payment)||0;return {principal,annualRate:rate,months,monthlyInterest:calculateMonthlyInterest(principal,rate),emi:calculateEmi(principal,rate,months),paymentAllocation:allocatePayment(principal,rate,payment)};}};
}
