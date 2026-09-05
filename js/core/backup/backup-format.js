// KFE provider-independent backup package contract.
export const KFE_BACKUP_FORMAT='kfe-backup';
export const KFE_BACKUP_FORMAT_VERSION=1;

export function createBackupPackage({dataset,dbName,dbVersion,createdAt=new Date().toISOString()}={}){
  if(!dataset||typeof dataset!=='object'||Array.isArray(dataset))throw new TypeError('Backup dataset is required');
  return structuredClone({
    format:KFE_BACKUP_FORMAT,
    formatVersion:KFE_BACKUP_FORMAT_VERSION,
    manifest:{dbName:dbName??null,dbVersion:Number.isInteger(dbVersion)?dbVersion:null,createdAt,complete:true},
    dataset
  });
}

export function validateBackupPackage(pkg){
  if(!pkg||typeof pkg!=='object'||Array.isArray(pkg))throw new TypeError('Invalid KFE backup package');
  if(pkg.format!==KFE_BACKUP_FORMAT||pkg.formatVersion!==KFE_BACKUP_FORMAT_VERSION)throw new TypeError('Unsupported KFE backup package version');
  if(!pkg.manifest||pkg.manifest.complete!==true||!pkg.dataset||typeof pkg.dataset!=='object'||Array.isArray(pkg.dataset))throw new TypeError('Incomplete KFE backup package');
  return true;
}
