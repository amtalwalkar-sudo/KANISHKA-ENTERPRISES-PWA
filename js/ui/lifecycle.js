export function createUiLifecycle({onVisible=()=>{},onHidden=()=>{},onOnline=()=>{},onOffline=()=>{}}={}){
  let started=false;
  const visibility=()=>document.visibilityState==='visible'?onVisible():onHidden();
  const online=()=>onOnline();
  const offline=()=>onOffline();
  return {
    start(){if(started)return;started=true;document.addEventListener?.('visibilitychange',visibility);globalThis.addEventListener?.('online',online);globalThis.addEventListener?.('offline',offline);visibility();},
    stop(){if(!started)return;started=false;document.removeEventListener?.('visibilitychange',visibility);globalThis.removeEventListener?.('online',online);globalThis.removeEventListener?.('offline',offline);}
  };
}
