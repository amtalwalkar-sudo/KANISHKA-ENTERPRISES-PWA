import {active,result,DATA,paise,dividePaiseByKm,roundInt} from './shared.js';
export const FUEL_CALCULATION_VERSION=1;
export const FUEL_RATE_PRECISION_SCALE=1000000000;

export function validateFuelRecord(r){
  if(!Number.isFinite(r.odometer)||r.odometer<0)throw new RangeError('Invalid fuel odometer');
  if(!Number.isFinite(r.litres)||r.litres<=0)throw new RangeError('Fuel litres must be positive');
  paise(r.amount_paise);
  if(typeof r.is_full_tank!=='boolean')throw new TypeError('is_full_tank is required');
  return true;
}

/**
 * Rule 1 clean-room calculation:
 * valid full-tank intervals -> individual Cost/KM observations -> average.
 * A partial fill remains financial data but never enters this dataset.
 * The first full-tank fill establishes a baseline and therefore cannot itself
 * form an efficiency observation.
 */
export function rollingFuelCostPerKm(fuelRecords,windowSize=5){
  const n=Math.max(3,Math.min(5,Number(windowSize)));
  const fills=active(fuelRecords)
    .filter(r=>r.is_full_tank)
    .sort((a,b)=>a.odometer-b.odometer);

  const observations=[];
  for(let i=1;i<fills.length;i++){
    const current=fills[i];
    const previous=fills[i-1];
    const distance=current.odometer-previous.odometer;
    if(!Number.isFinite(distance)||distance<=0)continue;
    observations.push({
      id:current.id,
      baselineId:previous.id,
      distanceKm:distance,
      costPaise:paise(current.amount_paise),
      costPerKm:dividePaiseByKm(current.amount_paise,distance,FUEL_RATE_PRECISION_SCALE)
    });
  }

  const latest=observations.slice(-n);
  if(latest.length<n)return result(null,DATA.INSUFFICIENT_DATA,fills.map(r=>r.id));

  const rollingAverage=latest.reduce((sum,observation)=>sum+observation.costPerKm,0)/latest.length;
  return result(
    rollingAverage,
    DATA.ACTUAL,
    latest.flatMap(o=>[o.id,o.baselineId])
  );
}

export function projectedFuelCostForKm(fuelRecords,tomorrowKm,windowSize=5){
  if(!Number.isFinite(tomorrowKm)||tomorrowKm<0)throw new RangeError('Tomorrow KM must be non-negative');
  const r=rollingFuelCostPerKm(fuelRecords,windowSize);
  if(r.value==null)return result(null,DATA.INSUFFICIENT_DATA,r.inputRefs);
  return result(roundInt(r.value*tomorrowKm),DATA.PROJECTED,r.inputRefs);
}
