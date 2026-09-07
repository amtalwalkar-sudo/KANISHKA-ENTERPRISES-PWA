const SOURCES=[
  ['work_sessions','Work Session'],
  ['rides','Business Trip'],
  ['fuel_records','Fuel'],
  ['expense_records','Expense'],
  ['revenue_records','Revenue'],
  ['maintenance_records','Maintenance'],
  ['renewals_compliance','Compliance Renewal'],
  ['loan_payments','Loan Payment'],
];

function eventTime(record){return record.occurredAt??record.occurred_at??record.timestamp??record.started_at??record.start_at??record.ended_at??record.end_at??record.recorded_at??record.date??record.created_at??record.createdAt??null;}
function toEvent(record,type){return {id:record.id??null,type,occurredAt:eventTime(record),recordedAt:record.recorded_at??record.created_at??null,description:record.description??record.notes??record.category??'',amount:record.amount??(record.amount_paise!=null?Number(record.amount_paise)/100:null),odometer:record.odometer??record.end_odometer??record.start_odometer??null,workDayId:record.work_day_id??null,shiftId:record.shift_id??null,rideId:record.ride_id??null,entityType:type,entityId:record.id??null,scope:record.scope??record.context?.scope??null,source:'AUTHORITATIVE',locationName:record.locationName??record.location_name??record.place_name??null,locationArea:record.locationArea??record.location_area??record.area??null,latitude:record.latitude??null,longitude:record.longitude??null,accuracy:record.accuracy??null,gpsAvailable:Boolean(record.gpsAvailable||record.location_status==='CAPTURED'||(record.latitude!=null&&record.longitude!=null)),dataConfidenceState:record.dataConfidenceState??'UNKNOWN',quantity:record.quantity_kg??record.quantity??null,unit:record.unit??(record.quantity_kg!=null?'kg':null),fuelType:record.fuel_type??null,reference:record.reference??record.reference_no??null,vehicle:record.vehicle??record.vehicle_name??null};}

export async function buildTimelineReadModel({repository,horizon='Day',asOf=new Date().toISOString()}={}){
  const groups=await Promise.all(SOURCES.map(async([store,type])=>(await repository.entity(store).list()).map(record=>toEvent(record,type))));
  const events=groups.flat().sort((a,b)=>String(b.occurredAt||'').localeCompare(String(a.occurredAt||'')));
  return Object.freeze({version:1,eventContract:'DORMANT_TIMELINE_APPLICATION_MODEL',horizon,asOf,events:Object.freeze(events),extensible:true});
}
