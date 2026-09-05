// Provider boundary only. No cloud/vendor dependency belongs here.
export const BACKUP_PROVIDER_METHODS=Object.freeze(['put','list','get','remove']);
export function assertBackupProvider(provider){
  if(!provider||typeof provider!=='object')throw new TypeError('Backup provider is required');
  for(const method of BACKUP_PROVIDER_METHODS)if(typeof provider[method]!=='function')throw new TypeError(`Backup provider must implement ${method}()`);
  return provider;
}
