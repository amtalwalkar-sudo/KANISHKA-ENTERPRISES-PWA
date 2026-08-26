// Hardware boundary: keeps the screen awake only while the critical loop is active.
export function createWakeLock(){
  let sentinel=null;
  let enabled=false;
  const acquire=async()=>{
    if(!('wakeLock' in navigator)||document.visibilityState!=='visible')return false;
    try{sentinel=await navigator.wakeLock.request('screen');enabled=true;sentinel.addEventListener('release',()=>{enabled=false;sentinel=null;});return true;}catch{return false;}
  };
  const release=async()=>{try{await sentinel?.release();}catch{}sentinel=null;enabled=false;};
  const onVisible=()=>{if(enabled)void acquire();};
  document.addEventListener('visibilitychange',onVisible);
  return {acquire,release,isActive:()=>enabled,dispose(){document.removeEventListener('visibilitychange',onVisible);void release();}};
}
