const live=rows=>rows.filter(row=>!row?.is_deleted);
const dateOf=row=>String(row?.business_date||row?.date||row?.recorded_at||row?.created_at||'').slice(0,10);
const monthOf=row=>dateOf(row).slice(0,7);
const paiseOf=row=>Number(row?.amount_paise??row?.cost_paise??0);
const sum=rows=>rows.reduce((total,row)=>total+paiseOf(row),0);
const monthDays=(year,month)=>new Date(Date.UTC(year,month,0)).getUTCDate();

export async function adminReadModel({repository,asOf=new Date().toISOString()}={}){
  if(!repository?.entity)throw new TypeError('Admin read model requires repository');
  const today=String(asOf).slice(0,10),month=today.slice(0,7);
  const [vehicles,drivers,assignments,revenue,fuel,maintenance,compliance,loans,calculations,fixedExpenses]=await Promise.all([
    repository.entity('vehicles').list(),repository.entity('drivers').list(),repository.entity('vehicle_driver_assignments').list(),
    repository.entity('revenue_records').list(),repository.entity('fuel_records').list(),repository.entity('maintenance_records').list(),
    repository.entity('renewals_compliance').list(),repository.entity('loans').list(),repository.entity('calculation_results').list(),repository.entity('fixed_expenses').list()
  ]);
  const activeVehicles=live(vehicles).filter(v=>v.lifecycle_status==='ACTIVE');
  const vehicle=activeVehicles[0]||live(vehicles)[0]||null;
  const activeAssignments=live(assignments).filter(a=>a.status==='ACTIVE'&&!a.end_date);
  const currentAssignment=vehicle?activeAssignments.find(a=>a.vehicle_id===vehicle.id):null;
  const driver=currentAssignment?live(drivers).find(d=>d.id===currentAssignment.driver_id):null;
  const latestCalculation=live(calculations).filter(r=>monthOf(r)===month).sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)))[0]||null;
  const monthRevenue=live(revenue).filter(r=>monthOf(r)===month&&String(r.scope||'BUSINESS')==='BUSINESS');
  const monthFuel=live(fuel).filter(r=>monthOf(r)===month&&String(r.scope||'BUSINESS')==='BUSINESS');
  const monthMaintenance=live(maintenance).filter(r=>monthOf(r)===month&&String(r.scope||'BUSINESS')==='BUSINESS');
  const monthCompliance=live(compliance).filter(r=>monthOf(r)===month&&String(r.scope||'BUSINESS')==='BUSINESS');
  const financial=latestCalculation?.result||latestCalculation?.value||null;
  const revenuePaise=financial?.revenuePaise??financial?.revenue_paise??(monthRevenue.length?sum(monthRevenue):null);
  const businessKm=monthRevenue.length?live(await repository.entity('work_sessions').list()).filter(r=>monthOf(r)===month&&String(r.scope||'BUSINESS')==='BUSINESS').reduce((n,r)=>n+Number(r.business_km||0),0):null;
  const days=monthDays(Number(month.slice(0,4)),Number(month.slice(5,7)));
  const costsPaise=financial?.costsPaise??financial?.costs_paise??null;
  const profitPaise=financial?.netProfitPaise??financial?.profit_paise??null;
  const breakEvenPaise=financial?.breakEvenPaise??financial?.break_even_paise??null;
  const currentPaise=financial?.currentRevenuePaise??revenuePaise;
  const remainingPaise=breakEvenPaise!=null&&currentPaise!=null?breakEvenPaise-currentPaise:null;
  const weeks=Array.from({length:5},(_,i)=>({week:i+1,revenuePaise:null,businessCostPaise:null,profitPaise:null}));
  return Object.freeze({
    version:1,asOf,month,today,
    currentState:Object.freeze({vehicle,driver,online:null,odometer:vehicle?.current_odometer??null,businessKm:businessKm??null}),
    attention:Object.freeze([]),
    insight:vehicle?'Vehicle and driver state are available from authoritative records.':'Vehicle state is not yet available from authoritative records.',
    profitability:Object.freeze({status:profitPaise==null?'UNAVAILABLE':profitPaise>=0?'PROFITABLE':'LOSS',profitPaise,costPerKmPaise:costsPaise!=null&&businessKm>0?costsPaise/businessKm:null,profitPerKmPaise:profitPaise!=null&&businessKm>0?profitPaise/businessKm:null,marginPaise:profitPaise!=null&&revenuePaise>0?profitPaise/revenuePaise:null}),
    breakEven:Object.freeze({status:breakEvenPaise==null?'UNAVAILABLE':currentPaise>=breakEvenPaise?'ABOVE BREAK-EVEN':'BELOW BREAK-EVEN',breakEvenPaise,currentPaise,remainingPaise}),
    month:Object.freeze({revenuePaise,costsPaise,profitPaise,fuelPaise:monthFuel.length?sum(monthFuel):null,maintenancePaise:monthMaintenance.length?sum(monthMaintenance):null,compliancePaise:monthCompliance.length?sum(monthCompliance):null,businessKm}),
    weekly:Object.freeze(weeks.map(Object.freeze)),
    fixedExpenses:Object.freeze(live(fixedExpenses)),
    financialAvailable:Boolean(financial),
    allocationInputs:Object.freeze({maintenanceSourceRecords:monthMaintenance.length,complianceSourceRecords:monthCompliance.length,loanSourceRecords:loans.filter(r=>!r?.is_deleted).length,calendarDays:days})
  });
}
