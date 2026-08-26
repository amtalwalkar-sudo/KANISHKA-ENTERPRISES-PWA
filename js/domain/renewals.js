// Renewals/compliance-owned calculations. No imports from other screens.
export function daysUntilExpiry(expiryMs,nowMs=Date.now()){
  if(!Number.isFinite(expiryMs)||!Number.isFinite(nowMs))return null;
  return Math.ceil((expiryMs-nowMs)/86400000);
}

export function renewalStatus(expiryMs,nowMs=Date.now(),warningDays=30){
  const days=daysUntilExpiry(expiryMs,nowMs);
  if(days===null)return 'unknown';
  if(days<0)return 'expired';
  if(days<=warningDays)return 'due-soon';
  return 'valid';
}
