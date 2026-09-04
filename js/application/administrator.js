import {createRecord,updateRecord} from '../core/record.js';

export const ADMINISTRATOR_VEHICLE_SOURCES=Object.freeze({ACQUISITION:10,MAINTENANCE:20,FUEL:30,WORK_SESSION:40,HISTORICAL_CORRECTION:100});
const ACTIVE='ACTIVE',INACTIVE='INACTIVE',RETIRED='RETIRED',SOLD='SOLD',TRANSFERRED='TRANSFERRED',DAY=/^\d{4}-\d{2}-\d{2}$/;
const text=v=>String(v??'').trim();
const norm=v=>text(v).toUpperCase();
const date=(v,n)=>{const x=text(v);if(!DAY.test(x))throw new RangeError(`${n} must be YYYY-MM-DD`);return x;};
const whole=(v,n)=>{const x=Number(v);if(!Number.isInteger(x)||x<0)throw new RangeError(`${n} must be a whole number`);return x;};
const money=(v,n)=>{const x=Number(v);if(!Number.isFinite(x)||x<0)throw new RangeError(`${n} must be non-negative`);return Math.round(x*100);};
const live=r=>r.filter(x=>!x.is_deleted);
const overlaps=(a,b)=>a.start_date<(b.end_date||'9999-12-31')&&b.start_date<(a.end_date||'9999-12-31');

