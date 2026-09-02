import {DATA} from '../domain/shared.js';
export const PRESENTATION_READ_MODEL_VERSION=2;
const CONFIDENCE_STATES=new Set(Object.values(DATA));
function stateOf(value){const state=value?.dataConfidenceState;if(CONFIDENCE_STATES.has(state))return state;return value==null?DATA.UNKNOWN:DATA.ACTUAL;}
export function confidenceState(values=[]){const states=values.map(stateOf);if(states.includes(DATA.INSUFFICIENT_DATA))return DATA.INSUFFICIENT_DATA;if(states.includes(DATA.UNKNOWN))return DATA.UNKNOWN;if(states.includes(DATA.PROVISION))return DATA.PROVISION;if(states.includes(DATA.PROJECTED))return DATA.PROJECTED;if(states.includes(DATA.BASELINE))return DATA.BASELINE;return DATA.ACTUAL;}
export function dashboardReadModel({profitabilityResult,tomorrowTargetResult,alerts=[]}={}){return Object.freeze({version:PRESENTATION_READ_MODEL_VERSION,dataConfidenceState:confidenceState([profitabilityResult,tomorrowTargetResult]),profitability:profitabilityResult??null,tomorrowTarget:tomorrowTargetResult??null,alerts:Array.isArray(alerts)?Object.freeze([...alerts]):Object.freeze([])});}
export function workSessionReadModel(session){if(!session)return Object.freeze({dataConfidenceState:DATA.UNKNOWN,session:null});return Object.freeze({dataConfidenceState:stateOf(session),session:Object.freeze({...session})});}
function dateOf(record){return String(record?.business_date||record?.date||record?.recorded_at||record?.started_at||record?.created_at||'').slice(0,10);}
function amountOf(record){return Number(record?.amount_paise||0);}
function workSecondsOf(record){if(!record?.start_at&&!record?.started_at)return 0;const start=Date.parse(record.start_at||record.started_at);const end=Date.parse(record.end_at||record.ended_at||record.completed_at||'');if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)return 0;return Math.floor((end-start)/1000);}
export async function performanceReadModel({repository,asOf=new Date().toISOString()}={}){
 const today=String(asOf).slice(0,10);
 const [revenue,expenses,fuel,work,maintenance]=await Promise.all([repository.entity('revenue_records').list(),repository.entity('expense_records').list(),repository.entity('fuel_records').list(),repository.entity('work_sessions').list(),repository.entity('maintenance_records').list()]);
 const businessRevenue=revenue.filter(r=>dateOf(r)===today&&String(r.scope||'BUSINESS')==='BUSINESS');
 const businessExpenses=expenses.filter(r=>dateOf(r)===today&&String(r.scope||'BUSINESS')==='BUSINESS');
 const businessFuel=fuel.filter(r=>dateOf(r)===today&&String(r.scope||'BUSINESS')==='BUSINESS');
 const businessWork=work.filter(r=>dateOf(r)===today&&String(r.scope||'BUSINESS')==='BUSINESS');
 const businessMaintenance=maintenance.filter(r=>dateOf(r)===today&&String(r.scope||'BUSINESS')==='BUSINESS');
 const revenuePaise=businessRevenue.reduce((s,r)=>s+amountOf(r),0);
 const expensePaise=businessExpenses.reduce((s,r)=>s+amountOf(r),0);
 const fuelPaise=businessFuel.reduce((s,r)=>s+amountOf(r),0);
 const businessKm=businessWork.reduce((s,r)=>s+Number(r.business_km||0),0);
 const workSeconds=businessWork.reduce((s,r)=>s+workSecondsOf(r),0);
 const runningCostPaise=null;
 const balancePaise=null;
 const revenuePerKmPaise=businessKm>0?revenuePaise/businessKm:null;
 const runningCostPerKmPaise=null;
 const history=Array.from(new Set([...revenue,...expenses,...fuel,...work].map(dateOf).filter(Boolean))).sort().reverse().slice(0,31).map(date=>({date,revenuePaise:revenue.filter(r=>dateOf(r)===date).reduce((s,r)=>s+amountOf(r),0),businessKm:work.filter(r=>dateOf(r)===date).reduce((s,r)=>s+Number(r.business_km||0),0)}));
 const confidence=confidenceState([...businessRevenue,...businessExpenses,...businessFuel,...businessWork]);
 let brief='Today’s position is awaiting sufficient authoritative activity.';
 if(revenuePaise>0&&businessKm>0)brief=`${moneyText(revenuePaise)} earned across ${businessKm.toFixed(1)} business KM.`;
 else if(revenuePaise>0)brief=`${moneyText(revenuePaise)} of business revenue recorded today.`;
 else if(businessKm>0)brief=`${businessKm.toFixed(1)} business KM recorded today; revenue is still unavailable.`;
 const why='Running cost, balance and trajectory remain unavailable until the complete authoritative allocation/target calculation chain is available.';
 return Object.freeze({version:PRESENTATION_READ_MODEL_VERSION,asOf,dataConfidenceState:confidence,revenuePaise,runningCostPaise,balancePaise,businessKm,revenuePerKmPaise,runningCostPerKmPaise,workSeconds,todayTargetPaise:null,trajectory:null,trajectoryReason:'Trajectory requires the frozen target/forecast calculation chain.',brief,why,history:Object.freeze(history.map(Object.freeze)),personalUseSeparated:true,maintenanceAllocationPending:businessMaintenance.length>0,expensePaise,fuelPaise});
}
function moneyText(value){return `₹${(Number(value)/100).toFixed(2)}`;}
const TIMELINE_SOURCES=[['work_sessions','WORK_SESSION'],['fuel_records','FUEL'],['expense_records','EXPENSE'],['revenue_records','REVENUE'],['maintenance_records','MAINTENANCE'],['renewals_compliance','RENEWAL'],['loan_payments','LOAN_PAYMENT']];
function timelineEvent(record,type){const occurredAt=record.occurredAt||record.date||record.started_at||record.created_at||record.createdAt||record.timestamp;return {id:record.id||`${type}:${occurredAt||'unknown'}`,type,occurredAt:occurredAt||null,description:record.description||record.notes||record.category||null,amount:record.amount_paise!=null?Number(record.amount_paise)/100:record.amount!=null?Number(record.amount):null,odometer:record.odometer!=null?Number(record.odometer):null,locationName:record.locationName||record.location_name||null,dataConfidenceState:stateOf(record)};}
export async function timelineReadModel({repository}={}){const groups=await Promise.all(TIMELINE_SOURCES.map(async([store,type])=>{try{return (await repository.entity(store).list()).map(record=>timelineEvent(record,type));}catch{return []}}));const events=groups.flat().sort((a,b)=>String(b.occurredAt||'').localeCompare(String(a.occurredAt||'')));return Object.freeze({version:PRESENTATION_READ_MODEL_VERSION,dataConfidenceState:confidenceState(events),events:Object.freeze(events.map(event=>Object.freeze(event)))});}
export function presentationError(error){return Object.freeze({dataConfidenceState:DATA.UNKNOWN,error:String(error?.message||error||'Unknown error')});}
