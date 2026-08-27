import {active,result,DATA,paise} from './shared.js';
export const EXPENSE_CALCULATION_VERSION=1;
export function businessExpenses(expenses){const rows=active(expenses).filter(e=>e.scope!=='PERSONAL');return result(rows.reduce((a,e)=>a+paise(e.amount_paise),0),DATA.ACTUAL,rows.map(e=>e.id));}
export function personalExpenses(expenses){const rows=active(expenses).filter(e=>e.scope==='PERSONAL');return result(rows.reduce((a,e)=>a+paise(e.amount_paise),0),DATA.ACTUAL,rows.map(e=>e.id));}
export function fixedExpensePerBusinessKm(fixedConfigs,businessKm,at){const cfg=active(fixedConfigs).filter(c=>c.effective_from<=at&&(c.effective_to==null||at<c.effective_to));if(!cfg.length||businessKm<=0)return result(null,DATA.INSUFFICIENT_DATA,cfg.map(c=>c.id),at);const monthly=cfg.reduce((a,c)=>a+paise(c.monthly_amount_paise),0);return result(Math.round(monthly/businessKm),DATA.ACTUAL,cfg.map(c=>c.id),at);}
