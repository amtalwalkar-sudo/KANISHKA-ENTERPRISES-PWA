import {active,result,DATA,paise,daysBetween} from './shared.js';
export const MAINTENANCE_CALCULATION_VERSION=1;

/**
 * KFE 2.0 clean-room maintenance model.
 *
 * A maintenance item is STRICTLY single-dimension:
 * - KM based, OR
 * - time based.
 *
 * KM and time are never combined into a single progress ratio.
 * Provision, actual invoice and reconciliation remain separate concepts.
 */
export function maintenanceDimension(item){
  const hasKm=Number.isFinite(Number(item.expected_km_life))&&Number(item.expected_km_life)>0;
  const hasTime=Number.isFinite(Number(item.expected_time_life_days))&&Number(item.expected_time_life_days)>0;
  if(hasKm===hasTime) throw new RangeError('Maintenance item must be exactly one dimension: KM or time');
  return hasKm?'KM':'TIME';
}

export function maintenanceProgress(item,{odometer,at}){
  const dimension=maintenanceDimension(item);
  if(dimension==='KM'){
    if(!Number.isFinite(item.baseline_odometer)||!Number.isFinite(odometer))return {dimension,ratio:null,remainingKm:null};
    const consumed=Math.max(0,odometer-item.baseline_odometer);
    const life=Number(item.expected_km_life);
    return {dimension,ratio:Math.min(1,consumed/life),remainingKm:Math.max(0,life-consumed)};
  }
  if(!item.baseline_date||!Number.isFinite(Date.parse(item.baseline_date))||!Number.isFinite(Date.parse(at)))return {dimension,ratio:null,remainingDays:null};
  const consumedDays=Math.max(0,daysBetween(item.baseline_date,at));
  const life=Number(item.expected_time_life_days);
  return {dimension,ratio:Math.min(1,consumedDays/life),remainingDays:Math.max(0,life-consumedDays)};
}

export function provisionMaintenance(item,context){
  const p=maintenanceProgress(item,context);
  if(p.ratio==null)return result(null,DATA.UNKNOWN,[item.id]);
  return result(Math.round(paise(item.expected_cost_paise)*p.ratio),DATA.PROVISION,[item.id]);
}

export function maintenanceBurnRates(item){
  const dimension=maintenanceDimension(item);
  const cost=paise(item.expected_cost_paise);
  return result(
    dimension==='KM'
      ? {dimension,kmBurnPaisePerKm:cost/Number(item.expected_km_life),timeBurnPaisePerDay:null}
      : {dimension,kmBurnPaisePerKm:null,timeBurnPaisePerDay:cost/Number(item.expected_time_life_days)},
    DATA.BASELINE,
    [item.id]
  );
}

export function reconcileInvoice(item,invoice,context){
  const provision=provisionMaintenance(item,context);
  const actual=paise(invoice.amount_paise);
  const provisioned=provision.value==null?0:provision.value;
  return result({actualPaise:actual,provisionedPaise:provisioned,reconciliationPaise:actual-provisioned},DATA.ACTUAL,[item.id,invoice.id]);
}

export function maintenanceAlerts(items,context){
  return active(items).flatMap(item=>{
    const p=maintenanceProgress(item,context);
    if(p.ratio==null)return [];
    const urgent=p.ratio>=0.9 || (p.dimension==='KM'&&p.remainingKm<=500) || (p.dimension==='TIME'&&p.remainingDays<=Number(item.alert_days||0));
    return urgent?[{itemId:item.id,kind:'MAINTENANCE_DUE',severity:p.ratio>=0.9?'HIGH':'MEDIUM',dataConfidenceState:'PROVISION'}]:[];
  });
}
