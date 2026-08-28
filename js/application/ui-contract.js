export const UI_CONTRACT_VERSION=1;

const commandNames=new Set(['SELECT_MODULE','RETRY','START_SHIFT','END_SHIFT','START_TRIP','END_TRIP','START_PERSONAL_TRIP','END_PERSONAL_TRIP']);

export function createUiCommand(type,payload={}){
  if(!commandNames.has(type)) throw new Error(`Unsupported UI command: ${type}`);
  return Object.freeze({version:UI_CONTRACT_VERSION,type,payload:Object.freeze({...payload})});
}

export function isUiCommand(value){return Boolean(value&&value.version===UI_CONTRACT_VERSION&&commandNames.has(value.type)&&value.payload&&typeof value.payload==='object');}

export function createPresentationState(viewModel){
  if(viewModel==null) return Object.freeze({version:UI_CONTRACT_VERSION,dataConfidenceState:'UNKNOWN',value:null});
  return Object.freeze({version:UI_CONTRACT_VERSION,dataConfidenceState:viewModel.dataConfidenceState||'UNKNOWN',value:viewModel});
}
