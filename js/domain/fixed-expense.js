import {paise} from './shared.js';
import {isIsoUtcTimestamp} from '../core/effective-date.js';

export const FIXED_EXPENSE_FREQUENCIES=Object.freeze({MONTHLY:'MONTHLY'});
export const FIXED_EXPENSE_STATUS=Object.freeze({ACTIVE:'ACTIVE',INACTIVE:'INACTIVE'});
export const FIXED_EXPENSE_DOMAIN_VERSION=1;
const text=v=>String(v??'').trim();
const key=v=>text(v).toUpperCase();

export function assertFixedExpenseAmountPaise(value){
  if(!Number.isSafeInteger(value)||value<=0)throw new RangeError('Fixed expense amount must be a positive integer number of paise');
  return value;
}
export function assertFixedExpenseFrequency(value){
  const frequency=key(value);
  if(frequency!==FIXED_EXPENSE_FREQUENCIES.MONTHLY)throw new RangeError('Fixed expense frequency must be MONTHLY');
  return frequency;
}
export function assertFixedExpenseStatus(value){
  const status=key(value);
  if(!Object.values(FIXED_EXPENSE_STATUS).includes(status))throw new RangeError('Invalid fixed expense status');
  return status;
}
export function assertFixedExpenseLifecycle({effective_from,effective_to=null,status=FIXED_EXPENSE_STATUS.ACTIVE}={}){
  if(!isIsoUtcTimestamp(effective_from))throw new TypeError('Fixed expense requires effective_from as an ISO/UTC timestamp');
  if(effective_to!==null&&!isIsoUtcTimestamp(effective_to))throw new TypeError('Fixed expense effective_to must be an ISO/UTC timestamp or null');
  if(effective_to!==null&&effective_to<=effective_from)throw new RangeError('Fixed expense effective_to must be later than effective_from');
  return Object.freeze({effective_from,effective_to,status:assertFixedExpenseStatus(status)});
}
export function normalizeFixedExpenseInput(input={}){
  const name=text(input.name||input.category);
  if(!name)throw new RangeError('Fixed expense name is required');
  const category=text(input.category||name);
  const frequency=assertFixedExpenseFrequency(input.frequency||FIXED_EXPENSE_FREQUENCIES.MONTHLY);
  const amount_paise=assertFixedExpenseAmountPaise(Number(input.amount_paise??Math.round(Number(input.amount||0)*100)));
  const lifecycle=assertFixedExpenseLifecycle(input);
  return Object.freeze({name,category,frequency,amount_paise,monthly_amount_paise:amount_paise,effective_from:lifecycle.effective_from,effective_to:lifecycle.effective_to,status:lifecycle.status,scope:'BUSINESS'});
}
export function overlapsFixedExpense(a,b){
  return String(a.effective_from)<String(b.effective_to||'9999-12-31T23:59:59.999Z')&&String(b.effective_from)<String(a.effective_to||'9999-12-31T23:59:59.999Z');
}
export function assertNoFixedExpenseOverlap(rows,candidate,ignoreId=null){
  const activeRows=(rows||[]).filter(row=>!row.is_deleted&&(row.status??FIXED_EXPENSE_STATUS.ACTIVE)===FIXED_EXPENSE_STATUS.ACTIVE&&row.id!==ignoreId);
  if(activeRows.some(row=>String(row.category||row.name).trim().toUpperCase()===candidate.category.trim().toUpperCase()&&overlapsFixedExpense(row,candidate)))throw new RangeError('Fixed expense configuration dates overlap for this category');
  return candidate;
}
export function isFixedExpenseEffectiveAt(record,at){
  assertFixedExpenseLifecycle({...record,status:record.status??FIXED_EXPENSE_STATUS.ACTIVE});
  if(!isIsoUtcTimestamp(at))throw new TypeError('Fixed expense evaluation date must be an ISO/UTC timestamp');
  return (record.status??FIXED_EXPENSE_STATUS.ACTIVE)===FIXED_EXPENSE_STATUS.ACTIVE&&!record.is_deleted&&record.effective_from<=at&&(record.effective_to===null||at<record.effective_to);
}
export function effectiveFixedExpenses(rows,at){return (rows||[]).filter(row=>isFixedExpenseEffectiveAt(row,at));}
export function fixedExpenseMonthlyAmount(rows,at){return effectiveFixedExpenses(rows,at).reduce((total,row)=>total+paise(row.monthly_amount_paise),0);}
