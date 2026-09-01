export const WORK_SCREEN_STATES=Object.freeze({
  DAY_START:'DAY_START',
  DAY_READY:'DAY_READY',
  SHIFT_WAITING:'SHIFT_WAITING',
  BUSINESS_TRIP:'BUSINESS_TRIP',
  PERSONAL_TRIP:'PERSONAL_TRIP',
  DAY_ENDED:'DAY_ENDED'
});

function finite(value){
  if(value===null||value===undefined||value==='')return null;
  const n=Number(value);
  return Number.isFinite(n)?n:null;
}

export function calculateOdometerDifference(prefilled,current){
  const previous=finite(prefilled),next=finite(current);
  if(next===null)throw new RangeError('A valid odometer reading is required');
  if(previous===null)return Object.freeze({difference:0,hasDifference:false});
  if(next<previous)throw new RangeError('Odometer cannot decrease');
  return Object.freeze({difference:next-previous,hasDifference:next!==previous});
}

export function validateKmAllocation(difference,{businessKm=0,personalKm=0}={}){
  const expected=Number(difference),business=Number(businessKm),personal=Number(personalKm);
  if(!Number.isInteger(expected)||expected<0)throw new RangeError('Invalid kilometre difference');
  if(!Number.isInteger(business)||business<0||!Number.isInteger(personal)||personal<0)throw new RangeError('Kilometre allocation must be non-negative whole kilometres');
  if(business+personal!==expected)throw new RangeError(`Allocate exactly ${expected} km`);
  return true;
}

export function deriveWorkScreenState({day,shift,trip,latestOdometer,todayBusinessTrips=0,todayRevenuePaise=0}={}){
  const dayStatus=day?.status==='COMPLETED'?'COMPLETED':day?.status==='OPEN'?'OPEN':'NOT_STARTED';
  let state=WORK_SCREEN_STATES.DAY_START;
  if(dayStatus==='OPEN'&&shift?.status==='OPEN'&&trip?.scope==='BUSINESS'&&trip?.status==='OPEN')state=WORK_SCREEN_STATES.BUSINESS_TRIP;
  else if(trip?.scope==='PERSONAL'&&trip?.status==='OPEN')state=WORK_SCREEN_STATES.PERSONAL_TRIP;
  else if(dayStatus==='OPEN'&&shift?.status==='OPEN')state=WORK_SCREEN_STATES.SHIFT_WAITING;
  else if(dayStatus==='OPEN')state=WORK_SCREEN_STATES.DAY_READY;
  else if(dayStatus==='COMPLETED')state=WORK_SCREEN_STATES.DAY_ENDED;
  return Object.freeze({
    state,
    day:Object.freeze({status:dayStatus,id:day?.id||null,businessDate:day?.business_date||null}),
    shift:Object.freeze({active:Boolean(shift),id:shift?.id||null,startedAt:shift?.started_at||null,startOdometer:shift?.start_odometer??null,status:shift?.status||'INACTIVE',tripCount:shift?Number(shift.trip_count||0):0}),
    trip:Object.freeze({active:Boolean(trip),id:trip?.id||null,scope:trip?.scope||null,type:trip?.trip_type||null,startedAt:trip?.started_at||null,startOdometer:trip?.start_odometer??null}),
    latestOdometer:latestOdometer==null?null:Number(latestOdometer),
    today:Object.freeze({businessTripCount:Number(todayBusinessTrips||0),revenuePaise:Number(todayRevenuePaise||0)})
  });
}

export function canStartDay({day,shift,trip}={}){return !day&&!shift&&!trip;}
export function canStartShift({day,shift,trip}={}){return day?.status==='OPEN'&&!shift&&!trip;}
export function canStartBusinessTrip({day,shift,trip}={}){return day?.status==='OPEN'&&shift?.status==='OPEN'&&!trip;}
export function canStartPersonalTrip({shift,trip}={}){return !shift&&!trip;}
export function canEndShift({shift,trip}={}){return shift?.status==='OPEN'&&!trip;}
export function canEndDay({day,shift,trip}={}){return day?.status==='OPEN'&&!shift&&!trip;}
