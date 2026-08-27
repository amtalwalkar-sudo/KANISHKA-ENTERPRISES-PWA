import {active,result,DATA} from './shared.js';
export const WORK_CALCULATION_VERSION=1;
export const DEFAULT_ODOMETER_WARNING_KM=1500;
export function validateWorkOdometer(reading,previous=null){if(!Number.isFinite(reading)||reading<0)throw new RangeError('Invalid odometer');if(previous!=null&&reading<previous)throw new RangeError('Odometer cannot decrease');return true;}
export function odometerAnomalyWarning(start,end,elapsedDays=1,thresholdKm=DEFAULT_ODOMETER_WARNING_KM){validateWorkOdometer(end,start);const daily=(end-start)/Math.max(elapsedDays,1/24);return {warning:daily>thresholdKm,dailyKm:daily,thresholdKm};}
export function calculateWorkSession(session){const start=Number(session.start_odometer),end=Number(session.end_odometer);if(!Number.isFinite(start)||!Number.isFinite(end))return result(null,DATA.UNKNOWN,[session.id]);validateWorkOdometer(end,start);return result({workKm:end-start,startOdometer:start,endOdometer:end,breakMinutes:Number(session.break_minutes||0),personal:session.scope==='PERSONAL'},DATA.ACTUAL,[session.id]);}
export function recoverDanglingShifts(workSessions,now=new Date().toISOString(),maxAgeHours=16){const cutoff=Date.parse(now)-maxAgeHours*3600000;return active(workSessions).filter(s=>s.status==='OPEN'&&Date.parse(s.start_at)<cutoff).map(s=>({id:s.id,requiresResolution:true,startedAt:s.start_at}));}
export function rolling7DayKm(workSessions,asOf=new Date().toISOString()){
  const end=Date.parse(asOf),start=end-6*86400000;
  const rows=active(workSessions).filter(s=>s.scope!=='PERSONAL'&&s.end_at&&Date.parse(s.end_at)>=start&&Date.parse(s.end_at)<=end&&Number.isFinite(s.start_odometer)&&Number.isFinite(s.end_odometer));
  if(!rows.length)return result(null,DATA.INSUFFICIENT_DATA,[]);
  const byDay=new Map();
  for(const s of rows){const d=s.business_date||s.end_at.slice(0,10);byDay.set(d,(byDay.get(d)||0)+Math.max(0,s.end_odometer-s.start_odometer));}
  return result([...byDay.values()].reduce((a,b)=>a+b,0)/7,DATA.PROJECTED,rows.map(r=>r.id));
}
export function expectedTomorrowKm(workSessions,asOf=new Date().toISOString()){return rolling7DayKm(workSessions,asOf);}
