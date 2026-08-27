import {result,DATA,paise,roundRational,decimalToFraction} from './shared.js';
export const LOAN_CALCULATION_VERSION=2;

export function amortize({principal_paise,annual_rate_percent,term_months,emi_paise}){
  paise(principal_paise);paise(emi_paise);
  if(principal_paise<0||!Number.isSafeInteger(term_months)||term_months<=0||!Number.isFinite(annual_rate_percent)||annual_rate_percent<0)throw new RangeError('Invalid loan terms');
  const rate=decimalToFraction(annual_rate_percent,'annual rate percent');
  let balance=principal_paise;const rows=[];
  for(let month=1;month<=term_months&&balance>0;month++){
    // Monthly interest = balance × annual percentage / 1200, rounded once at the financial boundary.
    const interest=roundRational(BigInt(balance)*rate.numerator,rate.denominator*1200n);
    const payment=Math.min(emi_paise,balance+interest);
    const principal=Math.min(balance,Math.max(0,payment-interest));
    balance-=principal;
    rows.push({month,payment_paise:payment,interest_paise:interest,principal_paise:principal,ending_balance_paise:balance});
  }
  return result(rows,DATA.BASELINE,[]);
}

export function applyPrepayment(outstandingPrincipalPaise,requestedPrepaymentPaise){
  paise(outstandingPrincipalPaise);paise(requestedPrepaymentPaise);
  const effective=Math.min(requestedPrepaymentPaise,outstandingPrincipalPaise);
  return result({requestedPrepaymentPaise,effectivePrepaymentPaise:effective,rejectedExcessPaise:requestedPrepaymentPaise-effective,remainingPrincipalPaise:outstandingPrincipalPaise-effective,status:effective>=outstandingPrincipalPaise?'COMPLETED':'ACTIVE'},DATA.ACTUAL,[]);
}

export function loanCashCost(principalPaise,interestPaise){
  return result(paise(principalPaise)+paise(interestPaise),DATA.ACTUAL,[]);
}
