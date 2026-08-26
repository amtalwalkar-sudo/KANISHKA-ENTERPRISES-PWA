import {createStore} from './core/store.js';
import {createRepository} from './core/repository.js';
import {createWorkScreen} from './screens/work.js';
import {createFuelScreen} from './screens/fuel.js';
import {createExpensesScreen} from './screens/expenses.js';
import {createRevenueScreen} from './screens/revenue.js';
import {createMaintenanceScreen} from './screens/maintenance.js';
import {createLoanScreen} from './screens/loan.js';
import {createRenewalsScreen} from './screens/renewals.js';
import {createDashboardAggregator} from './dashboard/aggregator.js';

const initialState={work:{},fuel:{},expenses:{items:[]},revenue:{items:[]},maintenance:{},loan:{},renewals:{}};
export const repository=createRepository({initial:initialState});
export const state=createStore(initialState,repository);

export const screens={
  work:createWorkScreen({state}),
  fuel:createFuelScreen({state}),
  expenses:createExpensesScreen({state}),
  revenue:createRevenueScreen({state}),
  maintenance:createMaintenanceScreen({state}),
  loan:createLoanScreen({state}),
  renewals:createRenewalsScreen({state})
};

export const dashboard=createDashboardAggregator({screens});
export function getScreenViewModel(name){const s=screens[name];if(!s)throw new Error(`Unknown screen: ${name}`);return s.getViewModel();}
export function getDashboardSnapshot(){return dashboard.getSnapshot();}
