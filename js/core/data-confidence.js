// KFE foundation contract: calculation outputs must carry explicit data confidence.
// This module contains no business formulas. It only defines the result contract.
export const DATA_CONFIDENCE_STATES=Object.freeze([
  'ACTUAL',
  'BASELINE',
  'PROJECTED',
  'PROVISION',
  'INSUFFICIENT_DATA',
  'UNKNOWN',
  'NOT_APPLICABLE'
]);

export function isDataConfidenceState(value){return DATA_CONFIDENCE_STATES.includes(value);}

export function createCalculationResult({value,dataConfidenceState,calculationVersion,effectiveDate=null,inputRefs=[]}={}){
  if(!isDataConfidenceState(dataConfidenceState)){
    throw new TypeError('KFE calculation result requires a valid dataConfidenceState');
  }
  if(!Number.isInteger(calculationVersion)||calculationVersion<1){
    throw new TypeError('KFE calculation result requires a positive calculationVersion');
  }
  return Object.freeze({
    value,
    dataConfidenceState,
    calculationVersion,
    effectiveDate,
    inputRefs:Object.freeze([...inputRefs])
  });
}

export function assertCalculationResult(result){
  if(!result||!isDataConfidenceState(result.dataConfidenceState)||!Number.isInteger(result.calculationVersion)){
    throw new TypeError('Invalid KFE calculation result contract');
  }
  return result;
}
