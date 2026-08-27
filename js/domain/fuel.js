import {active,result,DATA,paise,paisePerKmRate,averageRates,multiplyRateByKm} from './shared.js';
export const FUEL_CALCULATION_VERSION=2;

export function validateFuelRecord(r){
  if(!Number.isSafeInteger(r.odometer)||r.odometer<0)throw new RangeError('Invalid fuel odometer');
  if(!Number.isFinite(r.litres)||r.litres<=0)throw new RangeError('Fuel litres must be positive');
  paise(r.amount_paise);
  if(typeof r.is_full_tank!=='boolean')throw new TypeError('is_full_tank is required');
  return true;
}

export function rollingFuelCostPerKm(fuelRecords,windowSize=5){
  const n=Math.max(3,Math.min(5,Math.trunc(windowSize)));
  const rows=active(fuelRecords).filter(r=>r.is_full_tank).sort((a,b)=>a.odometer-b.odometer||String(a.id).localeCompare(String(b.id)));
  if(rows.length<n+1)return result(null,DATA.INSUFFICIENT_DATA,rows.map(r=>r.id));
  const fills=rows.slice(-(n+1));
  const observations=[];
  const refs=[];
  for(let i=1;i<fills.length;i++){
    const cur=fills[i],prev=fills[i-1];
    validateFuelRecord(cur);validateFuelRecord(prev);
    const distance=cur.odometer-prev.odometer;
    if(distance<=0)continue;
    observations.push(paisePerKmRate(cur.amount_paise,distance));
    refs.push(prev.id,cur.id);
  }
  if(observations.length<n)return result(null,DATA.INSUFFICIENT_DATA,[...new Set(refs)]);
  return result(averageRates(observations),DATA.ACTUAL,[...new Set(refs)]);
}

export function projectedFuelCostForKm(fuelRecords,tomorrowKm,windowSize=5){
  if(!Number.isSafeInteger(tomorrowKm)||tomorrowKm<0)throw new RangeError('Tomorrow KM must be a non-negative safe integer');
  const r=rollingFuelCostPerKm(fuelRecords,windowSize);
  if(r.value==null)return result(null,DATA.INSUFFICIENT_DATA,r.inputRefs);
  return result(multiplyRateByKm(r.value,tomorrowKm),DATA.PROJECTED,r.inputRefs);
}
