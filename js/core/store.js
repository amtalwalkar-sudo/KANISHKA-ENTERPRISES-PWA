// Local-first state boundary. The store owns UI/application state; the repository owns persistence.
export function createStore(initial={},repository=null){
  let state=structuredClone(initial);
  const listeners=new Set();
  const snapshot=()=>structuredClone(state);
  const publish=()=>listeners.forEach(fn=>fn(snapshot()));
  if(repository){Promise.resolve(repository.load()).then(next=>{state=structuredClone(next||initial);publish();}).catch(()=>{});}
  return {
    get(screen){return state[screen];},
    set(screen,value){state={...state,[screen]:structuredClone(value)};void repository?.save(state);publish();return state[screen];},
    update(screen,updater){return this.set(screen,updater(structuredClone(state[screen])));},
    snapshot,
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}
  };
}
