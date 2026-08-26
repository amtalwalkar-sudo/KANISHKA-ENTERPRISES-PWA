// Session boundary. Application code must never persist authentication tokens in localStorage.
// Preferred production mode: Secure + HttpOnly + SameSite cookies issued by the backend.
// The browser cannot create or read HttpOnly cookies; this module therefore exposes a capability boundary.
export const SESSION_POLICY=Object.freeze({
  browserTokenPersistence:'forbidden',
  preferredTransport:'secure-http-only-cookie',
  sameSite:'Lax',
  secure:true,
  piiPersistence:'minimize-and-encrypt-at-rest',
  fallback:'ephemeral-memory-only'
});

let memorySession=null;
export function setSessionMetadata(metadata){memorySession=metadata?structuredClone(metadata):null;}
export function getSessionMetadata(){return memorySession?structuredClone(memorySession):null;}
export function clearSession(){memorySession=null;}
export function assertTokenStoragePolicy(target){
  if(target==='localStorage'||target==='sessionStorage') throw new Error('KFE security policy: authentication tokens must not be stored in browser storage');
  return true;
}
