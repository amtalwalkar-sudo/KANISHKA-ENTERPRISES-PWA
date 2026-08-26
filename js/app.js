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

const publishMutation=fn=>(args={})=>{
  const result=fn(args);
  window.dispatchEvent(new CustomEvent('kfe:runtime',{detail:{source:'app-action'}}));
  return result;
};

export const actions=Object.freeze({
  startWork:publishMutation(args=>screens.work.startWork(args)),
  endWork:publishMutation(args=>screens.work.endWork(args))
});
window.KFE_APP_ACTIONS=actions;

const getViewModel=name=>screens[name].getViewModel();
const runtime={
  repository,
  state,
  screens,
  actions,
  getViewModel,
  getDashboardSnapshot:()=>dashboard.getSnapshot(),
  getCoreLoopViewModel:()=>coreLoop.getViewModel()
};
window.__KFE_RUNTIME__=runtime;
window.KFE_VIEW_MODELS=Object.fromEntries(Object.keys(screens).map(name=>[name,getViewModel(name)]));
window.KFE_DASHBOARD_SNAPSHOT=dashboard.getSnapshot();
window.KFE_REPOSITORY=repository;

state.subscribe(()=>{
  window.KFE_VIEW_MODELS=Object.fromEntries(Object.keys(screens).map(name=>[name,getViewModel(name)]));
  window.KFE_DASHBOARD_SNAPSHOT=dashboard.getSnapshot();
});

void initializeResilience({sendOutbox:noTransport});

export function getScreenViewModel(name){return getViewModel(name);}
export function getDashboardSnapshot(){return dashboard.getSnapshot();}
export function getCoreLoopViewModel(){return coreLoop.getViewModel();}
