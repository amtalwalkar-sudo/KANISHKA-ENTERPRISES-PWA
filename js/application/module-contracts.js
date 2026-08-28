import {APPLICATION_MODULES} from './module-registry.js';
import {createModuleReplicationContract} from './module-replication-contract.js';

export const MODULE_APPLICATION_CONTRACTS=Object.freeze(APPLICATION_MODULES.map(module=>Object.freeze({module,...createModuleReplicationContract(module.id),commands:Object.freeze([]),queries:Object.freeze([])})));

export function applicationContractByModuleId(id){return MODULE_APPLICATION_CONTRACTS.find(contract=>contract.module.id===id)||null;}
