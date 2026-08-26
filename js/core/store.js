// Screen-scoped state boundary. No business calculations live here.
export function createStore(initial={}){const state=structuredClone(initial);return{get(screen){return state[screen];},set(screen,value){state[screen]=value;},snapshot(){return structuredClone(state);}}}
