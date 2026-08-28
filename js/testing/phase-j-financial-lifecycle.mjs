import assert from 'node:assert/strict';
import {businessRevenue,personalRevenue} from '../domain/revenue.js';
import {businessExpenses,personalExpenses} from '../domain/expenses.js';
import {maintenanceDimension,maintenanceProgress,provisionMaintenance,reconcileInvoice} from '../domain/maintenance.js';
import {amortize,applyPrepayment,loanCashCost} from '../domain/loans.js';
import {profitability} from '../domain/dashboard.js';
import {effectiveConfig} from '../domain/shared.js';

const records=[
  {id:'biz-revenue',scope:'BUSINESS',amount_paise:1000000,is_deleted:false},
  {id:'personal-revenue',scope:'PERSONAL',amount_paise:500000,is_deleted:false},
  {id:'void-revenue',scope:'BUSINESS',amount_paise:900000,is_voided:true},
];
assert.equal(businessRevenue(records).value,1000000);
assert.equal(personalRevenue(records).value,500000);

const expenses=[
  {id:'biz-expense',scope:'BUSINESS',amount_paise:100000,is_deleted:false},
  {id:'personal-expense',scope:'PERSONAL',amount_paise:50000,is_deleted:false},
  {id:'deleted-expense',scope:'BUSINESS',amount_paise:700000,is_deleted:true},
];
assert.equal(businessExpenses(expenses).value,100000);
assert.equal(personalExpenses(expenses).value,50000);

const kmItem={id:'maint-km',expected_cost_paise:400000,expected_km_life:40000,expected_time_life_days:null,baseline_odometer:1000,baseline_date:null};
assert.equal(maintenanceDimension(kmItem),'KM');
assert.equal(maintenanceProgress(kmItem,{odometer:21000,at:'2026-08-28T00:00:00Z'}).ratio,.5);
assert.equal(provisionMaintenance(kmItem,{odometer:21000,at:'2026-08-28T00:00:00Z'}).value,200000);
assert.deepEqual(reconcileInvoice(kmItem,{id:'invoice',amount_paise:450000},{odometer:21000,at:'2026-08-28T00:00:00Z'}).value,{actualPaise:450000,provisionedPaise:200000,reconciliationPaise:250000});
assert.throws(()=>maintenanceDimension({...kmItem,expected_time_life_days:30}),/exactly one dimension/);

const timeItem={id:'maint-time',expected_cost_paise:300000,expected_km_life:null,expected_time_life_days:30,baseline_odometer:null,baseline_date:'2026-08-01T00:00:00Z'};
assert.equal(maintenanceDimension(timeItem),'TIME');
assert.equal(maintenanceProgress(timeItem,{odometer:null,at:'2026-08-16T00:00:00Z'}).ratio,.5);

const schedule=amortize({principal_paise:1000000,annual_rate_percent:12,term_months:12,emi_paise:100000});
assert.equal(schedule.dataConfidenceState,'BASELINE');
assert.equal(schedule.value.at(-1).ending_balance_paise,0);
assert.equal(schedule.value.reduce((s,r)=>s+r.principal_paise,0),1000000);
assert.ok(schedule.value.reduce((s,r)=>s+r.interest_paise,0)>0);
assert.equal(applyPrepayment(100000,150000).value.remainingPrincipalPaise,0);
assert.equal(loanCashCost(100000,20000).value,120000);

const profit=profitability({revenue:1000000,fuel:100000,maintenanceProvision:50000,fixedOverhead:100000,loanPrincipal:100000,loanInterest:20000,otherBusinessCosts:30000,takeHomeTargetPaise:200000});
assert.equal(profit.value.netProfitPaise,600000);
assert.equal(profit.value.aboveTakeHomeTargetPaise,400000);
const loss=profitability({...profit.value,revenue:100000});
assert.equal(loss.value.netProfitPaise,-300000);
assert.equal(loss.value.aboveTakeHomeTargetPaise,-500000);

const configs=[
  {id:'old',monthly_amount_paise:100000,effective_from:'2026-01-01T00:00:00.000Z',effective_to:'2026-08-01T00:00:00.000Z',is_deleted:false},
  {id:'current',monthly_amount_paise:120000,effective_from:'2026-08-01T00:00:00.000Z',effective_to:null,is_deleted:false},
];
assert.equal(effectiveConfig(configs,'2026-08-28T00:00:00Z').id,'current');
assert.equal(effectiveConfig(configs,'2026-07-31T00:00:00Z').id,'old');

console.log('KFE Phase J financial lifecycle: PASS');
