import {createRecord} from '../core/record.js';
import {withIdempotency,createOperationId} from '../core/idempotency.js';
import {read} from '../core/hardened-db.js';
import {calculateWorkSession,expectedTomorrowKm} from '../domain/work.js';
import {rollingFuelCostPerKm,projectedFuelCostForKm} from '../domain/fuel.js';
import {businessExpenses,fixedExpensePerBusinessKm} from '../domain/expenses.js';
import {provisionMaintenance,reconcileInvoice,maintenanceAlerts} from '../domain/maintenance.js';
import {businessRevenue} from '../domain/revenue.js';
import {amortize,applyPrepayment} from '../domain/loans.js';
import {createDependencyGraph} from '../core/dependency-graph.js';
export function createKfeApplication(repository){
 const graph=createDependencyGraph();
 for(const n of ['work.km','work.tomorrowKm','fuel.costPerKm','fuel.tomorrowCost','maintenance.provision','maintenance.reconciliation','expenses.business','expenses.fixedPerKm','revenue.business','loan.amortization','loan.cashCost'])graph.addNode(n,{owner:n.split('.')[0]});
 graph.addDependency('work.km','work.tomorrowKm');
 graph.addDependency('fuel.costPerKm','fuel.tomorrowCost');
 graph.addDependency('loan.amortization','loan.cashCost');
 async function create(store,data,meta={}){const record=createRecord(data,meta);repository.assertRecord(record);await repository.atomic([store],stores=>{stores[store].put(record);return record;});return record;}
 async function startWork(data,operationId=createOperationId()){return withIdempotency(repository,operationId,async()=>create('work_sessions',{...data,status:'OPEN'},{}));}
 async function completeWork(id,data,operationId=createOperationId()){return withIdempotency(repository,operationId,async()=>{const existing=await read('work_sessions',id);if(!existing)throw new Error('Work session not found');const updated=repository.updateRecord(existing,{...data,status:'COMPLETED'});repository.assertRecord(updated);await repository.atomic(['work_sessions','revenue_records'],stores=>{stores.work_sessions.put(updated);if(data.revenue_paise!=null)stores.revenue_records.put(createRecord({work_session_id:id,amount_paise:data.revenue_paise,scope:'BUSINESS'},{id:data.revenue_id||crypto.randomUUID(),user_id:existing.user_id}));return true;});return updated;});}
 return Object.freeze({graph,startWork,completeWork,calculateWorkSession,expectedTomorrowKm,rollingFuelCostPerKm,projectedFuelCostForKm,businessExpenses,fixedExpensePerBusinessKm,provisionMaintenance,reconcileInvoice,maintenanceAlerts,businessRevenue,amortize,applyPrepayment});
}
