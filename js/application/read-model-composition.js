import {DATA} from '../domain/shared.js';
import {maintenanceBurnRates} from '../domain/maintenance.js';
import {fixedExpenseMonthlyAmount} from '../domain/fixed-expense.js';
export const PRESENTATION_READ_MODEL_VERSION=5;
const CONFIDENCE_STATES=new Set(Object.values(DATA));
function stateOf(value){const state=value?.dataConfidenceState;if(CONFIDENCE_STATES.has(state))return state;return value==null?DATA.UNKNOWN:DATA.ACTUAL;}
export function confidenceState(values=[]){if(!values.length)return DATA.UNKNOWN;const states=values.map(stateOf);if(states.includes(DATA.INSUFFICIENT_DATA))return DATA.INSUFFICIENT_DATA;if(states.includes(DATA.UNKNOWN))return DATA.UNKNOWN;if(states.includes(DATA.PROVISION))return DATA.PROVISION;if(states.includes(DATA.PROJECTED))return DATA.PROJECTED;if(states.includes(DATA.BASELINE))return DATA.BASELINE;return DATA.ACTUAL;}
export function dashboardReadModel({profitabilityResult,tomorrowTargetResult,alerts=[]}={}){return Object.freeze({version:PRESENTATION_READ_MODEL_VERSION,dataConfidenceState:confidenceState([profitabilityResult,tomorrowTargetResult]),profitability:profitabilityResult??null,tomorrowTarget:tomorrowTargetResult??null,alerts:Array.isArray(alerts)?Object.freeze([...alerts]):Object.freeze([])});}
function dateOf(record){return String(record?.business_date||record?.date||record?.recorded_at||record?.started_at||record?.created_at||'').slice(0,10);}
function amountOf(record){return Number(record?.amount_paise||0);}
function workSecondsOf(record){if(!record?.start_at&&!record?.started_at)return 0;const start=Date.parse(record.start_at||record.started_at);const end=Date.parse(record.end_at||record.ended_at||record.completed_at||'');if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)return 0;return Math.floor((end-start)/1000);}
function businessRows(rows,today){return rows.filter(r=>dateOf(r)===today&&String(r.scope||'BUSINESS')==='BUSINESS'&&!r.is_deleted);}
function calendarDays(date){const year=Number(date.slice(0,4)),month=Number(date.slice(5,7));return new Date(Date.UTC(year,month,0)).getUTCDate();}
function maintenanceAllocation(maintenanceRows,businessKm){
 const configured=maintenanceRows.filter(row=>Number.isFinite(Number(row.expected_km_life))&&Number(row.expected_km_life)>0&&Number.isFinite(Number(row.expected_cost_paise))&&Number(row.expected_cost_paise)>0);
 const pending=maintenanceRows.some(row=>!configured.includes(row));
 if(!configured.length)return {paise:maintenanceRows.length?null:0,pending};
 if(businessKm==null||businessKm<=0)return {paise:0,pending};
 const allocated=Math.round(configured.reduce((sum,row)=>sum+Number(maintenanceBurnRates(row).value.kmBurnPaisePerKm)*businessKm,0));
 return {paise:allocated,pending};
}
function tripDistance(row){const start=Number(row?.start_odometer),end=Number(row?.end_odometer);if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)return null;return end-start;}
function continuity(previousEndOdometer,currentStartOdometer){const previous=Number(previousEndOdometer),current=Number(currentStartOdometer);if(!Number.isFinite(current)||!Number.isFinite(previous))return {deltaKm:null,continuityStatus:'GAP'};const delta=current-previous;if(delta===0)return {deltaKm:0,continuityStatus:'CONTINUOUS'};if(delta>0)return {deltaKm:delta,continuityStatus:'GAP'};return {deltaKm:delta,continuityStatus:'DISCREPANCY'};}
function previousCompletedShift(shifts,currentStart){const current=Date.parse(String(currentStart||''));return shifts.filter(row=>row.scope==='BUSINESS'&&row.status==='COMPLETED'&&Number.isFinite(Number(row.end_odometer))&&Date.parse(String(row.ended_at||''))<current).sort((a,b)=>Date.parse(String(b.ended_at||''))-Date.parse(String(a.ended_at||'')))[0]||null;}
function buildCompletedShiftSummary({shifts,trips,revenue,expenses,businessDate}){
 const completed=shifts.filter(row=>row.scope==='BUSINESS'&&row.business_date===businessDate&&row.status==='COMPLETED'&&!row.is_deleted).sort((a,b)=>Date.parse(String(b.ended_at||''))-Date.parse(String(a.ended_at||'')));
 const shift=completed[0]||null;
 if(!shift)return Object.freeze({version:PRESENTATION_READ_MODEL_VERSION,businessDate,shiftId:null,status:'UNAVAILABLE',startedAt:null,endedAt:null,activeDutySeconds:null,businessDistanceKm:null,personalDistanceKm:null,revenuePaise:null,expensePaise:null,previousEndOdometer:null,currentStartOdometer:null,deltaKm:null,continuityStatus:'GAP'});
 const businessTrips=trips.filter(row=>row.scope==='BUSINESS'&&row.shift_id===shift.id&&row.status==='COMPLETED'&&!row.is_deleted);
 const businessDistances=businessTrips.map(tripDistance).filter(value=>value!=null);
 const businessDistanceKm=businessDistances.reduce((sum,value)=>sum+value,0);
 const personalDistanceKm=trips.filter(row=>row.scope==='PERSONAL'&&row.status==='COMPLETED'&&!row.is_deleted&&dateOf(row)===businessDate).map(tripDistance).filter(value=>value!=null).reduce((sum,value)=>sum+value,0);
 const linkedRevenue=revenue.filter(row=>row.scope!=='PERSONAL'&&!row.is_deleted&&row.work_session_id===shift.id).reduce((sum,row)=>sum+amountOf(row),0);
 const linkedExpenses=expenses.filter(row=>row.scope!=='PERSONAL'&&!row.is_deleted&&row.work_session_id===shift.id).reduce((sum,row)=>sum+amountOf(row),0);
 const previous=previousCompletedShift(shifts,shift.started_at);
 const continuity=continuityForShift(previous,shift);
 return Object.freeze({version:PRESENTATION_READ_MODEL_VERSION,businessDate,shiftId:shift.id,status:'COMPLETED',startedAt:shift.started_at??null,endedAt:shift.ended_at??null,activeDutySeconds:workSecondsOf(shift),businessDistanceKm,personalDistanceKm,revenuePaise:linkedRevenue,expensePaise:linkedExpenses,previousEndOdometer:previous?.end_odometer??null,currentStartOdometer:Number.isFinite(Number(shift.start_odometer))?Number(shift.start_odometer):null,...continuity});
}
function continuityForShift(previous,current){return continuity(previous?.end_odometer,current?.start_odometer);}
function buildDailyOperationalReport({shifts,trips,revenue,expenses,fuel,maintenance,loanPayments,fixedExpenses,businessDate}){
 const completedShifts=shifts.filter(row=>row.scope==='BUSINESS'&&row.business_date===businessDate&&row.status==='COMPLETED'&&!row.is_deleted).sort((a,b)=>Date.parse(String(a.started_at||''))-Date.parse(String(b.started_at||'')));
 const businessTrips=trips.filter(row=>row.scope==='BUSINESS'&&dateOf(row)===businessDate&&row.status==='COMPLETED'&&!row.is_deleted);
 const personalTrips=trips.filter(row=>row.scope==='PERSONAL'&&dateOf(row)===businessDate&&row.status==='COMPLETED'&&!row.is_deleted);
 const businessDistances=businessTrips.map(tripDistance).filter(value=>value!=null);
 const personalDistances=personalTrips.map(tripDistance).filter(value=>value!=null);
 const businessDistanceKm=businessDistances.reduce((sum,value)=>sum+value,0);
 const personalDistanceKm=personalDistances.reduce((sum,value)=>sum+value,0);
 const activeDutySeconds=completedShifts.reduce((sum,row)=>sum+workSecondsOf(row),0);
 const revenuePaise=businessRows(revenue,businessDate).reduce((sum,row)=>sum+amountOf(row),0);
 const expensePaise=businessRows(expenses,businessDate).reduce((sum,row)=>sum+amountOf(row),0);
 const fuelPaise=businessRows(fuel,businessDate).reduce((sum,row)=>sum+amountOf(row),0);
 const maintenanceRows=maintenance.filter(row=>String(row.scope||'BUSINESS')==='BUSINESS'&&!row.is_deleted&&dateOf(row)<=businessDate);
 const maintenanceResult=maintenanceAllocation(maintenanceRows,businessDistanceKm);
 const maintenancePaise=maintenanceResult.paise;
 const loanPaise=businessRows(loanPayments,businessDate).reduce((sum,row)=>sum+Number(row.payment_paise??row.amount_paise??0),0);
 const fixedMonthlyPaise=fixedExpenseMonthlyAmount(fixedExpenses,businessDate);
 const fixedOverheadPaise=fixedMonthlyPaise>0?Math.round(fixedMonthlyPaise/calendarDays(businessDate)):0;
 const totalExpensePaise=maintenancePaise==null?null:expensePaise+fuelPaise+maintenancePaise+loanPaise+fixedOverheadPaise;
 const firstShift=completedShifts[0]||null;
 const previous=firstShift?previousCompletedShift(shifts,firstShift.started_at):null;
 const continuityData=firstShift?continuityForShift(previous,firstShift):{deltaKm:null,continuityStatus:'GAP'};
 return Object.freeze({version:PRESENTATION_READ_MODEL_VERSION,businessDate,shiftCount:completedShifts.length,businessDistanceKm,personalDistanceKm,activeDutySeconds,revenuePaise,expensePaise,fuelPaise,maintenancePaise,loanPaise,fixedOverheadPaise,totalExpensePaise,previousEndOdometer:previous?.end_odometer??null,currentStartOdometer:Number.isFinite(Number(firstShift?.start_odometer))?Number(firstShift.start_odometer):null,...continuityData,maintenanceAllocationPending:maintenanceResult.pending,maintenanceAllocationAvailable:maintenancePaise!=null});
}
export async function performanceReadModel({repository,asOf=new Date().toISOString()}={}){
 const today=String(asOf).slice(0,10);
 const [revenue,expenses,fuel,work,maintenance,loanPayments,fixedExpenses]=await Promise.all([repository.entity('revenue_records').list(),repository.entity('expense_records').list(),repository.entity('fuel_records').list(),repository.entity('work_sessions').list(),repository.entity('maintenance_records').list(),repository.entity('loan_payments').list(),repository.entity('fixed_expenses').list()]);
 const businessRevenue=businessRows(revenue,today),businessExpenses=businessRows(expenses,today),businessFuel=businessRows(fuel,today),businessWork=businessRows(work,today),businessMaintenance=maintenance.filter(r=>String(r.scope||'BUSINESS')==='BUSINESS'&&!r.is_deleted),businessLoanPayments=businessRows(loanPayments,today);
 const revenuePaise=businessRevenue.length?businessRevenue.reduce((s,r)=>s+amountOf(r),0):null;
 const expensePaise=businessExpenses.length?businessExpenses.reduce((s,r)=>s+amountOf(r),0):0;
 const fuelPaise=businessFuel.length?businessFuel.reduce((s,r)=>s+amountOf(r),0):0;
 const businessKm=businessWork.length?businessWork.reduce((s,r)=>s+Number(r.business_km||0),0):null;
 const maintenanceResult=maintenanceAllocation(businessMaintenance,businessKm);
 const maintenancePaise=maintenanceResult.paise;
 const loanPaise=businessLoanPayments.length?businessLoanPayments.reduce((s,r)=>s+Number(r.payment_paise??r.amount_paise??0),0):0;
 const fixedMonthlyPaise=fixedExpenseMonthlyAmount(fixedExpenses,today);
 const fixedOverheadPaise=fixedMonthlyPaise>0?Math.round(fixedMonthlyPaise/calendarDays(today)):0;
 const hasCostActivity=Boolean(businessExpenses.length||businessFuel.length||businessMaintenance.length||businessLoanPayments.length||fixedMonthlyPaise>0);
 const maintenanceCostAvailable=maintenancePaise!=null;
 const runningCostPaise=hasCostActivity&&maintenanceCostAvailable?expensePaise+fuelPaise+maintenancePaise+fixedOverheadPaise+loanPaise:null;
 const balancePaise=revenuePaise!=null&&runningCostPaise!=null?revenuePaise-runningCostPaise:null;
 const revenuePerKmPaise=revenuePaise!=null&&businessKm>0?revenuePaise/businessKm:null;
 const fuelPerKmPaise=fuelPaise>0&&businessKm>0?fuelPaise/businessKm:null;
 const maintenancePerKmPaise=maintenancePaise!=null&&businessKm>0?maintenancePaise/businessKm:null;
 const runningCostPerKmPaise=runningCostPaise!=null&&businessKm>0?runningCostPaise/businessKm:null;
 const workSeconds=businessWork.length?businessWork.reduce((s,r)=>s+workSecondsOf(r),0):null;
 const history=Array.from(new Set([...revenue,...expenses,...fuel,...work,...maintenance,...loanPayments].map(dateOf).filter(Boolean))).sort().reverse().slice(0,31).map(date=>({date,revenuePaise:revenue.filter(r=>dateOf(r)===date&&String(r.scope||'BUSINESS')==='BUSINESS').reduce((s,r)=>s+amountOf(r),0),businessKm:work.filter(r=>dateOf(r)===date&&String(r.scope||'BUSINESS')==='BUSINESS').reduce((s,r)=>s+Number(r.business_km||0),0)}));
 const confidence=confidenceState([...businessRevenue,...businessExpenses,...businessFuel,...businessWork,...businessMaintenance,...businessLoanPayments]);
 const completedShiftSummary=buildCompletedShiftSummary({shifts:work,trips:[],revenue,expenses,businessDate:today});
 const dailyOperationalReport=buildDailyOperationalReport({shifts:work,trips:[],revenue,expenses,fuel,maintenance,loanPayments,fixedExpenses,businessDate:today});
 let brief='Today’s position is awaiting sufficient authoritative activity.';
 if(revenuePaise!=null&&runningCostPaise!=null&&businessKm!=null)brief=`${moneyText(revenuePaise)} earned, ${moneyText(runningCostPaise)} allocated operating cost, across ${businessKm.toFixed(1)} business KM.`;
 else if(revenuePaise!=null&&runningCostPaise!=null)brief=`${moneyText(revenuePaise)} earned with ${moneyText(runningCostPaise)} allocated operating cost today.`;
 else if(revenuePaise!=null)brief=`${moneyText(revenuePaise)} of business revenue recorded today.`;
 else if(businessKm!=null)brief=`${businessKm.toFixed(1)} business KM recorded today; revenue is still unavailable.`;
 const why=runningCostPaise!=null?'Running cost combines authoritative business fuel, expense, usage-allocated maintenance, daily fixed obligations and loan-payment records. Personal-use activity is excluded.':'Running cost is unavailable until all required authoritative business cost inputs are available.';
 return Object.freeze({version:PRESENTATION_READ_MODEL_VERSION,asOf,dataConfidenceState:confidence,revenuePaise,runningCostPaise,balancePaise,businessKm,revenuePerKmPaise,fuelPerKmPaise,maintenancePerKmPaise,runningCostPerKmPaise,workSeconds,todayTargetPaise:null,trajectory:null,trajectoryReason:'Target and trajectory remain unavailable until the complete frozen target/forecast chain has authoritative inputs.',brief,why,history:Object.freeze(history.map(Object.freeze)),personalUseSeparated:true,maintenanceAllocationPending:maintenanceResult.pending,fixedOverheadPaise,maintenancePaise,expensePaise,fuelPaise,loanPaise,maintenanceAllocationAvailable:maintenanceCostAvailable,expenseBreakdown:Object.freeze({fuelPaise,maintenancePaise,businessExpensePaise:expensePaise,loanPaise,fixedOverheadPaise}),getCompletedShiftSummary:()=>completedShiftSummary,getDailyOperationalReport:()=>dailyOperationalReport});
}
function moneyText(value){return `₹${(Number(value)/100).toFixed(2)}`;}
export function presentationError(error){return Object.freeze({dataConfidenceState:DATA.UNKNOWN,error:String(error?.message||error||'Unknown error')});}
