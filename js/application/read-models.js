import {DATA} from '../domain/shared.js';
export const PRESENTATION_READ_MODEL_VERSION=1;
function stateOf(value){if(value?.dataConfidenceState)return value.dataConfidenceState;return value==null?DATA.UNKNOWN:DATA.ACTUAL;}
export function confidenceState(values){const states=values.map(stateOf);if(states.includes(DATA.UNKNOWN))return DATA.UNKNOWN;if(states.includes(DATA.INSUFFICIENT_DATA))return DATA.INSUFFICIENT_DATA;if(states.includes(DATA.PROVISION))return DATA.PROVISION;if(states.includes(DATA.PROJECTED))return DATA.PROJECTED;if(states.includes(DATA.BASELINE))return DATA.BASELINE;return DATA.ACTUAL;}
export function dashboardReadModel({profitabilityResult,tomorrowTargetResult,alerts=[]}={}){return Object.freeze({version:PRESENTATION_READ_MODEL_VERSION,dataConfidenceState:confidenceState([profitabilityResult,tomorrowTargetResult]),profitability:profitabilityResult??null,tomorrowTarget:tomorrowTargetResult??null,alerts:Array.isArray(alerts)?Object.freeze([...alerts]):Object.freeze([])});}
export function workSessionReadModel(session){if(!session)return Object.freeze({dataConfidenceState:DATA.UNKNOWN,session:null});return Object.freeze({dataConfidenceState:stateOf(session),session:Object.freeze({...session})});}
export function presentationError(error){return Object.freeze({dataConfidenceState:DATA.UNKNOWN,error:String(error?.message||error||'Unknown error')});}
