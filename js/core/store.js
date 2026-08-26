// Local-first state boundary. The store owns UI/application state; the repository owns persistence.
export function createStore(initial={},repository=null){
  let state=repository?repository.load():structuredClone(initial);
  const listeners=new Set();
  const publish=()=>listeners.forEach(fn=>fn(snapshot()));
  return {
    get(screen){return state[screen];},
    set(screen,value){
      state={...state,[screen]:structuredClone(value)};
      repository?.save(state);
      publish();
      return state[screen];
    },
    update(screen,updater){return this.set(screen,updater(structuredClone(state[screen])));},
    snapshot(){return structuredClone(state);},
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}
  };
}
