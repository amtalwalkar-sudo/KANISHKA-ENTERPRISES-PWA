import {createCalculationResult} from '../core/data-confidence.js';
export const DAY_MS=86400000;
export const CALCULATION_VERSION=1;
export const DATA={ACTUAL:'ACTUAL',BASELINE:'BASELINE',PROJECTED:'PROJECTED',PROVISION:'PROVISION',INSUFFICIENT_DATA:'INSUFFICIENT_DATA',UNKNOWN:'UNKNOWN',NOT_APPLICABLE:'NOT_APPLICABLE'};

export function paise(value){
  if(!Number.isSafeInteger(value))throw new TypeError('Currency must be a safe integer number of paise');
  return value;
}

export function km(value){if(!Number.isFinite(value)||value<0)throw new RangeError('KM must be non-negative');return value;}
export function iso(value){const d=new Date(value);if(!Number.isFinite(d.getTime()))throw new TypeError('Invalid timestamp');return d.toISOString();}
export function daysBetween(a,b){return Math.max(0,(Date.parse(iso(b))-Date.parse(iso(a)))/DAY_MS);}

// Financial results are rounded only at the final monetary boundary.
// Half-up rounding is implemented with integer arithmetic so no financial
// result depends on JavaScript floating-point Math.round semantics.
export function multiplyPaiseByRateRounded(amountPaise, rateNumerator, rateDenominator){
  paise(amountPaise);
  if(!Number.isSafeInteger(rateNumerator)||!Number.isSafeInteger(rateDenominator)||rateDenominator<=0)throw new RangeError('Invalid deterministic rate');
  const numerator=BigInt(amountPaise)*BigInt(rateNumerator);
  const denominator=BigInt(rateDenominator);
  const rounded=(numerator*2n+denominator)/(2n*denominator);
  if(rounded>BigInt(Number.MAX_SAFE_INTEGER))throw new RangeError('Currency result exceeds safe integer range');
  return Number(rounded);
}

export function dividePaiseByKm(paiseAmount,distanceKm,precisionScale=1000000000){
  paise(paiseAmount);
  if(!Number.isFinite(distanceKm)||distanceKm<=0)throw new RangeError('Distance must be positive');
  if(!Number.isSafeInteger(precisionScale)||precisionScale<=0)throw new RangeError('Invalid precision scale');
  return Number((BigInt(paiseAmount)*BigInt(precisionScale))/BigInt(Math.round(distanceKm)))/precisionScale;
}

export function roundInt(value){
  if(!Number.isFinite(value))throw new TypeError('Value must be finite');
  const sign=value<0?-1:1;const abs=Math.abs(value);const whole=Math.floor(abs);const fraction=abs-whole;
  return sign*(fraction>=0.5?whole+1:whole);
}

export function result(value,state,inputRefs=[],effectiveDate=null){return createCalculationResult({value,dataConfidenceState:state,calculationVersion:CALCULATION_VERSION,effectiveDate,inputRefs});}
export function sum(items,fn=x=>x){return items.reduce((a,x)=>a+fn(x),0);}
export function active(items){return (items||[]).filter(x=>!x?.is_deleted&&!x?.is_voided);}
export function effectiveConfig(configs,at){const t=iso(at);return active(configs).filter(c=>c.effective_from<=t&&(c.effective_to==null||t<c.effective_to)).sort((a,b)=>b.effective_from.localeCompare(a.effective_from))[0]||null;}
