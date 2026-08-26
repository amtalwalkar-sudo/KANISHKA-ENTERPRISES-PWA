import {createStore} from './core/store.js';
import {createWorkScreen} from './screens/work.js';
import {createFuelScreen} from './screens/fuel.js';
import {createExpensesScreen} from './screens/expenses.js';
import {createRevenueScreen} from './screens/revenue.js';
import {createDashboardAggregator} from './dashboard/aggregator.js';
const state=createStore({work:{},fuel:{},expenses:{items:[]},revenue:{items:[]}});
export const screens={work:createWorkScreen({state}),fuel:createFuelScreen({state}),expenses:createExpensesScreen({state}),revenue:createRevenueScreen({state})};
export const dashboard=createDashboardAggregator({screens});
export function getScreenViewModel(name){const s=screens[name];if(!s)throw new Error(`Unknown screen: ${name}`);return s.getViewModel();}
export function getDashboardSnapshot(){return dashboard.getSnapshot();}
