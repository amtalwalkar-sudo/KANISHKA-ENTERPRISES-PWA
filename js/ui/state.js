export const UI_STATES=Object.freeze({IDLE:'IDLE',LOADING:'LOADING',READY:'READY',EMPTY:'EMPTY',ERROR:'ERROR',OFFLINE:'OFFLINE'});

export function createUiState(initial=UI_STATES.IDLE){
  let state=initial;
  let error=null;
  const listeners=new Set();
  const emit=()=>listeners.forEach(fn=>fn({state,error}));
  return {
    get state(){return state;},
    get error(){return error;},
    set(next,nextError=null){state=next;error=nextError;emit();},
    subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}
  };
}
