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
import {statusReadModel,timelineReadModel} from './read-models.js';
import {createDependencyGraph} from '../core/dependency-graph.js';
export function createKfeApplication(repository){
 const graph=createDependencyGraph();
 for(const n of ['work.km','work.tomorrowKm','fuel.costPerKm','fuel.tomorrowCost','maintenance.provision','maintenance.reconciliation','expenses.business','expenses.fixedPerKm','revenue.business','loan.amortization','loan.cashCost','dashboard.profitability','dashboard.tomorrowTarget'])graph.addNode(n,{owner:n.split('.')[0]});
 graph.addDependency('work.km','work.tomorrowKm');graph.addDependency('fuel.costPerKm','fuel.tomorrowCost');graph.addDependency('work.tomorrowKm','dashboard.tomorrowTarget');graph.addDependency('fuel.tomorrowCost','dashboard.tomorrowTarget');graph.addDependency('expenses.fixedPerKm','dashboard.tomorrowTarget');graph.addDependency('maintenance.provision','dashboard.tomorrowTarget');graph.addDependency('loan.amortization','loan.cashCost');graph.addDependency('loan.cashCost','dashboard.profitability');graph.addDependency('revenue.business','dashboard.profitability');graph.addDependency('fuel.costPerKm','dashboard.profitability');graph.addDependency('maintenance.reconciliation','dashboard.profitability');
 async function create(store,data,meta={}){const record=createRecord(data,meta);repository.assertRecord(record);await repository.atomic([store],stores=>{stores[store].put(record);return record;});return record;}
 async function startWork(data,operationId=createOperationId()){return withIdempotency(repository,operationId,async()=>create('work_sessions',{...data,status:'OPEN'},{}));}
 async function getWork(id){return repository.entity('work_sessions').get(id);}
 async function listWork(){return repository.entity('work_sessions').list();}
 async function completeWork(id,data,operationId=createOperationId()){return withIdempotency(repository,operationId,async()=>{const existing=await repository.entity('work_sessions').get(id);if(!existing)throw new Error('Work session not found');const updated=repository.updateRecord(existing,{...data,status:'COMPLETED'});repository.assertRecord(updated);await repository.atomic(['work_sessions','revenue_records'],stores=>{stores.work_sessions.put(updated);if(data.revenue_paise!=null)stores.revenue_records.put(createRecord({work_session_id:id,amount_paise:data.revenue_paise,scope:'BUSINESS'},{id:data.revenue_id||createOperationId(),user_id:existing.user_id}));return true;});return updated;});}
 async function listFuel(){return repository.entity('fuel_records').list();}
 async function recordFuel(data,operationId=createOperationId()){return withIdempotency(repository,operationId,async()=>create('fuel_records',{...data,quantity_kg:Number(data.amount_paise)/100/Number(data.price_per_kg),fuel_type:'CNG'},{}));}
 async function undoFuel(id){const existing=await repository.entity('fuel_records').get(id);if(!existing)return null;return repository.entity('fuel_records').softDelete(existing);}
 async function listTrips(){return repository.entity('rides').list();}
 async function recordTrip(data,operationId=createOperationId()){return withIdempotency(repository,operationId,async()=>create('rides',data,{}));}
 async function updateTrip(id,changes,operationId=createOperationId()){return withIdempotency(repository,operationId,async()=>{const existing=await repository.entity('rides').get(id);if(!existing)throw new Error('Trip not found');return repository.entity('rides').update(existing,changes);});}
 async function undoTrip(id){const existing=await repository.entity('rides').get(id);if(!existing)return null;return repository.entity('rides').softDelete(existing);}
 async function recordRevenue(data,operationId=createOperationId()){return withIdempotency(repository,operationId,async()=>create('revenue_records',data,{}));}
 async function getStatus(asOf=new Date().toISOString()){return statusReadModel({repository,asOf});}
 async function getTimeline(){return timelineReadModel({repository});}
 return Object.freeze({graph,startWork,getWork,listWork,completeWork,listFuel,recordFuel,undoFuel,listTrips,recordTrip,updateTrip,undoTrip,recordRevenue,getStatus,getTimeline,calculateWorkSession,expectedTomorrowKm,rollingFuelCostPerKm,projectedFuelCostForKm,businessExpenses,fixedExpensePerBusinessKm,provisionMaintenance,reconcileInvoice,maintenanceAlerts,businessRevenue,amortize,applyPrepayment,profitability,tomorrowTarget,evaluateAlerts});
}