export function createAdministratorApplication({repository}){
  if(!repository?.entity||!repository?.atomic)throw new TypeError('Administrator application requires repository');
  const V=()=>repository.entity('vehicles');
  const D=()=>repository.entity('drivers');
  const A=()=>repository.entity('vehicle_driver_assignments');
  const O=()=>repository.entity('vehicle_odometer_readings');
  const X=()=>repository.entity('vehicle_disposal_records');
  const L=()=>repository.entity('vehicle_lifecycle_events');

  const listVehicles=async()=>live(await V().list());
  const getVehicle=id=>V().get(id);
  const listDrivers=async()=>live(await D().list());
  const getDriver=id=>D().get(id);
  const listAssignments=async()=>live(await A().list());
  const listVehicleAssignments=async id=>(await listAssignments()).filter(x=>x.vehicle_id===id);
  const listDriverAssignments=async id=>(await listAssignments()).filter(x=>x.driver_id===id);
  const listOdometerHistory=async id=>(await O().list()).filter(x=>!x.is_deleted&&x.vehicle_id===id).sort((a,b)=>String(a.recorded_at).localeCompare(String(b.recorded_at))||Number(a.odometer)-Number(b.odometer));
  const listVehicleLifecycleHistory=async id=>(await L().list()).filter(x=>!x.is_deleted&&x.vehicle_id===id).sort((a,b)=>String(a.effective_date).localeCompare(String(b.effective_date))||String(a.created_at).localeCompare(String(b.created_at)));

  function uniqueRegistration(rows,value,ignore=null){
    if(!value)throw new RangeError('Registration Number is required');
    if(live(rows).some(r=>r.id!==ignore&&norm(r.registration_number)===value))throw new RangeError('Registration Number already exists');
  }

  async function createVehicle(i){
    const registration=norm(i.registration_number);
    uniqueRegistration(await V().list(),registration);
    const acquisition_date=date(i.acquisition_date,'Acquisition Date');
    const acquisition_type=norm(i.acquisition_type);
    if(!['NEW','USED'].includes(acquisition_type))throw new RangeError('Acquisition Type must be New or Used');
    if(!text(i.make)||!text(i.model))throw new RangeError('Make and Model are required');
    if(!text(i.fuel_type))throw new RangeError('Fuel Type is required');
    if(acquisition_type==='USED'&&(i.acquisition_odometer===''||i.acquisition_odometer==null))throw new RangeError('Acquisition Odometer is required for a used vehicle');
    const odo=whole(i.acquisition_odometer??0,'Acquisition Odometer');
    const r=createRecord({registration_number:registration,make:text(i.make),model:text(i.model),variant:text(i.variant),fuel_type:text(i.fuel_type),acquisition_date,acquisition_type,acquisition_odometer:odo,current_odometer:odo,acquisition_cost_paise:money(i.acquisition_cost??0,'Acquisition Cost'),lifecycle_status:ACTIVE,retirement_date:null,retirement_odometer:null,retirement_reason:null,sale_date:null,sale_odometer:null,sale_amount_paise:null,sale_reference:null,sale_notes:null,transfer_date:null,transfer_odometer:null,transfer_amount_paise:null,transfer_reference:null},{});
    const reading=createRecord({vehicle_id:r.id,odometer:odo,source:'ACQUISITION',source_precedence:ADMINISTRATOR_VEHICLE_SOURCES.ACQUISITION,recorded_at:`${acquisition_date}T00:00:00.000Z`,reason:'Acquisition baseline'},{});
    const lifecycle=createRecord({vehicle_id:r.id,event_type:'ACQUISITION',effective_date:acquisition_date,odometer:odo,amount_paise:r.acquisition_cost_paise,reason:'Vehicle acquired'},{});
    await repository.atomic(['vehicles','vehicle_odometer_readings','vehicle_lifecycle_events'],s=>{s.vehicles.put(r);s.vehicle_odometer_readings.put(reading);s.vehicle_lifecycle_events.put(lifecycle);return true;});
    return r;
  }

  async function updateVehicle(id,i){
    const e=await V().get(id);
    if(!e)throw new Error('Vehicle not found');
    const registration=norm(i.registration_number??e.registration_number);
    uniqueRegistration(await V().list(),registration,id);
    const acquisition_date=i.acquisition_date??e.acquisition_date;
    const acquisition_type=norm(i.acquisition_type??e.acquisition_type);
    const acquisition_odometer=i.acquisition_odometer==null?e.acquisition_odometer:whole(i.acquisition_odometer,'Acquisition Odometer');
    const acquisition_cost_paise=i.acquisition_cost==null?e.acquisition_cost_paise:money(i.acquisition_cost,'Acquisition Cost');
    if(!DAY.test(text(acquisition_date)))throw new RangeError('Acquisition Date must be YYYY-MM-DD');
    if(!['NEW','USED'].includes(acquisition_type))throw new RangeError('Acquisition Type must be New or Used');
    if(acquisition_type==='USED'&&acquisition_odometer==null)throw new RangeError('Acquisition Odometer is required for a used vehicle');
    if(Number(acquisition_odometer)>Number(e.current_odometer??acquisition_odometer))throw new RangeError('Acquisition Odometer cannot exceed current odometer');
    if(acquisition_date>String(e.retirement_date||e.sale_date||e.transfer_date||'9999-12-31'))throw new RangeError('Acquisition Date cannot follow a vehicle lifecycle endpoint');
    const n={...e,registration_number:registration,make:text(i.make??e.make),model:text(i.model??e.model),variant:text(i.variant??e.variant),fuel_type:text(i.fuel_type??e.fuel_type),acquisition_date,acquisition_type,acquisition_odometer,acquisition_cost_paise};
    const changed=e.acquisition_date!==n.acquisition_date||e.acquisition_odometer!==n.acquisition_odometer||e.acquisition_cost_paise!==n.acquisition_cost_paise||e.acquisition_type!==n.acquisition_type;
    const updated=updateRecord(e,n);
    let correction=null;
    if(changed)correction=createRecord({vehicle_id:e.id,event_type:'HISTORICAL_CORRECTION',effective_date:n.acquisition_date,odometer:Number(n.acquisition_odometer),amount_paise:Number(n.acquisition_cost_paise||0),reason:'Acquisition details corrected',previous_acquisition_date:e.acquisition_date,previous_acquisition_odometer:e.acquisition_odometer,previous_acquisition_cost_paise:e.acquisition_cost_paise,previous_acquisition_type:e.acquisition_type},{user_id:e.user_id});
    if(correction)await repository.atomic(['vehicles','vehicle_lifecycle_events'],s=>{s.vehicles.put(updated);s.vehicle_lifecycle_events.put(correction);return true;});
    else await repository.atomic(['vehicles'],s=>{s.vehicles.put(updated);return true;});
    return updated;
  }

  async function recordOdometer(i){
    const e=await V().get(i.vehicle_id);
    if(!e||e.is_deleted)throw new Error('Vehicle not found');
    if(e.lifecycle_status!==ACTIVE)throw new Error('Cannot record a new odometer reading for a vehicle that has left active use');
    const odo=whole(i.odometer,'Odometer');
    if(odo<Number(e.current_odometer??e.acquisition_odometer))throw new RangeError('Odometer cannot move backwards');
    const source=norm(i.source);
    if(!(source in ADMINISTRATOR_VEHICLE_SOURCES))throw new RangeError('Unknown odometer source');
    const recorded_at=i.recorded_at||new Date().toISOString();
    if(!Number.isFinite(new Date(recorded_at).getTime()))throw new RangeError('Odometer Recorded At must be a valid timestamp');
    const r=createRecord({vehicle_id:e.id,odometer:odo,source,source_precedence:ADMINISTRATOR_VEHICLE_SOURCES[source],recorded_at,reason:text(i.reason)},{});
    const u=updateRecord(e,{current_odometer:odo});
    await repository.atomic(['vehicle_odometer_readings','vehicles'],s=>{s.vehicle_odometer_readings.put(r);s.vehicles.put(u);return true;});
    return r;
  }

  function assignmentEndRecord(a,endDate){
    if(endDate<a.start_date)throw new RangeError('Assignment End Date cannot be before Start Date');
    return updateRecord(a,{status:INACTIVE,end_date:endDate});
  }

  async function closeVehicleAssignments(id,endDate){
    const rows=await listVehicleAssignments(id);
    const updates=rows.filter(a=>a.status===ACTIVE&&!a.end_date).map(a=>assignmentEndRecord(a,endDate));
    return updates;
  }

  async function retireVehicle(id,i){
    const e=await V().get(id);
    if(!e)throw new Error('Vehicle not found');
    if(e.lifecycle_status!==ACTIVE)throw new Error('Only an active vehicle can be retired');
    const day=date(i.retirement_date,'Retirement Date'),odo=whole(i.retirement_odometer,'Retirement Odometer');
    if(day<e.acquisition_date||odo<Number(e.current_odometer))throw new RangeError('Retirement endpoint cannot precede the authoritative vehicle state');
    const assignments=await closeVehicleAssignments(id,day);
    const u=updateRecord(e,{lifecycle_status:RETIRED,retirement_date:day,retirement_odometer:odo,retirement_reason:text(i.reason),current_odometer:odo});
    const event=createRecord({vehicle_id:id,event_type:'RETIREMENT',effective_date:day,odometer:odo,amount_paise:0,reason:text(i.reason)},{});
    await repository.atomic(['vehicles','vehicle_lifecycle_events','vehicle_driver_assignments'],s=>{s.vehicles.put(u);s.vehicle_lifecycle_events.put(event);for(const a of assignments)s.vehicle_driver_assignments.put(a);return true;});
    return u;
  }

  async function sellVehicle(id,i){
    const e=await V().get(id);
    if(!e)throw new Error('Vehicle not found');
    if(![ACTIVE,RETIRED].includes(e.lifecycle_status))throw new Error('Only an active or retired vehicle can be sold');
    const day=date(i.sale_date,'Sale Date'),odo=whole(i.sale_odometer,'Sale Odometer'),amount=money(i.sale_amount,'Sale Amount');
    if(day<e.acquisition_date||odo<Number(e.current_odometer))throw new RangeError('Sale endpoint cannot precede the authoritative vehicle state');
    if(e.retirement_date&&day<e.retirement_date)throw new RangeError('Sale Date cannot precede retirement date');
    if(amount<=0)throw new RangeError('Sale Amount must be positive');
    const assignments=await closeVehicleAssignments(id,day);
    const u=updateRecord(e,{lifecycle_status:SOLD,sale_date:day,sale_odometer:odo,sale_amount_paise:amount,sale_reference:text(i.sale_reference),sale_notes:text(i.sale_notes),current_odometer:odo});
    const event=createRecord({vehicle_id:id,event_type:'SALE',effective_date:day,odometer:odo,amount_paise:amount,reason:text(i.sale_notes),reference:text(i.sale_reference)},{});
    const disposal=createRecord({vehicle_id:id,disposal_type:'SALE',disposal_date:day,odometer:odo,amount_paise:amount,classification:'VEHICLE_DISPOSAL_PROCEEDS',reference:text(i.sale_reference)},{});
    await repository.atomic(['vehicles','vehicle_lifecycle_events','vehicle_disposal_records','vehicle_driver_assignments'],s=>{s.vehicles.put(u);s.vehicle_lifecycle_events.put(event);s.vehicle_disposal_records.put(disposal);for(const a of assignments)s.vehicle_driver_assignments.put(a);return true;});
    return u;
  }

  async function transferVehicle(id,i){
    const e=await V().get(id);
    if(!e)throw new Error('Vehicle not found');
    if(![ACTIVE,RETIRED].includes(e.lifecycle_status))throw new Error('Only an active or retired vehicle can be transferred');
    const day=date(i.transfer_date,'Transfer Date'),odo=whole(i.transfer_odometer,'Transfer Odometer');
    if(day<e.acquisition_date||odo<Number(e.current_odometer))throw new RangeError('Transfer endpoint cannot precede the authoritative vehicle state');
    if(e.retirement_date&&day<e.retirement_date)throw new RangeError('Transfer Date cannot precede retirement date');
    const amount=money(i.transfer_amount??0,'Transfer Amount');
    const assignments=await closeVehicleAssignments(id,day);
    const u=updateRecord(e,{lifecycle_status:TRANSFERRED,transfer_date:day,transfer_odometer:odo,transfer_amount_paise:amount,transfer_reference:text(i.transfer_reference),sale_notes:text(i.notes),current_odometer:odo});
    const event=createRecord({vehicle_id:id,event_type:'TRANSFER',effective_date:day,odometer:odo,amount_paise:amount,reason:text(i.notes),reference:text(i.transfer_reference)},{});
    await repository.atomic(['vehicles','vehicle_lifecycle_events','vehicle_driver_assignments'],s=>{s.vehicles.put(u);s.vehicle_lifecycle_events.put(event);for(const a of assignments)s.vehicle_driver_assignments.put(a);return true;});
    return u;
  }

  async function createDriver(i){
    const licence=norm(i.licence_number),rows=await D().list();
    if(!text(i.name))throw new RangeError('Driver name is required');
    if(!licence)throw new RangeError('Driving Licence Number is required');
    if(live(rows).some(x=>x.licence_number&&norm(x.licence_number)===licence))throw new RangeError('Driving Licence Number already exists');
    if(i.licence_expiry)date(i.licence_expiry,'Licence Expiry Date');
    return D().create({name:text(i.name),mobile:text(i.mobile),licence_number:licence,licence_expiry:i.licence_expiry||null,status:ACTIVE,added_date:i.added_date||new Date().toISOString().slice(0,10),deactivation_date:null,deactivation_reason:null},{});
  }

  async function updateDriver(id,i){
    const e=await D().get(id);if(!e)throw new Error('Driver not found');
    const licence=norm(i.licence_number??e.licence_number);
    if(live(await D().list()).some(x=>x.id!==id&&x.licence_number&&norm(x.licence_number)===licence))throw new RangeError('Driving Licence Number already exists');
    if(i.licence_expiry)date(i.licence_expiry,'Licence Expiry Date');
    return D().update(e,{name:text(i.name??e.name),mobile:text(i.mobile??e.mobile),licence_number:licence,licence_expiry:i.licence_expiry??e.licence_expiry});
  }

  async function deactivateDriver(id,i){
    const e=await D().get(id);if(!e)throw new Error('Driver not found');
    if(e.status!==ACTIVE)throw new Error('Driver is already inactive');
    const day=date(i.date||new Date().toISOString().slice(0,10),'Deactivation Date');
    const assignments=await listDriverAssignments(id);
    const updates=assignments.filter(a=>a.status===ACTIVE&&!a.end_date).map(a=>assignmentEndRecord(a,day));
    const u=updateRecord(e,{status:INACTIVE,deactivation_date:day,deactivation_reason:text(i.reason)});
    await repository.atomic(['drivers','vehicle_driver_assignments'],s=>{s.drivers.put(u);for(const a of updates)s.vehicle_driver_assignments.put(a);return true;});
    return u;
  }

  async function validateAssignmentTargets(driverId,vehicleId,start,current=null){
    const v=await V().get(vehicleId),d=await D().get(driverId);
    if(!v||v.is_deleted)throw new Error('Vehicle not found');
    if(!d||d.is_deleted)throw new Error('Driver not found');
    if(v.lifecycle_status!==ACTIVE)throw new Error('Driver cannot be assigned to an inactive or retired vehicle');
    if(d.status!==ACTIVE)throw new Error('Inactive driver cannot receive a new assignment');
    if(d.licence_expiry&&d.licence_expiry<start)throw new Error('Driver licence is expired for the assignment start date');
    const vehicleRows=(await listVehicleAssignments(v.id)).filter(a=>a.id!==current?.id);
    if(vehicleRows.some(a=>overlaps(a,{start_date:start,end_date:null})))throw new Error('Vehicle already has an active assignment');
    const driverRows=(await listDriverAssignments(d.id)).filter(a=>a.id!==current?.id);
    if(driverRows.some(a=>overlaps(a,{start_date:start,end_date:null})))throw new Error('Driver assignment dates overlap');
    return {v,d};
  }

  async function assignDriver(i){
    const start=date(i.start_date,'Assignment Start Date');
    const {v}=await validateAssignmentTargets(i.driver_id,i.vehicle_id,start);
    const assignment=createRecord({vehicle_id:v.id,driver_id:i.driver_id,start_date:start,end_date:null,status:ACTIVE,reason:text(i.reason)},{});
    await repository.atomic(['vehicle_driver_assignments'],s=>{s.vehicle_driver_assignments.put(assignment);return true;});
    return assignment;
  }

  async function reassignDriver(i){
    const current=(await listDriverAssignments(i.driver_id)).find(a=>a.status===ACTIVE&&!a.end_date);
    if(!current)throw new Error('Driver has no active assignment');
    const start=date(i.start_date,'Reassignment Date');
    if(start<=current.start_date)throw new RangeError('Reassignment date must be after the current assignment start date');
    const {v}=await validateAssignmentTargets(i.driver_id,i.new_vehicle_id,start,current);
    const closed=assignmentEndRecord(current,start);
    const next=createRecord({vehicle_id:v.id,driver_id:i.driver_id,start_date:start,end_date:null,status:ACTIVE,reason:text(i.reason)},{});
    await repository.atomic(['vehicle_driver_assignments'],s=>{s.vehicle_driver_assignments.put(closed);s.vehicle_driver_assignments.put(next);return true;});
    return next;
  }

  async function closeAssignment(id,i){
    const e=await A().get(id);if(!e)throw new Error('Assignment not found');
    const end=date(i.end_date,'Assignment End Date');
    const updated=assignmentEndRecord(e,end);
    await repository.atomic(['vehicle_driver_assignments'],s=>{s.vehicle_driver_assignments.put(updated);return true;});
    return updated;
  }

  async function vehicleUsage(id){
    const rows=live(await repository.entity('work_sessions').list()).filter(x=>x.vehicle_id===id);
    let businessKm=0,personalKm=0,unclassifiedKm=0;
    for(const r of rows){const s=Number(r.start_odometer),e=Number(r.end_odometer);if(!Number.isFinite(s)||!Number.isFinite(e)||e<s)continue;const km=e-s;if(norm(r.scope)==='BUSINESS')businessKm+=km;else if(norm(r.scope)==='PERSONAL')personalKm+=km;else unclassifiedKm+=km;}
    const v=await V().get(id);
    const endpoint=v?.lifecycle_status===SOLD?v.sale_odometer:v?.lifecycle_status===RETIRED?v.retirement_odometer:v?.lifecycle_status===TRANSFERRED?v.transfer_odometer:v?.current_odometer;
    return {lifetimeKm:endpoint==null?null:Number(endpoint)-Number(v?.acquisition_odometer),businessKm,personalKm,unclassifiedKm};
  }

  const listVehicleDisposals=async()=>live(await X().list());
  return Object.freeze({listVehicles,getVehicle,createVehicle,updateVehicle,recordOdometer,listOdometerHistory,listVehicleLifecycleHistory,retireVehicle,sellVehicle,transferVehicle,listDrivers,getDriver,createDriver,updateDriver,deactivateDriver,listAssignments,listVehicleAssignments,listDriverAssignments,assignDriver,reassignDriver,closeAssignment,vehicleUsage,listVehicleDisposals,odometerSourcePrecedence:ADMINISTRATOR_VEHICLE_SOURCES});
}
