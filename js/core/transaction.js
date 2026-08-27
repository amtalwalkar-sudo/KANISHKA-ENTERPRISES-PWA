// KFE foundation transaction boundary for atomic multi-store operations.
export function runAtomicTransaction(db,storeNames,operation){
  if(!db) throw new TypeError('IndexedDB connection is required');
  if(!Array.isArray(storeNames)||storeNames.length===0) throw new TypeError('At least one object store is required');
  if(new Set(storeNames).size!==storeNames.length) throw new TypeError('Duplicate object stores are not allowed');
  if(typeof operation!=='function') throw new TypeError('Transaction operation must be a function');
  return new Promise((resolve,reject)=>{
    let settled=false,result;
    let transaction;
    try{
      transaction=db.transaction(storeNames,'readwrite');
      transaction.oncomplete=()=>{if(!settled){settled=true;resolve(result);}};
      transaction.onerror=()=>{if(!settled){settled=true;reject(transaction.error||new Error('IndexedDB transaction failed'));}};
      transaction.onabort=()=>{if(!settled){settled=true;reject(transaction.error||new Error('IndexedDB transaction aborted'));}};
      const stores=Object.freeze(Object.fromEntries(storeNames.map(name=>[name,transaction.objectStore(name)])));
      result=operation(stores,transaction);
    }catch(error){try{transaction?.abort();}catch{}if(!settled){settled=true;reject(error);}}
  });
}
export function requestResult(request){return new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('IndexedDB request failed'));});}
