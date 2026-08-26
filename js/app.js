import {createStore} from './core/store.js';
import {createRepository} from './core/repository.js';
import {createNetworkManager} from './core/network.js';
import {createWorkScreen} from './screens/work.js';
import {createFuelScreen} from './screens/fuel.js';
import {createExpensesScreen} from './screens/expenses.js';
import {createRevenueScreen} from './screens/revenue.js';
import {createMaintenanceScreen} from './screens/maintenance.js';
import {createLoanScreen} from './screens/loan.js';
import {createRenewalsScreen} from './screens/renewals.js';
import {createDashboardAggregator} from './dashboard/aggregator.js';
import {installCrashBuffer} from './pwa/crash-buffer.js';
import {initializeResilience} from './core/resilience.js';
import {createCoreLoop} from './services/core-loop.js';

const initialState={work:{onDuty:false},fuel:{},expenses:{items:[]},revenue:{items:[]},maintenance:{},loan:{},renewals:{}};
const noTransport=async payload=>{throw new Error(`No remote transport configured for outbox item: ${payload?.type||'unknown'}`);};
export const repository=createRepository({initial:initialState});
export const state=createStore(initialState,repository);
installCrashBuffer();

export const screens={
  work:createWorkScreen({state}),fuel:createFuelScreen({state}),expenses:createExpensesScreen({state}),
  revenue:createRevenueScreen({state}),maintenance:createMaintenanceScreen({state}),loan:createLoanScreen({state}),renewals:createRenewalsScreen({state})
};
export const dashboard=createDashboardAggregator({screens});
export const coreLoop=createCoreLoop({state,onStatus:detail=>window.dispatchEvent(new CustomEvent('kfe:runtime',{detail}))});
export const network=createNetworkManager({sendOutbox:noTransport,onStatus:online=>window.dispatchEvent(new CustomEvent('kfe:network',{detail:{online}}))});

// Stable UI action boundary. The DOM shell calls this contract; business mutations
// remain owned by screen modules and the repository-backed state store.
export const actions=Object.freeze({
  startWork:(args={})=>screens.work.startWork(args),
  endWork:(args={})=>screens.work.endWork(args)
});
window.KFE_ACTIONS=actions;

void initializeResilience({sendOutbox:noTransport});

export function getScreenViewModel(name){const s=screens[name];if(!s)throw new Error(`Unknown screen: ${name}`);return s.getViewModel();}
export function getDashboardSnapshot(){return dashboard.getSnapshot();}
export function getCoreLoopViewModel(){return coreLoop.getViewModel();}
