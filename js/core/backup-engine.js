import {KFE_BACKUP_PACKAGE_VERSION,KFE_BACKUP_MIME,canonicalize,utf8,decodeUtf8,bytesToBase64,base64ToBytes,sha256Hex,gzip,gunzip,validateBackupPackage,countSnapshotRecords} from './backup-format.js';
import {requestPersistentStorage} from './hardened-db.js';
import {readMeta,writeMeta,writeSafetyMeta,readPayload,writePayload,readDeviceKey,writeDeviceKey} from './backup-storage.js';
import {assertBackupProvider,createBackupProviderContract} from './backup-provider.js';

const AES={name:'AES-GCM',length:256};
const GCM={name:'AES-GCM',tagLength:128};
const PBKDF2_ITERATIONS=210000;
const textEncoder=new TextEncoder();
function webCrypto(){if(!globalThis.crypto?.subtle)throw new Error('Web Crypto is unavailable; KFE backups require a secure context');return globalThis.crypto;}
function randomBytes(size){return webCrypto().getRandomValues(new Uint8Array(size));}
async function derivePasswordKey(passphrase,salt){const material=await webCrypto().subtle.importKey('raw',textEncoder.encode(String(passphrase||'')),'PBKDF2',false,['deriveKey']);return webCrypto().subtle.deriveKey({name:'PBKDF2',salt,iterations:PBKDF2_ITERATIONS,hash:'SHA-256'},material,AES,false,['encrypt','decrypt']);}
async function deviceKey(){const existing=await readDeviceKey();if(existing?.key)return existing.key;const key=await webCrypto().subtle.generateKey(AES,false,['encrypt','decrypt']);await writeDeviceKey(key);return key;}
async function encrypt(bytes,key){const iv=randomBytes(12);const ciphertext=await webCrypto().subtle.encrypt({...GCM,iv},key,bytes);return {iv,ciphertext:new Uint8Array(ciphertext)};}
async function decrypt(ciphertext,key,iv){return new Uint8Array(await webCrypto().subtle.decrypt({...GCM,iv},key,ciphertext));}
function assertRepositorySnapshot(snapshot){if(!snapshot||typeof snapshot!=='object'||snapshot.schemaVersion!==1||typeof snapshot.dbName!=='string'||!Number.isInteger(snapshot.dbVersion)||!snapshot.stores||typeof snapshot.stores!=='object')throw new TypeError('Invalid KFE repository snapshot');for(const records of Object.values(snapshot.stores))if(!Array.isArray(records))throw new TypeError('KFE repository snapshot contains an invalid store');return true;}
async function encodeDocument(document,key,mode){const raw=utf8(canonicalize(document));const checksum=await sha256Hex(raw);const packed=await gzip(raw);const encrypted=await encrypt(packed.bytes,key);return {checksum,compression:packed.compression,iv:bytesToBase64(encrypted.iv),ciphertext:bytesToBase64(encrypted.ciphertext),encryptionMode:mode,sizeBytes:encrypted.ciphertext.byteLength};}
async function decodeDocument(pkg,key){const ciphertext=base64ToBytes(pkg.ciphertext);const packed=await decrypt(ciphertext,key,base64ToBytes(pkg.encryption.iv));const raw=await gunzip(packed,pkg.compression);const checksum=await sha256Hex(raw);if(checksum!==pkg.checksum)throw new TypeError('KFE backup integrity check failed');return JSON.parse(decodeUtf8(raw));}

