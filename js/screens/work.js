import {calculateWorkDuration,calculateWorkKm} from '../domain/work.js';
export function createWorkScreen({state}){return{getViewModel(){const s=state.get('work')||{};return{...s,durationMs:calculateWorkDuration(s.startMs,s.endMs),km:calculateWorkKm(s.startOdometer,s.endOdometer)};}};}
