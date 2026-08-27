import assert from 'node:assert/strict';
import {roundRational,multiplyPaiseByRatio} from '../core/arithmetic.js';
import {rollingFuelCostPerKm,projectedFuelCostForKm} from '../domain/fuel.js';
import {rolling7DayKm,expectedTomorrowKm,odometerAnomalyWarning,recoverDanglingShifts,validateWorkOdometer} from '../domain/work.js';
import {fixedExpensePerBusinessKm} from '../domain/expenses.js';
import {maintenanceProgress,provisionMaintenance} from '../domain/maintenance.js';
import {applyPrepayment,amortize} from '../domain/loans.js';

assert.equal(roundRational(5,2),3);
assert.equal(roundRational(4,2),2);
assert.equal(multiplyPaiseByRatio(400000,1,2),200000);

const ids=['a','b','c','d','e','f'].map(id=>({id,is_deleted:false,is_voided:false}));
const fuel=ids.map((x,i)=>({...x,odometer:i*1000,litres:40,amount_paise:400000,is_full_tank:true}));
assert.equal(rollingFuelCostPerKm(fuel,3).dataConfidenceState,'ACTUAL');
assert.equal(rollingFuelCostPerKm(fuel,3).value.numerator,'400000');
assert.equal(rollingFuelCostPerKm(fuel,3).value.denominator,'1000');
assert.equal(projectedFuelCostForKm(fuel,1000,3).value,400000);

const work=[{id:'w1',scope:'BUSINESS',start_odometer:0,end_odometer:700,end_at:'2026-08-20T10:00:00.000Z',business_date:'2026-08-20',is_deleted:false,is_voided:false}];
assert.equal(rolling7DayKm(work,'2026-08-20T10:00:00.000Z').value,100);
assert.equal(expectedTomorrowKm(work,'2026-08-20T10:00:00.000Z').dataConfidenceState,'PROJECTED');
assert.throws(()=>validateWorkOdometer(9,10));

const fixed=fixedExpensePerBusinessKm([{id:'f',monthly_amount_paise:100000,effective_from:'2026-01-01T00:00:00.000Z',effective_to:null}],1000,'2026-08-01T00:00:00.000Z');
assert.equal(fixed.value.rate.numerator,100000);
assert.equal(fixed.value.rate.denominator,1000);

const kmItem={id:'km',trigger_type:'KM',expected_cost_paise:400000,expected_km_life:40000,baseline_odometer:0};
assert.equal(maintenanceProgress(kmItem,{odometer:20000,at:'2026-08-01T00:00:00.000Z'}).ratio,.5);
assert.equal(provisionMaintenance(kmItem,{odometer:20000,at:'2026-08-01T00:00:00.000Z'}).value,200000);
const timeItem={id:'time',trigger_type:'TIME',expected_cost_paise:400000,expected_time_life_days:100,baseline_date:'2026-01-01T00:00:00.000Z'};
assert.throws(()=>maintenanceProgress({...kmItem,expected_time_life_days:100},{odometer:20000,at:'2026-08-01T00:00:00.000Z'}));
assert.equal(maintenanceProgress(timeItem,{at:'2026-01-11T00:00:00.000Z'}).remainingDays,90);

assert.equal(applyPrepayment(100000,150000).value.remainingPrincipalPaise,0);
assert.equal(applyPrepayment(100000,150000).value.rejectedExcessPaise,50000);
assert.equal(amortize({principal_paise:1000000,annual_rate_percent:12,term_months:12,emi_paise:100000}).dataConfidenceState,'BASELINE');
assert.equal(amortize({principal_paise:1000000,annual_rate_percent:12,term_months:12,emi_paise:100000}).value[0].interest_paise,10000);

assert.equal(odometerAnomalyWarning(0,1600).warning,true);
assert.equal(recoverDanglingShifts([{id:'d',status:'OPEN',start_at:'2026-08-01T00:00:00.000Z',is_deleted:false}],'2026-08-02T17:00:00.000Z').length,1);

console.log('KFE clean-room domain calculations: PASS');
