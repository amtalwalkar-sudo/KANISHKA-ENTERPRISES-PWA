import {createCalculationResult} from '../core/data-confidence.js';
import {paise,roundRational,addPaise,subtractPaise,multiplyPaiseByRatio,paisePerKmRate,averageRates,multiplyRateByKm} from '../core/arithmetic.js';
export const DAY_MS=86400000;
export const CALCULATION_VERSION=2;
export const DATA={ACTUAL:'ACTUAL',BASELINE:'BASELINE',PROJECTED:'PROJECTED',PROVISION:'PROVISION',INSUFFICIENT_DATA:'INSUFFICIENT_DATA',UNKNOWN:'UNKNOWN',NOT_APPLICABLE:'NOT_APPLICABLE'};
export {paise,roundRational,addPaise,subtractPaise,multiplyPaiseByRatio,paisePerKmRate,averageRates,multiplyRateByKm};
export function km(value){if(!Number.isSafeInteger(value)||value<0)throw new RangeError('KM must be a non-negative safe integer');return value;}
export function iso(value){const d=new Date(value);if(!Number.isFinite(d.getTime()))throw new TypeError('Invalid timestamp');return d.toISOString();}
export function daysBetween(a,b){return Math.max(0,(Date.parse(iso(b))-Date.parse(iso(a)))/DAY_MS);}
export function result(value,state,inputRefs=[],effectiveDate=null){return createCalculationResult({value,dataConfidenceState:state,calculationVersion:CALCULATION_VERSION,effectiveDate,inputRefs});}
export function sum(items,fn=x=>x){return items.reduce((a,x)=>a+fn(x),0);}
export function active(items){return (items||[]).filter(x=>!x?.is_deleted&&!x?.is_voided);}
export function effectiveConfig(configs,at){const t=iso(at);return active(configs).filter(c=>c.effective_from<=t&&(c.effective_to==null||t<c.effective_to)).sort((a,b)=>b.effective_from.localeCompare(a.effective_from))[0]||null;}
