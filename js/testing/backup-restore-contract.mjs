// Provider-independent Backup & Restore contract checks.
import {createBackupPackage,validateBackupPackage} from '../core/backup/backup-format.js';
import {assertBackupProvider} from '../core/backup/backup-provider.js';

const pkg=createBackupPackage({dataset:{stores:{state:[]}},dbName:'kfe',dbVersion:9});
if(!validateBackupPackage(pkg))throw new Error('Backup package validation failed');
if(pkg.manifest.complete!==true)throw new Error('Backup must be complete');
assertBackupProvider({put(){},list(){},get(){},remove(){}});
let rejected=false;try{assertBackupProvider({put(){}});}catch{rejected=true;}
if(!rejected)throw new Error('Incomplete provider contract was accepted');
console.log('BACKUP_RESTORE_CONTRACT_OK');
