// KFE Backup Engine: owns backup/restore orchestration, independent of storage provider.
import {openKfeDb,all,STORE_NAMES,DB_NAME,DB_VERSION,runAtomicTransaction} from '../hardened-db.js';
import {createBackupPackage,validateBackupPackage} from './backup-format.js';
import {assertBackupProvider} from './backup-provider.js';

export async function createCompleteDataset(){
  await openKfeDb();
  const stores={};
  for(const name of STORE_NAMES)stores[name]=await all(name);
  return stores;
}

export async function createCompleteBackup(){
  return createBackupPackage({dataset:{stores:await createCompleteDataset()},dbName:DB_NAME,dbVersion:DB_VERSION});
}

export async function validateCompleteBackup(pkg){
  validateBackupPackage(pkg);
  if(pkg.manifest.dbName!==DB_NAME||!Number.isInteger(pkg.manifest.dbVersion)||pkg.manifest.dbVersion>DB_VERSION)throw new TypeError('KFE backup database version is incompatible');
  const stores=pkg.dataset.stores;
  if(!stores||typeof stores!=='object')throw new TypeError('KFE backup stores are missing');
  for(const name of Object.keys(stores))if(!STORE_NAMES.includes(name)||!Array.isArray(stores[name]))throw new TypeError(`Invalid KFE backup store: ${name}`);
  return true;
}

export async function restoreCompleteBackup(pkg){
  await validateCompleteBackup(pkg);
  const db=await openKfeDb();
  return runAtomicTransaction(db,STORE_NAMES,(stores)=>{
    for(const name of STORE_NAMES)stores[name].clear();
    for(const [name,records] of Object.entries(pkg.dataset.stores))for(const record of records)stores[name].put(record);
    return true;
  });
}

export function createBackupManager({provider=null}={}){
  if(provider)assertBackupProvider(provider);
  return Object.freeze({
    create:()=>createCompleteBackup(),
    validate:pkg=>validateCompleteBackup(pkg),
    restore:pkg=>restoreCompleteBackup(pkg),
    async cloudPut(id,pkg){assertBackupProvider(provider);await validateCompleteBackup(pkg);return provider.put(id,pkg);},
    async cloudList(){assertBackupProvider(provider);return provider.list();},
    async cloudGet(id){assertBackupProvider(provider);const pkg=await provider.get(id);await validateCompleteBackup(pkg);return pkg;},
    async cloudRemove(id){assertBackupProvider(provider);return provider.remove(id);}
  });
}
