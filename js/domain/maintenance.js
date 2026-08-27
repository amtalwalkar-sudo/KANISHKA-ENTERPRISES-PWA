import {active,result,DATA,paise,daysBetween,multiplyPaiseByRatio} from './shared.js';
export const MAINTENANCE_CALCULATION_VERSION=2;

function triggerType(item){
  const type=String(item.trigger_type||'').toUpperCase();
  if(type!=='KM'&&type!=='TIME')throw new TypeError('Maintenance item must declare trigger_type KM or TIME');
  return type;
}

export function maintenanceProgress(item,{odometer,at}){
  const type=triggerType(item);
  if(type==='KM'){
    if(!Number.isSafeInteger(item.baseline_odometer)||!Number.isSafeInteger(odometer)||!Number.isSafeInteger(item.expected_km_life)||item.expected_km_life<=0)return {triggerType:type,ratio:null,remainingKm:null,progressNumerator:null,progressDenominator:null};
    const consumed=Math.max(0,odometer-item.baseline_odometer);
    return {triggerType:type,ratio:Math.min(1,consumed/item.expected_km_life),remainingKm:Math.max(0,item.expected_km_life-consumed),progressNumerator:consumed,progressDenominator:item.expected_km_life};
  }
  if(!item.baseline_date||!Number.isSafeInteger(item.expected_time_life_days)||item.expected_time_life_days<=0)return {triggerType:type,ratio:null,remainingDays:null,progressNumerator:null,progressDenominator:null};
  const elapsedMs=Math.max(0,Date.parse(new Date(at).toISOString())-Date.parse(new Date(item.baseline_date).toISOString()));
  const lifeMs=item.expected_time_life_days*86400000;
  return {triggerType:type,ratio:Math.min(1,elapsedMs/lifeMs),remainingDays:Math.max(0,item.expected_time_life_days-elapsedMs/86400000),progressNumerator:elapsedMs,progressDenominator:lifeMs};
}

export function provisionMaintenance(item,context){
  const p=maintenanceProgress(item,context);
  if(p.ratio==null)return result(null,DATA.INSUFFICIENT_DATA,[item.id],context.at||null);
  return result(multiplyPaiseByRatio(paise(item.expected_cost_paise),p.progressNumerator,p.progressDenominator),DATA.PROVISION,[item.id],context.at||null);
}

export function maintenanceBurnRates(item){
  const type=triggerType(item),cost=paise(item.expected_cost_paise);
  if(type==='KM'){
    if(!Number.isSafeInteger(item.expected_km_life)||item.expected_km_life<=0)return result(null,DATA.INSUFFICIENT_DATA,[item.id]);
    return result({triggerType:type,kmBurnPaisePerKm:cost/item.expected_km_life},DATA.BASELINE,[item.id]);
  }
  if(!Number.isSafeInteger(item.expected_time_life_days)||item.expected_time_life_days<=0)return result(null,DATA.INSUFFICIENT_DATA,[item.id]);
  return result({triggerType:type,timeBurnPaisePerDay:cost/item.expected_time_life_days},DATA.BASELINE,[item.id]);
}

export function reconcileInvoice(item,invoice,context){
  const provision=provisionMaintenance(item,context),actual=paise(invoice.amount_paise);
  const provisioned=provision.value==null?0:provision.value;
  return result({actualPaise:actual,provisionedPaise:provisioned,reconciliationPaise:actual-provisioned},DATA.ACTUAL,[item.id,invoice.id],context.at||null);
}

export function maintenanceAlerts(items,context){
  return active(items).flatMap(item=>{const p=maintenanceProgress(item,context);if(p.ratio==null)return [];const urgent=p.ratio>=0.9||(p.remainingKm!=null&&p.remainingKm<=500)||(p.remainingDays!=null&&p.remainingDays<=Number(item.alert_days||0));return urgent?[{itemId:item.id,kind:'MAINTENANCE_DUE',severity:p.ratio>=.9?'HIGH':'MEDIUM',dataConfidenceState:DATA.PROVISION}]:[];});
}
