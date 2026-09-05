export const KFE_BACKUP_PACKAGE_VERSION='kfe-backup-package-v1';
export const KFE_BACKUP_MIME='application/vnd.kfe.backup+json';
export const KFE_BACKUP_EXTENSION='.kfe';

function isPlainObject(value){return value!==null&&typeof value==='object'&&!Array.isArray(value);}
export function canonicalize(value){
  if(Array.isArray(value))return `[${value.map(canonicalize).join(',')}]`;
  if(isPlainObject(value))return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
export function utf8(value){return new TextEncoder().encode(value);}
export function decodeUtf8(bytes){return new TextDecoder().decode(bytes);}
export function bytesToBase64(bytes){let binary='';const data=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);for(let i=0;i<data.length;i+=0x8000)binary+=String.fromCharCode(...data.subarray(i,i+0x8000));return btoa(binary);}
export function base64ToBytes(value){const binary=atob(value);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes;}
export async function sha256Hex(bytes){const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(value=>value.toString(16).padStart(2,'0')).join('');}
export async function gzip(bytes){if(typeof CompressionStream==='undefined')return {bytes,compression:'none'};const stream=new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));return {bytes:new Uint8Array(await new Response(stream).arrayBuffer()),compression:'gzip'};}
export async function gunzip(bytes,compression){if(compression==='none')return bytes;if(compression!=='gzip'||typeof DecompressionStream==='undefined')throw new TypeError('Unsupported KFE backup compression');const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));return new Uint8Array(await new Response(stream).arrayBuffer());}
export function validateBackupPackage(pkg){
  if(!isPlainObject(pkg)||pkg.packageVersion!==KFE_BACKUP_PACKAGE_VERSION)throw new TypeError('Unsupported KFE backup package');
  if(!isPlainObject(pkg.manifest)||typeof pkg.manifest.datasetId!=='string'||typeof pkg.manifest.createdAt!=='string')throw new TypeError('KFE backup manifest is invalid');
  if(!isPlainObject(pkg.encryption)||pkg.encryption.algorithm!=='AES-GCM'||typeof pkg.encryption.iv!=='string')throw new TypeError('KFE backup encryption metadata is invalid');
  if(!['none','gzip'].includes(pkg.compression))throw new TypeError('KFE backup compression is invalid');
  if(typeof pkg.ciphertext!=='string'||typeof pkg.checksum!=='string')throw new TypeError('KFE backup payload is invalid');
  return true;
}
export function countSnapshotRecords(snapshot){return Object.values(snapshot.stores||{}).reduce((total,records)=>total+(Array.isArray(records)?records.length:0),0);}
