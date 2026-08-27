import {active,result,DATA,paise} from './shared.js';
export const REVENUE_CALCULATION_VERSION=2;

export function businessRevenue(records){
  const rows=active(records).filter(r=>r.scope!=='PERSONAL');
  return result(rows.reduce((a,r)=>a+paise(r.amount_paise),0),DATA.ACTUAL,rows.map(r=>r.id));
}

export function personalRevenue(records){
  const rows=active(records).filter(r=>r.scope==='PERSONAL');
  return result(rows.reduce((a,r)=>a+paise(r.amount_paise),0),DATA.ACTUAL,rows.map(r=>r.id));
}
