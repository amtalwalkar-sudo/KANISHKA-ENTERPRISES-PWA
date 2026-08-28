import {APPLICATION_MODULES} from './module-registry.js';
import {createModuleReplicationContract} from './module-replication-contract.js';

const MODULE_SPECS=Object.freeze({
  vehicle:{commands:['CREATE','UPDATE'],queries:['GET','LIST']},
  'work-sessions':{commands:['CREATE','UPDATE'],queries:['GET','LIST']},
  fuel:{commands:['CREATE','UPDATE'],queries:['GET','LIST']},
  expenses:{commands:['CREATE','UPDATE'],queries:['GET','LIST']},
  revenue:{commands:['CREATE','UPDATE'],queries:['GET','LIST']},
  loans:{commands:['CREATE','UPDATE'],queries:['GET','LIST']},
  'renewals-compliance':{commands:['CREATE','UPDATE'],queries:['GET','LIST']},
  maintenance:{commands:['CREATE','UPDATE'],queries:['GET','LIST']},
  profitability:{commands:[],queries:['GET']},
  dashboard:{commands:[],queries:['GET']}
});

export const MODULE_APPLICATION_CONTRACTS=Object.freeze(APPLICATION_MODULES.map(module=>{
  const spec=MODULE_SPECS[module.id];
  if(!spec) throw new Error(`Missing application contract spec for ${module.id}`);
  return Object.freeze({module,...createModuleReplicationContract(module.id),commands:Object.freeze(spec.commands),queries:Object.freeze(spec.queries)});
}));

export function applicationContractByModuleId(id){return MODULE_APPLICATION_CONTRACTS.find(contract=>contract.module.id===id)||null;}
