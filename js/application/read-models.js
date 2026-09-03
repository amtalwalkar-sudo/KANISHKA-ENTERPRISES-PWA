import {DATA} from '../domain/shared.js';
export const PRESENTATION_READ_MODEL_VERSION=3;
const CONFIDENCE_STATES=new Set(Object.values(DATA));
function stateOf(value){const state=value?.dataConfidenceState;if(CONFIDENCE_STATES.has(state))return state;return value==null?DATA.UNKNOWN:DATA.ACTUAL;}
export function confidenceState(values=[]){if(!values.length)return DATA.UNKNOWN;const states=values.map(stateOf);if(states.includes(DATA.INSUFFICIENT_DATA))return DATA.INSUFFICIENT_DATA;if(states.includes(DATA.UNKNOWN))return DATA.UNKNOWN;if(states.includes(DATA.PROVISION))return DATA.PROVISION;if(states.includes(DATA.PROJECTED))return DATA.PROJECTED;if(states.includes(DATA.BASELINE))return DATA.BASELINE;return DATA.ACTUAL;}
export function dashboardReadModel({profitabilityResult,tomorrowTargetResult,alerts=[]}={}){return Object.freeze({version:PRESENTATION_READ_MODEL_VERSION,dataConfidenceState:confidenceState([profitabilityResult,tomorrowTargetResult]),profitability:profitabilityResult??null,tomorrowTarget:tomorrowTargetResult??null,alerts:Array.isArray(alerts)?Object.freeze([...alerts]):Object.freeze([])});}
export function workSessionReadModel(session){if(!session)return Object.freeze({dataConfidenceState:DATA.UNKNOWN,session:null});return Object.freeze({dataConfidenceState:stateOf(session),session:Object.freeze({...session})});}
function dateOf(record){return String(record?.business_date||record?.date||record?.recorded_at||record?.started_at||record?.created_at||'').slice(0,10);}
function amountOf(record){return Number(record?.amount_paise||0);}
function workSecondsOf(record){if(!record?.start_at&&!record?.started_at)return 0;const start=Date.parse(record.start_at||record.started_at);const end=Date.parse(record.end_at||record.ended_at||record.completed_at||'');if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)return 0;return Math.floor((end-start)/1000);}
function businessRows(rows,today){return rows.filter(r=>dateOf(r)===today&&String(r.scope||'BUSINESS')==='BUSINESS'&&!r.is_deleted);}
export async function performanceReadModel({repository,asOf=new Date().toISOString()}={}){
 const today=String(asOf).slice(0,10);
 const [revenue,expenses,fuel,work,maintenance,loanPayments]=await Promise.all([repository.entity('revenue_records').list(),repository.entity('expense_records').list(),repository.entity('fuel_records').list(),repository.entity('work_sessions').list(),repository.entity('maintenance_records').list(),repository.entity('loan_payments').list()]);
 const businessRevenue=businessRows(revenue,today),businessExpenses=businessRows(expenses,today),businessFuel=businessRows(fuel,today),businessWork=businessRows(work,today),businessMaintenance=businessRows(maintenance,today),businessLoanPayments=businessRows(loanPayments,today);
 const revenuePaise=businessRevenue.length?businessRevenue.reduce((s,r)=>s+amountOf(r),0):null;
 const expensePaise=businessExpenses.length?businessExpenses.reduce((s,r)=>s+amountOf(r),0):0;
 const fuelPaise=businessFuel.length?businessFuel.reduce((s,r)=>s+amountOf(r),0):0;
 const maintenancePaise=businessMaintenance.length?businessMaintenance.reduce((s,r)=>s+amountOf(r),0):0;
 const loanPaise=businessLoanPayments.length?businessLoanPayments.reduce((s,r)=>s+amountOf(r),0):0;
 const hasCostActivity=Boolean(businessExpenses.length||businessFuel.length||businessMaintenance.length||businessLoanPayments.length);
 const runningCostPaise=hasCostActivity?expensePaise+fuelPaise+maintenancePaise+loanPaise:null;
 const balancePaise=revenuePaise!=null&&runningCostPaise!=null?revenuePaise-runningCostPaise:null;
 const businessKm=businessWork.length?businessWork.reduce((s,r)=>s+Number(r.business_km||0),0):null;
 const workSeconds=businessWork.length?businessWork.reduce((s,r)=>s+workSecondsOf(r),0):null;
 const revenuePerKmPaise=revenuePaise!=null&&businessKm>0?revenuePaise/businessKm:null;
 const runningCostPerKmPaise=runningCostPaise!=null&&businessKm>0?runningCostPaise/businessKm:null;
 const history=Array.from(new Set([...revenue,...expenses,...fuel,...work,...maintenance,...loanPayments].map(dateOf).filter(Boolean))).sort().reverse().slice(0,31).map(date=>({date,revenuePaise:revenue.filter(r=>dateOf(r)===date&&String(r.scope||'BUSINESS')==='BUSINESS').reduce((s,r)=>s+amountOf(r),0),businessKm:work.filter(r=>dateOf(r)===date&&String(r.scope||'BUSINESS')==='BUSINESS').reduce((s,r)=>s+Number(r.business_km||0),0)}));
 const confidence=confidenceState([...businessRevenue,...businessExpenses,...businessFuel,...businessWork,...businessMaintenance,...businessLoanPayments]);
 let brief='Today’s position is awaiting sufficient authoritative activity.';
 if(revenuePaise!=null&&runningCostPaise!=null&&businessKm!=null)brief=`${moneyText(revenuePaise)} earned, ${moneyText(runningCostPaise)} running cost, across ${businessKm.toFixed(1)} business KM.`;
 else if(revenuePaise!=null&&runningCostPaise!=null)brief=`${moneyText(revenuePaise)} earned with ${moneyText(runningCostPaise)} recorded running cost today.`;
 else if(revenuePaise!=null)brief=`${moneyText(revenuePaise)} of business revenue recorded today.`;
 else if(businessKm!=null)brief=`${businessKm.toFixed(1)} business KM recorded today; revenue is still unavailable.`;
 const why=runningCostPaise!=null?'Running cost combines today’s authoritative business fuel, expense, maintenance and loan-payment records. Fixed obligations and maintenance allocation remain governed by their domain models.':'Running cost is unavailable until authoritative business cost activity is recorded.';
 return Object.freeze({version:PRESENTATION_READ_MODEL_VERSION,asOf,dataConfidenceState:confidence,revenuePaise,runningCostPaise,balancePaise,businessKm,revenuePerKmPaise,runningCostPerKmPaise,workSeconds,todayTargetPaise:null,trajectory:null,trajectoryReason:'Target and trajectory remain unavailable until the complete frozen target/forecast chain has authoritative inputs.',brief,why,history:Object.freeze(history.map(Object.freeze)),personalUseSeparated:true,maintenanceAllocationPending:false,expensePaise,fuelPaise,maintenancePaise,loanPaise});
}
function moneyText(value){return `₹${(Number(value)/100).toFixed(2)}`;}
const TIMELINE_SOURCES=[['work_sessions','WORK_SESSION'],['fuel_records','FUEL'],['expense_records','EXPENSE'],['revenue_records','REVENUE'],['maintenance_records','MAINTENANCE'],['renewals_compliance','RENEWAL'],['loan_payments','LOAN_PAYMENT']];
function timelineEvent(record,type){const occurredAt=record.occurredAt||record.date||record.started_at||record.created_at||record.createdAt||record.timestamp;return {id:record.id||`${type}:${occurredAt||'unknown'}`,type,occurredAt:occurredAt||null,description:record.description||record.notes||record.category||null,amount:record.amount_paise!=null?Number(record.amount_paise)/100:record.amount!=null?Number(record.amount):null,odometer:record.odometer!=null?Number(record.odometer):null,locationName:record.locationName||record.location_name||null,dataConfidenceState:stateOf(record)};}
export async function timelineReadModel({repository}={}){const groups=await Promise.all(TIMELINE_SOURCES.map(async([store,type])=>{try{return (await repository.entity(store).list()).map(record=>timelineEvent(record,type));}catch{return []}}));const events=groups.flat().sort((a,b)=>String(b.occurredAt||'').localeCompare(String(a.occurredAt||'')));return Object.freeze({version:PRESENTATION_READ_MODEL_VERSION,dataConfidenceState:confidenceState(events),events:Object.freeze(events.map(event=>Object.freeze(event)))});}
export function presentationError(error){return Object.freeze({dataConfidenceState:DATA.UNKNOWN,error:String(error?.message||error||'Unknown error')});}
