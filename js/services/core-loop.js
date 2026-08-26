import {createBackgroundTracking} from './background-tracking.js';
import {createWakeLock} from './wake-lock.js';

export function createCoreLoop({state,onStatus=()=>{}}={}){
  const wakeLock=createWakeLock();
  const tracking=createBackgroundTracking({
    onPosition:position=>{
      const work=state.get('work')||{};
      state.set('work',{...work,lastPosition:{latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy:position.coords.accuracy,timestamp:position.timestamp}});
    },
    onError:error=>onStatus({type:'location-error',error})
  });
  let onDuty=Boolean(state.get('work')?.onDuty);
  const setOnDuty=async value=>{
    onDuty=Boolean(value);
    state.update('work',work=>({...work,onDuty,startMs:onDuty?(work.startMs||Date.now()):work.startMs}));
    if(onDuty){tracking.start();await wakeLock.acquire();}
    else{tracking.stop();await wakeLock.release();}
    onStatus({type:'duty',onDuty});
    return getViewModel();
  };
  const getViewModel=()=>({onDuty,tracking:tracking.isActive(),wakeLock:wakeLock.isActive(),activeTrip:state.get('work')?.activeTrip||null,offline:!navigator.onLine,lastPosition:state.get('work')?.lastPosition||null});
  if(onDuty){tracking.start();void wakeLock.acquire();}
  return {setOnDuty,getViewModel,dispose(){tracking.dispose();wakeLock.dispose();}};
}
