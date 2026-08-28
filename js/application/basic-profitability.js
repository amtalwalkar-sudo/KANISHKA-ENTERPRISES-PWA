import {applicationContractByModuleId} from './module-contracts.js';
export const PROFITABILITY_MODULE_ID='profitability';
export function profitabilityApplicationContract(){const contract=applicationContractByModuleId(PROFITABILITY_MODULE_ID);if(!contract)throw new Error('Profitability application contract is unavailable');return contract;}
export function createProfitabilityApplicationBoundary({query}={}){if(typeof query!=='function')throw new Error('query is required');return Object.freeze({contract:profitabilityApplicationContract(),get:input=>query({module:PROFITABILITY_MODULE_ID,type:'GET',input})});}
