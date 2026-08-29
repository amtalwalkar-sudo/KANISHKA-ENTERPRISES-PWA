import {createRecord} from '../core/record.js';
import {withIdempotency,createOperationId} from '../core/idempotency.js';
import {calculateWorkSession,expectedTomorrowKm} from '../domain/work.js';
import {rollingFuelCostPerKm,projectedFuelCostForKm} from '../domain/fuel.js';
import {businessExpenses,fixedExpensePerBusinessKm} from '../domain/expenses.js';
import {provisionMaintenance,reconcileInvoice,maintenanceAlerts} from '../domain/maintenance.js';
import {businessRevenue} from '../domain/revenue.js';
import {amortize,applyPrepayment} from '../domain/loans.js';
import {profitability,tomorrowTarget} from '../domain/dashboard.js';
import {evaluateAlerts} from '../domain/alerts.js';
import {dashboardReadModel} from './read-models.js';
import {createDependencyGraph} from '../core/dependency-graph.js';
export function createKfeApplication(repository){
 const graph=createDependencyGraph();
 for(const n of ['work.km','work.tomorrowKm','fuel.costPerKm','fuel.tomorrowCost','maintenance.provision','maintenance.reconciliation','expenses.business','expenses.fixedPerKm','revenue.business','loan.amortization','loan.cashCost','dashboard.profitability','dashboard.tomorrowTarget'])graph.addNode(n,{owner:n.split('.')[0]});
 graph.addDependency('work.km','work.tomorrowKm');graph.addDependency('fuel.costPerKm','fuel.tomorrowCost');graph.addDependency('work.tomorrowKm','dashboard.tomorrowTarget');graph.addDependency('fuel.tomorrowCost','dashboard.tomorrowTarget');graph.addDependency('expenses.fixedPerKm','dashboard.tomorrowTarget');graph.addDependency('maintenance.provision','dashboard.tomorrowTarget');graph.addDependency('loan.amortization','loan.cashCost');graph.addDependency('loan.cashCost','dashboard.profitability');graph.addDependency('revenue.business','dashboard.profitability');graph.addDependency('fuel.costPerKm','dashboard.profitability');graph.addDependency('maintenance.reconciliation','dashboard.profitability');
 async function create(store,data,meta={}){const record=createRecord(data,meta);repository.assertRecord(record);await repository.atomic([store],stores=>{stores[store].put(record);return record;});return record;}
 async function startWork(data,operationId=createOperationId()){return withIdempotency(repository,operationId,async()=>create('work_sessions',{...data,status:'OPEN'},{}));}
 async function getWork(id){return repository.entity('work_sessions').get(id);}
 async function listWork(){return repository.entity('work_sessions').list();}
 async function completeWork(id,data,operationId=createOperationId()){return withIdempotency(repository,operationId,async()=>{const existing=await repository.entity('work_sessions').get(id);if(!existing)throw new Error('Work session not found');const updated=repository.updateRecord(existing,{...data,status:'COMPLETED'});repository.assertRecord(updated);await repository.atomic(['work_sessions','revenue_records'],stores=>{stores.work_sessions.put(updated);if(data.revenue_paise!=null)stores.revenue_records.put(createRecord({work_session_id:id,amount_paise:data.revenue_paise,scope:'BUSINESS'},{id:data.revenue_id||crypto.randomUUID(),user_id:existing.user_id}));return true;});return updated;});}
 async function statusReadModel(asOf=new Date().toISOString()){
  const day=asOf.slice(0,10);
  const [work,fuel,expenses,revenue]=await Promise.all([
   repository.entity('work_sessions').list(),
   repository.entity('fuel_records').list(),
   repository.entity('expense_records').list(),
   repository.entity('revenue_records').list()
  ]);
  const dayRows=(rows)=>rows.filter(r=>(r.business_date||r.date||r.start_at||r.created_at||'').slice(0,10)===day&&r.scope!=='PERSONAL');
  const todayWork=dayRows(work).filter(r=>r.status==='COMPLETED');
  const todayFuel=dayRows(fuel);
  const todayExpenses=dayRows(expenses);
  const todayRevenue=dayRows(revenue);
  const km=todayWork.reduce((sum,s)=>{const result=calculateWorkSession(s);return sum+(result.value?.workKm||0);},0);
  const fuelTotal=todayFuel.reduce((sum,r)=>sum+Number(r.amount_paise||0),0);
  const expenseResult=businessExpenses(todayExpenses);
  const revenueResult=businessRevenue(todayRevenue);
  const fuelRate=rollingFuelCostPerKm(fuel);
  const tomorrowKm=expectedTomorrowKm(work,asOf);
  const targetFuel=tomorrowKm.value==null?null:projectedFuelCostForKm(fuel,tomorrowKm.value);
  const target=tomorrowKm.value==null?null:tomorrowTarget({fuel:targetFuel?.value??null});
  return dashboardReadModel({profitabilityResult:profitability({revenue:revenueResult.value,fuel:fuelRate.value,maintenanceProvision:null,fixedOverhead:null,loanPrincipal:null,loanInterest:null,otherBusinessCosts:expenseResult.value,takeHomeTargetPaise:0}),tomorrowTargetResult:target,alerts:[]}).constructor===Object
   ? Object.freeze({version:1,dataConfidenceState:revenueResult.dataConfidenceState,day,businessKm:km,revenuePaise:revenueResult.value,expensesPaise:expenseResult.value,fuelPaise:fuelTotal,fuelCostPerKm:fuelRate.value,tomorrowKm:tomorrowKm.value,tomorrowTarget:target?.value??null})
   : Object.freeze({version:1,dataConfidenceState:'UNKNOWN',day,businessKm:km,revenuePaise:revenueResult.value,expensesPaise:expenseResult.value,fuelPaise:fuelTotal,fuelCostPerKm:fuelRate.value,tomorrowKm:tomorrowKm.value,tomorrowTarget:target?.value??null});
 }
 return Object.freeze({graph,startWork,getWork,listWork,completeWork,statusReadModel,calculateWorkSession,expectedTomorrowKm,rollingFuelCostPerKm,projectedFuelCostForKm,businessExpenses,fixedExpensePerBusinessKm,provisionMaintenance,reconcileInvoice,maintenanceAlerts,businessRevenue,amortize,applyPrepayment,profitability,tomorrowTarget,evaluateAlerts});
}
