export function createUiLifecycle({onVisible=()=>{},onHidden=()=>{},onOnline=()=>{},onOffline=()=>{}}={}){
  let started=false;
  const visibility=()=>document.visibilityState==='visible'?onVisible():onHidden();
  const pageshow=()=>onVisible();
  const pagehide=()=>onHidden();
  const online=()=>onOnline();
  const offline=()=>onOffline();
  return {
    start(){
      if(started)return;
      started=true;
      document.addEventListener?.('visibilitychange',visibility);
      globalThis.addEventListener?.('pageshow',pageshow);
      globalThis.addEventListener?.('pagehide',pagehide);
      globalThis.addEventListener?.('online',online);
      globalThis.addEventListener?.('offline',offline);
      visibility();
    },
    stop(){
      if(!started)return;
      started=false;
      document.removeEventListener?.('visibilitychange',visibility);
      globalThis.removeEventListener?.('pageshow',pageshow);
      globalThis.removeEventListener?.('pagehide',pagehide);
      globalThis.removeEventListener?.('online',online);
      globalThis.removeEventListener?.('offline',offline);
    }
  };
}
