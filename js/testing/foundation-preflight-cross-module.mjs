import {createKfeApplication} from '../application/kfe.js';
import {createDashboardApplicationBoundary} from '../application/dashboard.js';
import {createDependencyGraph} from '../core/dependency-graph.js';
import {calculateWorkSession} from '../domain/work.js';
import {rollingFuelCostPerKm} from '../domain/fuel.js';
import {businessExpenses,fixedExpensePerBusinessKm} from '../domain/expenses.js';
import {provisionMaintenance} from '../domain/maintenance.js';
import {businessRevenue} from '../domain/revenue.js';
import {amortize,loanCashCost} from '../domain/loans.js';
import {profitability} from '../domain/dashboard.js';

const failures=[];
const assert=(condition,message)=>{if(!condition)failures.push(message);};

const graph=createDependencyGraph();
const nodeIds=['work.km','work.tomorrowKm','fuel.costPerKm','fuel.tomorrowCost','maintenance.provision','maintenance.reconciliation','expenses.business','expenses.fixedPerKm','revenue.business','loan.amortization','loan.cashCost','dashboard.profitability','dashboard.tomorrowTarget'];
for(const id of nodeIds)graph.addNode(id,{owner:id.split('.')[0]});
const edges=[
 ['work.km','work.tomorrowKm'],['fuel.costPerKm','fuel.tomorrowCost'],['work.tomorrowKm','dashboard.tomorrowTarget'],
 ['fuel.tomorrowCost','dashboard.tomorrowTarget'],['expenses.fixedPerKm','dashboard.tomorrowTarget'],['maintenance.provision','dashboard.tomorrowTarget'],
 ['loan.amortization','loan.cashCost'],['loan.cashCost','dashboard.profitability'],['revenue.business','dashboard.profitability'],
 ['fuel.costPerKm','dashboard.profitability'],['maintenance.reconciliation','dashboard.profitability']
];
for(const [from,to] of edges)graph.addDependency(from,to);
assert(graph.topologicalOrder().length===nodeIds.length,'Cross-module dependency graph is acyclic and complete');
for(const [from,to] of edges)assert(graph.dependenciesOf(from).includes(to),`Dependency wired: ${from} -> ${to}`);

const work=calculateWorkSession({id:'work-1',scope:'BUSINESS',start_odometer:1000,end_odometer:1120,break_minutes:30,business_date:'2026-09-02'});
assert(work.value?.workKm===120,'Work Session produces authoritative business KM');
assert(work.value?.breakMinutes===30,'Work Session carries break handling into the calculation');

const fuel=[0,100,200,300].map((odometer,i)=>({id:`fuel-${i}`,odometer,amount_paise:10000,is_full_tank:true,is_deleted:false}));
const fuelRate=rollingFuelCostPerKm(fuel,3);
assert(fuelRate.value===100,'Fuel Cost/KM flows from full-tank intervals');

const expenses=businessExpenses([
 {id:'b',amount_paise:5000,scope:'BUSINESS',is_deleted:false},
 {id:'p',amount_paise:9000,scope:'PERSONAL',is_deleted:false}
]);
assert(expenses.value===5000,'Business expense calculation excludes personal expense');
assert(fixedExpensePerBusinessKm([{id:'fixed',monthly_amount_paise:120000,effective_from:'2026-01-01',effective_to:null,is_deleted:false}],1200,'2026-09-02').value===100,'Fixed expense lifecycle applies active configuration to business KM');

const maintenance=provisionMaintenance({id:'m1',expected_cost_paise:100000,expected_km_life:10000,baseline_odometer:1000,expected_time_life_days:null,is_deleted:false},{odometer:6000,at:'2026-09-02'});
assert(maintenance.value===50000,'Maintenance provision is amortized by KM usage');

const revenue=businessRevenue([
 {id:'r1',amount_paise:250000,scope:'BUSINESS',is_deleted:false},
 {id:'r2',amount_paise:999999,scope:'PERSONAL',is_deleted:false}
]);
assert(revenue.value===250000,'Business revenue calculation excludes personal revenue');

const schedule=amortize({principal_paise:1000000,annual_rate_percent:12,term_months:12,emi_paise:90000});
assert(Array.isArray(schedule.value)&&schedule.value.length>0,'Loan amortization produces a principal/interest schedule');
assert(schedule.value.every(row=>row.principal_paise+row.interest_paise===row.payment_paise),'Loan schedule preserves principal + interest = payment');
assert(schedule.value.at(-1).ending_balance_paise===0,'Loan lifecycle reaches zero balance when EMI permits');
assert(loanCashCost(100000,20000).value===120000,'Loan cash cost composes principal and interest');

const profit=profitability({revenue:250000,fuel:30000,maintenanceProvision:20000,fixedOverhead:10000,loanPrincipal:25000,loanInterest:5000,otherBusinessCosts:10000,takeHomeTargetPaise:50000});
assert(profit.value?.netProfitPaise===150000,'Dashboard profitability composes revenue and all business cost inputs');

const dashboard=createDashboardApplicationBoundary({screens:Object.fromEntries(['work','fuel','expenses','revenue','maintenance','loan','renewals'].map(name=>[name,{getViewModel:()=>({source:name})}]))});
const sources=dashboard.get();
assert(Object.keys(sources).length===7,'Dashboard cross-module read model consumes all seven authoritative source modules');

const applicationBoundary=createKfeApplication;
assert(typeof applicationBoundary==='function','Application boundary remains the cross-module composition point');

console.log(`FOUNDATION_PREFLIGHT_CROSS_MODULE_CHECKS=${edges.length+15}`);
if(failures.length){console.error('FOUNDATION_PREFLIGHT_CROSS_MODULE_FAILED');for(const f of failures)console.error(`- ${f}`);process.exit(1);}
console.log('FOUNDATION_PREFLIGHT_CROSS_MODULE=PASS');
