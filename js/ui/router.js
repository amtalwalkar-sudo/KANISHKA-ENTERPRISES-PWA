const DEFAULT_ROUTE='Work';
const ROUTE_HISTORY_KEY='kfe:ui-route-history';

function decodeHash(value){
  try{return decodeURIComponent(String(value||''));}catch{return String(value||'');}
}

function normalize(path){
  const value=decodeHash(path).replace(/^\/+|\/+$/g,'');
  return value||DEFAULT_ROUTE;
}

function readLocationRoute(){
  return normalize(globalThis.location?.hash?.slice(1)||DEFAULT_ROUTE);
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

export function createUiRouter({initialPath=readLocationRoute(),onChange=()=>{},onBack=()=>{}}={}){
  let current=normalize(initialPath);
  let routeHistory=readHistory(current);
  if(routeHistory[routeHistory.length-1]!==current) routeHistory.push(current);
  let listening=false;

  const notify=()=>onChange(current);
  const syncFromLocation=()=>{
    const next=readLocationRoute();
    const changed=next!==current;
    current=next;
    if(routeHistory[routeHistory.length-1]!==next){
      routeHistory.push(next);
      writeHistory(routeHistory);
    }
    if(changed) notify();
  };
  const onHashChange=()=>syncFromLocation();
  const onPopState=()=>syncFromLocation();

  return {
    get route(){return current;},
    get history(){return [...routeHistory];},
    start(){
      if(listening)return;
      listening=true;
      globalThis.addEventListener?.('hashchange',onHashChange);
      globalThis.addEventListener?.('popstate',onPopState);
      syncFromLocation();
      notify();
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
      notify();
      if(globalThis.location && globalThis.location.hash!==`#${next}`) globalThis.location.hash=next;
    },
    handleBack(){this.back();},
    back(){
      if(routeHistory.length>1){
        routeHistory.pop();
        const previous=routeHistory[routeHistory.length-1]||DEFAULT_ROUTE;
        current=previous;
        writeHistory(routeHistory);
        notify();
        if(globalThis.location && globalThis.location.hash!==`#${previous}`) globalThis.location.hash=previous;
        onBack(previous);
        return;
      }
      if(current!==DEFAULT_ROUTE)this.navigate(DEFAULT_ROUTE);
      else onBack(DEFAULT_ROUTE);
    }
  };
}

export {DEFAULT_ROUTE};
