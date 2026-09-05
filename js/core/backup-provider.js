export const BACKUP_PROVIDER_CONTRACT_VERSION='1.0.0';

const requiredMethods=['put','list','get','remove'];
export function assertBackupProvider(provider){
  if(!provider||typeof provider!=='object')throw new TypeError('Backup provider is required');
  for(const method of requiredMethods)if(typeof provider[method]!=='function')throw new TypeError(`Backup provider must implement ${method}()`);
  return provider;
}
export function createBackupProviderContract(provider){return Object.freeze({contractVersion:BACKUP_PROVIDER_CONTRACT_VERSION,put:(...args)=>provider.put(...args),list:(...args)=>provider.list(...args),get:(...args)=>provider.get(...args),remove:(...args)=>provider.remove(...args)});}

// Test-only/local development adapter. It is not a production cloud provider.
export function createMemoryBackupProvider(){
  const records=new Map();
  return createBackupProviderContract({
    async put(backup){if(!backup?.id)throw new TypeError('Backup id is required');records.set(backup.id,structuredClone(backup));return structuredClone(backup);},
    async list(){return [...records.values()].map(value=>structuredClone(value)).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));},
    async get(id){const value=records.get(id);return value?structuredClone(value):null;},
    async remove(id){return records.delete(id);}
  });
}