export function createBackupEngine({repository,provider=null}={}){
  if(!repository)throw new TypeError('KFE repository is required');if(provider)assertBackupProvider(provider);
  let datasetIdPromise=null;let refreshPromise=Promise.resolve();let started=false;let unsubscribe=()=>{};let storageListener=null;let refreshQueued=false;
  async function datasetId(){if(datasetIdPromise)return datasetIdPromise;datasetIdPromise=(async()=>{const meta=await readMeta();if(meta?.datasetId)return meta.datasetId;const id=crypto.randomUUID();await writeMeta({datasetId:id,createdAt:new Date().toISOString()});return id;})();return datasetIdPromise;}
  async function buildPackage(snapshot,mode='device',passphrase=''){
    assertRepositorySnapshot(snapshot);
    if(mode==='device'){const key=await deviceKey();const encoded=await encodeDocument(snapshot,key,'device');return {packageVersion:KFE_BACKUP_PACKAGE_VERSION,manifest:{datasetId:await datasetId(),createdAt:new Date().toISOString(),schemaVersion:snapshot.schemaVersion,dbVersion:snapshot.dbVersion,recordCount:countSnapshotRecords(snapshot)},compression:encoded.compression,encryption:{algorithm:'AES-GCM',mode:'device',iv:encoded.iv},checksum:encoded.checksum,ciphertext:encoded.ciphertext};}
    const salt=randomBytes(16);const key=await derivePasswordKey(passphrase,salt);const encoded=await encodeDocument(snapshot,key,'passphrase');return {packageVersion:KFE_BACKUP_PACKAGE_VERSION,manifest:{datasetId:await datasetId(),createdAt:new Date().toISOString(),schemaVersion:snapshot.schemaVersion,dbVersion:snapshot.dbVersion,recordCount:countSnapshotRecords(snapshot)},compression:encoded.compression,encryption:{algorithm:'AES-GCM',mode:'passphrase',iv:encoded.iv,salt:bytesToBase64(salt),iterations:PBKDF2_ITERATIONS,hash:'SHA-256'},checksum:encoded.checksum,ciphertext:encoded.ciphertext};
  }
  function scheduleRefresh(reason='mutation'){if(refreshQueued)return;refreshQueued=true;queueMicrotask(()=>{refreshQueued=false;void refreshLocal(reason).catch(()=>{});});}
  async function refreshLocal(reason='mutation'){
    refreshPromise=refreshPromise.then(async()=>{const snapshot=await repository.exportSnapshot();const pkg=await buildPackage(snapshot,'device');const now=new Date().toISOString();await writePayload({package:pkg,updatedAt:now,reason});const previous=await readMeta();await writeMeta({datasetId:pkg.manifest.datasetId,createdAt:previous?.createdAt||pkg.manifest.createdAt,lastSuccessfulBackupAt:now,lastReason:reason,recordCount:pkg.manifest.recordCount,sizeBytes:pkg.ciphertext.length});if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('kfe:backup-updated'));return pkg;});return refreshPromise;
  }
  async function start(){if(started)return;started=true;await requestPersistentStorage();unsubscribe=repository.subscribeMutations?.(event=>{if(event?.store==='idempotency'||event?.type==='idempotency')return;scheduleRefresh('data-change');})||(()=>{});if(typeof window!=='undefined'){storageListener=event=>{if(event?.detail?.store==='idempotency')return;scheduleRefresh('data-change');};window.addEventListener('kfe:storage-mutated',storageListener);}const meta=await readMeta();const payload=await readPayload();if(!meta?.lastSuccessfulBackupAt||!payload?.package)await refreshLocal('startup');return getStatus();}
  async function getStatus(){const meta=await readMeta();const payload=await readPayload();return {available:Boolean(payload?.package),datasetId:meta?.datasetId||null,lastSuccessfulBackupAt:meta?.lastSuccessfulBackupAt||null,recordCount:Number(meta?.recordCount||0),sizeBytes:Number(meta?.sizeBytes||0),status:payload?.package?'CURRENT':'MISSING'};}
  async function createPortableBackup(passphrase){if(String(passphrase||'').length<8)throw new RangeError('Portable KFE backup passphrase must be at least 8 characters');const snapshot=await repository.exportSnapshot();return buildPackage(snapshot,'passphrase',passphrase);}
  async function restorePackage(pkg,passphrase){validateBackupPackage(pkg);if(pkg.encryption.mode==='passphrase'&&String(passphrase||'').length<8)throw new RangeError('KFE backup passphrase is required');await refreshLocal('pre-restore-safety');const current=await readPayload();const currentMeta=await readMeta();if(current?.package)await writePayload({...current,updatedAt:new Date().toISOString()},'safety');if(currentMeta)await writeSafetyMeta({...currentMeta,safetyCreatedAt:new Date().toISOString()});const key=pkg.encryption.mode==='device'?await deviceKey():await derivePasswordKey(passphrase,base64ToBytes(pkg.encryption.salt));const snapshot=await decodeDocument(pkg,key);assertRepositorySnapshot(snapshot);await repository.importSnapshot(snapshot);await refreshLocal('post-restore');return getStatus();}
  async function exportPortableFile(passphrase){const pkg=await createPortableBackup(passphrase);return new Blob([JSON.stringify(pkg)],{type:KFE_BACKUP_MIME});}
  async function restorePortableText(text,passphrase){let pkg;try{pkg=JSON.parse(text);}catch{throw new TypeError('KFE backup file is not valid JSON');}return restorePackage(pkg,passphrase);}
  async function saveCloud(pkg,metadata={}){if(!provider)throw new Error('No backup provider configured');return createBackupProviderContract(provider).put({id:pkg.manifest.createdAt,createdAt:pkg.manifest.createdAt,package:pkg,metadata});}
  async function listCloud(){if(!provider)return [];return provider.list();}
  async function getCloud(id){if(!provider)return null;return provider.get(id);}
  async function removeCloud(id){if(!provider)return false;return provider.remove(id);}
  function stop(){unsubscribe();if(typeof window!=='undefined'&&storageListener)window.removeEventListener('kfe:storage-mutated',storageListener);storageListener=null;started=false;}
  return Object.freeze({start,stop,refreshLocal,getStatus,createPortableBackup,exportPortableFile,restorePackage,restorePortableText,saveCloud,listCloud,getCloud,removeCloud,provider:provider||null});
}
