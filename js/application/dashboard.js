import {applicationContractByModuleId} from './module-contracts.js';
export const DASHBOARD_MODULE_ID='dashboard';
const SOURCES=Object.freeze(['work','fuel','expenses','revenue','maintenance','loan','renewals']);
export function dashboardApplicationContract(){const contract=applicationContractByModuleId(DASHBOARD_MODULE_ID);if(!contract)throw new Error('Dashboard application contract is unavailable');return contract;}
export function createDashboardApplicationBoundary({screens}={}){if(!screens||typeof screens!=='object')throw new Error('screens are required');for(const name of SOURCES)if(!screens[name]||typeof screens[name].getViewModel!=='function')throw new Error(`Dashboard source is unavailable: ${name}`);return Object.freeze({contract:dashboardApplicationContract(),get:()=>Object.fromEntries(SOURCES.map(name=>[name,screens[name].getViewModel()]))});}
export {SOURCES as DASHBOARD_SOURCES};
