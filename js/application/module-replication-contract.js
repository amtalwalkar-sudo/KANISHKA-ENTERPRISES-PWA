export const MODULE_REPLICATION_CONTRACT_VERSION=1;

export const MODULE_REPLICATION_STAGES=Object.freeze([
  'PRESENTATION',
  'COMMAND_QUERY',
  'DOMAIN_APPLICATION',
  'REPOSITORY',
  'PERSISTENCE',
  'READ_MODEL'
]);

export function createModuleReplicationContract(moduleId){
  if(typeof moduleId!=='string'||!moduleId.trim()) throw new Error('moduleId is required');
  return Object.freeze({version:MODULE_REPLICATION_CONTRACT_VERSION,moduleId,stages:MODULE_REPLICATION_STAGES});
}

export function isModuleReplicationContract(value){
  return Boolean(value&&value.version===MODULE_REPLICATION_CONTRACT_VERSION&&typeof value.moduleId==='string'&&Array.isArray(value.stages)&&value.stages.join('|')===MODULE_REPLICATION_STAGES.join('|'));
}
