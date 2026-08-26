// Persistence boundary. UI, view-models and domain code never access storage directly.
const KEY='kfe:state:v1';

function clone(value){return structuredClone(value);}

function storageOrNull(){
  try{
    if(typeof localStorage==='undefined') return null;
    const probe='__kfe_repository_probe__';
    localStorage.setItem(probe,'1');
    localStorage.removeItem(probe);
    return localStorage;
  }catch{return null;}
}

export function createRepository({storage=storageOrNull(),key=KEY,initial={}}={}){
  let memory=clone(initial);
  let hydrated=false;
  return {
    load(){
      if(hydrated) return clone(memory);
      hydrated=true;
      try{
        const raw=storage?.getItem(key);
        memory=raw?JSON.parse(raw):clone(initial);
      }catch{memory=clone(initial);}
      return clone(memory);
    },
    save(next){
      memory=clone(next);
      try{storage?.setItem(key,JSON.stringify(memory));}catch{/* memory remains authoritative for this session */}
      return clone(memory);
    },
    clear(){
      memory=clone(initial);
      try{storage?.removeItem(key);}catch{}
      return clone(memory);
    }
  };
}
