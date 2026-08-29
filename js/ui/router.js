const DEFAULT_ROUTE='Work';
const ROUTE_HISTORY_KEY='kfe:ui-route-history';

function normalize(path){
  const value=String(path||'').replace(/^\/+|\/+$/g,'');
  return value||DEFAULT_ROUTE;
}

function readHistory(fallback){
  try{
    const raw=globalThis.sessionStorage?.getItem(ROUTE_HISTORY_KEY);
    const parsed=raw?JSON.parse(raw):null;
    return Array.isArray(parsed)&&parsed.length ? parsed.map(normalize) : [normalize(fallback)];
  }catch{return [normalize(fallback)];}
}

function writeHistory(stack){
  try{globalThis.sessionStorage?.setItem(ROUTE_HISTORY_KEY,JSON.stringify(stack));}catch{}
}

export function createUiRouter({initialPath=globalThis.location?.hash?.slice(1)||DEFAULT_ROUTE,onChange=()=>{},onBack=()=>{}}={}){
  let current=normalize(initialPath);
  let routeHistory=readHistory(current);
  if(routeHistory[routeHistory.length-1]!==current) routeHistory.push(current);
  let listening=false;
  let internalNavigation=false;
  const notify=()=>onChange(current);
  const syncFromLocation=()=>{
    const next=normalize(globalThis.location?.hash?.slice(1)||DEFAULT_ROUTE);
    current=next;
    if(routeHistory[routeHistory.length-1]!==next){routeHistory.push(next);writeHistory(routeHistory);}
    notify();
  };
  const onHashChange=()=>{if(internalNavigation){internalNavigation=false;return;}syncFromLocation();};
  const onPopState=()=>{syncFromLocation();};
  return {
    get route(){return current;},
    get history(){return [...routeHistory];},
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
    navigate(path){
      const next=normalize(path);
      if(next===current)return;
      current=next;
      routeHistory.push(next);
      writeHistory(routeHistory);
      if(globalThis.location){internalNavigation=true;globalThis.location.hash=next;}
      notify();
    },
    handleBack(){this.back();},
    back(){
      if(routeHistory.length>1){
        routeHistory.pop();
        const previous=routeHistory[routeHistory.length-1]||DEFAULT_ROUTE;
        current=previous;
        writeHistory(routeHistory);
        if(globalThis.location){internalNavigation=true;globalThis.location.hash=previous;}
        onBack(previous);
        notify();
        return;
      }
      if(current!==DEFAULT_ROUTE)this.navigate(DEFAULT_ROUTE);
      else onBack(DEFAULT_ROUTE);
    }
  };
}

export {DEFAULT_ROUTE};
