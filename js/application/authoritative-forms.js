/**
 * KFE 2.0 authoritative form contract.
 *
 * Every driver-editable record type has ONE authoritative form definition.
 * The same form is used in CREATE and EDIT mode; edit mode is never a
 * second, duplicate form. Presentation surfaces may open the form, but they
 * do not own validation or persistence.
 */

export const FORM_MODES=Object.freeze(['CREATE','EDIT']);

export const AUTHORITATIVE_FORM_TYPES=Object.freeze([
  'WORK_SESSION',
  'BUSINESS_TRIP',
  'PERSONAL_TRIP',
  'BREAK',
  'FUEL',
  'REVENUE',
  'EXPENSE'
]);

export const AUTHORITATIVE_FORM_CONTRACT=Object.freeze({
  modeField:'mode',
  modes:FORM_MODES,
  requiredCapabilities:Object.freeze(['validate','save','update']),
  rules:Object.freeze({
    create:'CREATE creates a new authoritative record through the application boundary.',
    edit:'EDIT loads an existing authoritative record and updates that same record through the application boundary.',
    validation:'Business validation remains in the application/domain layer; forms may present validation state but may not redefine business calculations.',
    save:'CREATE uses the authoritative create operation.',
    update:'EDIT uses the authoritative update operation; it must not create a replacement record.',
    calculations:'All downstream read models and calculations continue to consume the authoritative record after save/update.',
    timeline:'Timeline may open an EDIT form for a historical record, but Timeline remains read-only and never persists changes itself.',
    work:'Work owns current operational entry flow and must not become a historical record-management screen.',
    more:'More remains administrative/back-office and is not required for normal driver operations.'
  })
});

export function assertFormMode(mode){
  if(!FORM_MODES.includes(mode))throw new RangeError(`Unsupported KFE form mode: ${mode}`);
  return mode;
}

export function createFormContext({type,mode='CREATE',record=null}={}){
  if(!AUTHORITATIVE_FORM_TYPES.includes(type))throw new RangeError(`Unsupported KFE form type: ${type}`);
  assertFormMode(mode);
  if(mode==='EDIT'&&(!record||!record.id))throw new TypeError('EDIT mode requires an existing authoritative record');
  return Object.freeze({type,mode,record:record||null});
}
