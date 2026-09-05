import assert from 'node:assert/strict';
import {createMemoryBackupProvider,assertBackupProvider,BACKUP_PROVIDER_CONTRACT_VERSION} from '../core/backup-provider.js';
import {canonicalize,validateBackupPackage,KFE_BACKUP_PACKAGE_VERSION} from '../core/backup-format.js';

const provider=createMemoryBackupProvider();
assertBackupProvider(provider);
assert.equal(provider.contractVersion,BACKUP_PROVIDER_CONTRACT_VERSION);
const first={id:'backup-1',createdAt:'2026-09-05T00:00:00.000Z',package:{packageVersion:KFE_BACKUP_PACKAGE_VERSION}};
await provider.put(first);
assert.deepEqual(await provider.get('backup-1'),first);
assert.equal((await provider.list()).length,1);
await provider.remove('backup-1');
assert.equal((await provider.get('backup-1')),null);
assert.equal(canonicalize({b:1,a:2}),'{"a":2,"b":1}');
assert.throws(()=>validateBackupPackage({}),/Unsupported KFE backup package/);
console.log('PASS: provider abstraction and backup package contract.');
