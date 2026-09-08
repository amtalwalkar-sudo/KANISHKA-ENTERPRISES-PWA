import {active,result,DATA} from './shared.js';
export const WORK_CALCULATION_VERSION=1;
export const DEFAULT_ODOMETER_WARNING_KM=1500;
export function evaluateWorkOdometer(newReading,previousReading,thresholdKm=1000){const safeThreshold=typeof thresholdKm==='number'&&Number.isFinite(thresholdKm)&&thresholdKm>0?thresholdKm:1000;if(typeof newReading!=='number'||!Number.isFinite(newReading)||newReading<0||typeof previousReading!=='number'||!Number.isFinite(previousReading)||previousReading<0)return {isValid:false,delta:0,requiresConfirmation:false,code:'INVALID_NUMERIC_INPUT'};if(newReading<previousReading)return {isValid:false,delta:newReading-previousReading,requiresConfirmation:false,code:'DECREASING_ODOMETER'};const delta=newReading-previousReading;const requiresConfirmation=delta>safeThreshold;return {isValid:true,delta,requiresConfirmation,code:requiresConfirmation?'LARGE_DELTA_WARNING':'OK'};}
export function validateWorkOdometer(reading,previous=null){if(previous==null){if(typeof reading!=='number'||!Number.isFinite(reading)||reading<0)throw new RangeError('Invalid odometer');return true;}const evaluation=evaluateWorkOdometer(reading,previous);if(!evaluation.isValid)throw new RangeError(evaluation.code==='DECREASING_ODOMETER'?'Odometer cannot decrease':'Invalid odometer');return true;}
export function businessDateFromShiftStart(startAt){if(typeof startAt!=='string')return null;const match= /^(\d{4}-\d{2}-\d{2})/.exec(startAt);return match?match[1]:null;}
export function odometerAnomalyWarning(start,end,elapsedDays=1,thresholdKm=DEFAULT_ODOMETER_WARNING_KM){validateWorkOdometer(end,start);const daily=(end-start)/Math.max(elapsedDays,1/24);return {warning:daily>thresholdKm,dailyKm:daily,thresholdKm};}
export function calculateWorkSession(session){
  if(!session||session.scope==='PERSONAL')throw new RangeError('Personal trips are separate from business shifts');
  const start=Number(session.start_odometer),end=Number(session.end_odometer);
  if(!Number.isFinite(start)||!Number.isFinite(end))return result(null,DATA.UNKNOWN,[session.id]);
  validateWorkOdometer(end,start);
  const businessDate=session.business_date||businessDateFromShiftStart(session.start_at);
  return result({workKm:end-start,startOdometer:start,endOdometer:end,breakMinutes:Number(session.break_minutes||0),personal:false,businessDate},DATA.ACTUAL,[session.id]);
}
export function recoverDanglingShifts(workSessions,now=new Date().toISOString(),maxAgeHours=16){const cutoff=Date.parse(now)-maxAgeHours*3600000;return active(workSessions).filter(s=>s.status==='OPEN'&&Date.parse(s.start_at)<cutoff).map(s=>({id:s.id,requiresResolution:true,startedAt:s.start_at}));}
export function rolling7DayKm(workSessions,asOf=new Date().toISOString()){
  const end=Date.parse(asOf),start=end-6*86400000;
  const rows=active(workSessions).filter(s=>s.scope!=='PERSONAL'&&s.end_at&&Date.parse(s.end_at)>=start&&Date.parse(s.end_at)<=end&&Number.isFinite(s.start_odometer)&&Number.isFinite(s.end_odometer));
  if(!rows.length)return result(null,DATA.INSUFFICIENT_DATA,[]);
  const byDay=new Map();
  for(const s of rows){const d=s.business_date||businessDateFromShiftStart(s.start_at)||s.end_at.slice(0,10);byDay.set(d,(byDay.get(d)||0)+Math.max(0,s.end_odometer-s.start_odometer));}
  return result([...byDay.values()].reduce((a,b)=>a+b,0)/7,DATA.PROJECTED,rows.map(r=>r.id));
}
export function expectedTomorrowKm(workSessions,asOf=new Date().toISOString()){return rolling7DayKm(workSessions,asOf);}
