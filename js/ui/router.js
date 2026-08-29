const DEFAULT_ROUTE='Work';

function normalize(path){
  const value=String(path||'').replace(/^\/+|\/+$/g,'');
  return value||DEFAULT_ROUTE;
}

export function createUiRouter({initialPath=globalThis.location?.hash?.slice(1)||DEFAULT_ROUTE,onChange=()=>{},onBack=()=>{}}={}){
  let current=normalize(initialPath);
  let listening=false;
  const notify=()=>onChange(current);
  const syncFromLocation=()=>{current=normalize(globalThis.location?.hash?.slice(1)||DEFAULT_ROUTE);notify();};
  const onHashChange=()=>syncFromLocation();
  const onPopState=()=>{onBack(current);syncFromLocation();};
  return {
    get route(){return current;},
    start(){
      if(listening)return;
      listening=true;
      globalThis.addEventListener?.('hashchange',onHashChange);
      globalThis.addEventListener?.('popstate',onPopState);
      syncFromLocation();
    },
    stop(){
      if(!listening)return;
      listening=false;
      globalThis.removeEventListener?.('hashchange',onHashChange);
      globalThis.removeEventListener?.('popstate',onPopState);
    },
    navigate(path){const next=normalize(path);if(next===current)return;current=next;if(globalThis.location)globalThis.location.hash=`${next}`;notify();},
    handleBack(){this.back();},
    back(){if(globalThis.history?.length>1)globalThis.history.back();else this.navigate(DEFAULT_ROUTE);}
  };
}

export {DEFAULT_ROUTE};
