// Loan-owned calculations. No imports from other screens.
export function calculateMonthlyInterest(principal,annualRate){
  if(!Number.isFinite(principal)||!Number.isFinite(annualRate)||principal<0)return 0;
  return principal*(annualRate/100)/12;
}

export function calculateEmi(principal,annualRate,months){
  if(!Number.isFinite(principal)||!Number.isFinite(annualRate)||!Number.isFinite(months)||principal<=0||months<=0)return 0;
  const r=(annualRate/100)/12;
  if(r===0)return principal/months;
  return principal*r*Math.pow(1+r,months)/(Math.pow(1+r,months)-1);
}

export function allocatePayment(principal,annualRate,payment){
  const interest=calculateMonthlyInterest(principal,annualRate);
  const amount=Number.isFinite(payment)&&payment>0?payment:0;
  return {interest,principal:Math.max(0,amount-interest)};
}
