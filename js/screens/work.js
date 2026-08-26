import {calculateWorkDuration,calculateWorkKm} from '../domain/work.js';

export function createWorkScreen({state}){
  return {
    getViewModel(){
      const s=state.get('work')||{};
      return {
        ...s,
        durationMs:calculateWorkDuration(s.startMs,s.endMs),
        km:calculateWorkKm(s.startOdometer ?? s.startOdo,s.endOdometer ?? s.endOdo)
      };
    },
    startWork({startOdo,now=Date.now()}={}){
      const odo=Number(startOdo);
      if(!Number.isFinite(odo) || odo<0) throw new Error('Starting odometer must be a non-negative number');
      const current=state.get('work')||{};
      if(current.onDuty) throw new Error('Work session is already active');
      return state.set('work',{
        ...current,onDuty:true,startOdo:odo,startOdometer:odo,startMs:now,
        endOdo:null,endOdometer:null,endMs:null,status:'Open'
      });
    },
    endWork({endOdo,now=Date.now()}={}){
      const current=state.get('work')||{};
      const odo=Number(endOdo);
      const start=Number(current.startOdometer ?? current.startOdo);
      if(!current.onDuty) throw new Error('No active work session');
      if(!Number.isFinite(odo) || odo<=start) throw new Error('Ending odometer must be greater than starting odometer');
      return state.set('work',{
        ...current,onDuty:false,endOdo:odo,endOdometer:odo,endMs:now,status:'Closed'
      });
    }
  };
}
