import {createRecord} from '../core/record.js';

export const ADMINISTRATOR_VEHICLE_SOURCES=Object.freeze({ACQUISITION:10,MAINTENANCE:20,FUEL:30,WORK_SESSION:40,HISTORICAL_CORRECTION:100});
const ACTIVE='ACTIVE';
const INACTIVE='INACTIVE';
const RETIRED='RETIRED';
const SOLD='SOLD';
const TRANSFERRED='TRANSFERRED';
const DAY=/^\d{4}-\d{2}-\d{2}$/;

function text(value){return String(value??'').trim();}
function date(value,name){const v=text(value);if(!DAY.test(v))throw new RangeError(`${name} must be YYYY-MM-DD`);return v;}
function whole(value,name){const n=Number(value);if(!Number.isInteger(n)||n<0)throw new RangeError(`${name} must be a whole number`);return n;}
function money(value,name){const n=Number(value);if(!Number.isFinite(n)||n<0)throw new RangeError(`${name} must be non-negative`);return Math.round(n*100);}
function normalizedRegistration(value){return text(value).toUpperCase();}
function normalizedLicence(value){return text(value).toUpperCase();}
function live(rows){return rows.filter(row=>!row.is_deleted);}
function activeAssignment(rows){return rows.filter(row=>!row.is_deleted&&row.status==='ACTIVE'&&!row.end_date);}
function assertUniqueRegistration(rows,registration,ignoreId=null){const normalized=normalizedRegistration(registration);if(!normalized)throw new RangeError('Registration Number is required');if(live(rows).some(row=>row.id!==ignoreId&&normalizedRegistration(row.registration_number)===normalized))throw new RangeError('Registration Number already exists');}
function assertLifecycle(data){const acquisition=date(data.acquisition_date,'Acquisition Date');if(data.retirement_date&&date(data.retirement_date,'Retirement Date')<acquisition)throw new RangeError('Retirement Date cannot be before Acquisition Date');if(data.sale_date&&date(data.sale_date,'Sale Date')<acquisition)throw new RangeError('Sale Date cannot be before Acquisition Date');if(data.transfer_date&&date(data.transfer_date,'Transfer Date')<acquisition)throw new RangeError('Transfer Date cannot be before Acquisition Date');}
function assertAssignmentDates(data){const start=date(data.start_date,'Assignment Start Date');if(data.end_date&&date(data.end_date,'Assignment End Date')<start)throw new RangeError('Assignment End Date cannot be before Start Date');return start;}
function overlaps(a,b){const aEnd=a.end_date||'9999-12-31';const bEnd=b.end_date||'9999-12-31';return a.start_date<=bEnd&&b.start_date<=aEnd;}

export function createAdministratorApplication({repository}){
  if(!repository?.entity||!repository?.atomic)throw new TypeError('Administrator application requires repository');
  const vehicles=()=>repository.entity('vehicles');
  const drivers=()=>repository.entity('drivers');
  const assignments=()=>repository.entity('vehicle_driver_assignments');
  const readings=()=>repository.entity('vehicle_odometer_readings');

  async function listVehicles(){return live(await vehicles().list());}
  async function getVehicle(id){return vehicles().get(id);}
  async function listDrivers(){return live(await drivers().list());}
  async function getDriver(id){return drivers().get(id);}
  async function listAssignments(){return live(await assignments().list());}
  async function listVehicleAssignments(vehicleId){return (await listAssignments()).filter(row=>row.vehicle_id===vehicleId);}
  async function listDriverAssignments(driverId){return (await listAssignments()).filter(row=>row.driver_id===driverId);}
  async function listOdometerHistory(vehicleId){return (await readings().list()).filter(row=>!row.is_deleted&&row.vehicle_id===vehicleId).sort((a,b)=>String(a.recorded_at).localeCompare(String(b.recorded_at))||Number(a.odometer)-Number(b.odometer));}

  async function createVehicle(input){
    const rows=await vehicles().list();
    const registration=normalizedRegistration(input.registration_number);
    assertUniqueRegistration(rows,registration);
    const acquisitionDate=date(input.acquisition_date,'Acquisition Date');
    const acquisitionOdometer=whole(input.acquisition_odometer??0,'Acquisition Odometer');
    if(text(input.acquisition_type)!=='NEW'&&text(input.acquisition_type)!=='USED')throw new RangeError('Acquisition Type must be New or Used');
    if(!text(input.make)||!text(input.model))throw new RangeError('Make and Model are required');
    if(text(input.fuel_type)==='')throw new RangeError('Fuel Type is required');
    const record=createRecord({registration_number:registration,make:text(input.make),model:text(input.model),variant:text(input.variant),fuel_type:text(input.fuel_type),acquisition_date:acquisitionDate,acquisition_type:text(input.acquisition_type),acquisition_odometer:acquisitionOdometer,current_odometer:acquisitionOdometer,acquisition_cost_paise:money(input.acquisition_cost??0,'Acquisition Cost'),lifecycle_status:ACTIVE,retirement_date:null,retirement_odometer:null,retirement_reason:null,sale_date:null,sale_odometer:null,sale_amount_paise:null,sale_reference:null,sale_notes:null,transfer_date:null,transfer_odometer:null,transfer_amount_paise:null,transfer_reference:null},{});
    const reading=createRecord({vehicle_id:record.id,odometer:acquisitionOdometer,source:'ACQUISITION',source_precedence:ADMINISTRATOR_VEHICLE_SOURCES.ACQUISITION,recorded_at:`${acquisitionDate}T00:00:00.000Z`,reason:'Acquisition baseline'},{ });
    await repository.atomic(['vehicles','vehicle_odometer_readings'],stores=>{stores.vehicles.put(record);stores.vehicle_odometer_readings.put(reading);return true;});
    return record;
  }

  async function updateVehicle(id,input){
    const existing=await vehicles().get(id);if(!existing)throw new Error('Vehicle not found');
    const rows=await vehicles().list();
    const registration=normalizedRegistration(input.registration_number??existing.registration_number);assertUniqueRegistration(rows,registration,id);
    const next={...existing,...input,registration_number:registration,make:text(input.make??existing.make),model:text(input.model??existing.model),variant:text(input.variant??existing.variant),fuel_type:text(input.fuel_type??existing.fuel_type),acquisition_date:input.acquisition_date??existing.acquisition_date,acquisition_type:input.acquisition_type??existing.acquisition_type,acquisition_odometer:input.acquisition_odometer==null?existing.acquisition_odometer:whole(input.acquisition_odometer,'Acquisition Odometer'),acquisition_cost_paise:input.acquisition_cost==null?existing.acquisition_cost_paise:money(input.acquisition_cost,'Acquisition Cost')};
    assertLifecycle(next);
    if(next.current_odometer<next.acquisition_odometer)throw new RangeError('Current Odometer cannot be below Acquisition Odometer');
    return vehicles().update(existing,next);
  }

  async function recordOdometer({vehicle_id,odometer,source,recorded_at,reason=''}){
    const vehicle=await vehicles().get(vehicle_id);if(!vehicle||vehicle.is_deleted)throw new Error('Vehicle not found');
    if([RETIRED,SOLD,TRANSFERRED].includes(vehicle.lifecycle_status))throw new Error('Cannot record a new odometer reading for a vehicle that has left active use');
    const value=whole(odometer,'Odometer');
    if(value<Number(vehicle.current_odometer??vehicle.acquisition_odometer))throw new RangeError('Odometer cannot move backwards');
    const sourceKey=text(source).toUpperCase();if(!(sourceKey in ADMINISTRATOR_VEHICLE_SOURCES))throw new RangeError('Unknown odometer source');
    const timestamp=recorded_at||new Date().toISOString();
    const reading=createRecord({vehicle_id,odometer:value,source:sourceKey,source_precedence:ADMINISTRATOR_VEHICLE_SOURCES[sourceKey],recorded_at:timestamp,reason:text(reason)},{ });
    const updated={...vehicle,current_odometer:value};
    await repository.atomic(['vehicle_odometer_readings','vehicles'],stores=>{stores.vehicle_odometer_readings.put(reading);stores.vehicles.put(createRecord(updated,{id:vehicle.id,user_id:vehicle.user_id,created_at:vehicle.created_at,updated_at:new Date().toISOString(),synced:false,is_deleted:vehicle.is_deleted}));return true;});
    return reading;
  }

  async function retireVehicle(id,{retirement_date,retirement_odometer,reason=''}){
    const vehicle=await vehicles().get(id);if(!vehicle)throw new Error('Vehicle not found');
    if(vehicle.lifecycle_status!==ACTIVE)throw new Error('Only an active vehicle can be retired');
    const day=date(retirement_date,'Retirement Date');const odo=whole(retirement_odometer,'Retirement Odometer');
    if(day<vehicle.acquisition_date)throw new RangeError('Retirement Date cannot be before Acquisition Date');
    if(odo<Number(vehicle.current_odometer))throw new RangeError('Retirement Odometer cannot be below the current authoritative odometer');
    return vehicles().update(vehicle,{lifecycle_status:RETIRED,retirement_date:day,retirement_odometer:odo,retirement_reason:text(reason),current_odometer:odo});
  }

  async function sellVehicle(id,{sale_date,sale_odometer,sale_amount,sale_reference='',sale_notes=''}){
    const vehicle=await vehicles().get(id);if(!vehicle)throw new Error('Vehicle not found');
    if(vehicle.lifecycle_status!==ACTIVE&&vehicle.lifecycle_status!==RETIRED)throw new Error('Only an active or retired vehicle can be sold');
    const day=date(sale_date,'Sale Date');const odo=whole(sale_odometer,'Sale Odometer');if(day<vehicle.acquisition_date)throw new RangeError('Sale Date cannot be before Acquisition Date');if(odo<Number(vehicle.current_odometer))throw new RangeError('Sale Odometer cannot be below the current authoritative odometer');
    const amount=money(sale_amount,'Sale Amount');if(amount<=0)throw new RangeError('Sale Amount must be positive');
    return vehicles().update(vehicle,{lifecycle_status:SOLD,sale_date:day,sale_odometer:odo,sale_amount_paise:amount,sale_reference:text(sale_reference),sale_notes:text(sale_notes),current_odometer:odo});
  }

  async function transferVehicle(id,{transfer_date,transfer_odometer,transfer_amount=0,transfer_reference='',notes=''}){
    const vehicle=await vehicles().get(id);if(!vehicle)throw new Error('Vehicle not found');
    if(vehicle.lifecycle_status!==ACTIVE&&vehicle.lifecycle_status!==RETIRED)throw new Error('Only an active or retired vehicle can be transferred');
    const day=date(transfer_date,'Transfer Date');const odo=whole(transfer_odometer,'Transfer Odometer');if(day<vehicle.acquisition_date)throw new RangeError('Transfer Date cannot be before Acquisition Date');if(odo<Number(vehicle.current_odometer))throw new RangeError('Transfer Odometer cannot be below the current authoritative odometer');
    return vehicles().update(vehicle,{lifecycle_status:TRANSFERRED,transfer_date:day,transfer_odometer:odo,transfer_amount_paise:money(transfer_amount,'Transfer Amount'),transfer_reference:text(transfer_reference),sale_notes:text(notes),current_odometer:odo});
  }

  async function createDriver(input){
    const rows=await drivers().list();const licence=normalizedLicence(input.licence_number);if(!text(input.name))throw new RangeError('Driver name is required');if(!licence)throw new RangeError('Driving Licence Number is required');if(live(rows).some(row=>row.licence_number&&normalizedLicence(row.licence_number)===licence))throw new RangeError('Driving Licence Number already exists');
    if(input.licence_expiry)date(input.licence_expiry,'Licence Expiry Date');
    return drivers().create({name:text(input.name),mobile:text(input.mobile),licence_number:licence,licence_expiry:input.licence_expiry||null,status:ACTIVE,added_date:input.added_date||new Date().toISOString().slice(0,10),deactivation_date:null,deactivation_reason:null},{});
  }

  async function updateDriver(id,input){
    const existing=await drivers().get(id);if(!existing)throw new Error('Driver not found');const rows=await drivers().list();const licence=normalizedLicence(input.licence_number??existing.licence_number);if(live(rows).some(row=>row.id!==id&&row.licence_number&&normalizedLicence(row.licence_number)===licence))throw new RangeError('Driving Licence Number already exists');if(input.licence_expiry)date(input.licence_expiry,'Licence Expiry Date');return drivers().update(existing,{...input,name:text(input.name??existing.name),mobile:text(input.mobile??existing.mobile),licence_number:licence,licence_expiry:input.licence_expiry??existing.licence_expiry});}

  async function deactivateDriver(id,{date:effectiveDate,reason=''}){const driver=await drivers().get(id);if(!driver)throw new Error('Driver not found');if(driver.status!==ACTIVE)throw new Error('Driver is already inactive');const day=date(effectiveDate||new Date().toISOString().slice(0,10),'Deactivation Date');const open=(await listDriverAssignments(id)).filter(row=>row.status==='ACTIVE'&&!row.end_date);for(const assignment of open)await assignments().update(assignment,{status:'INACTIVE',end_date:day});return drivers().update(driver,{status:INACTIVE,deactivation_date:day,deactivation_reason:text(reason)});}

  async function assignDriver({vehicle_id,driver_id,start_date,reason=''}){
    const vehicle=await vehicles().get(vehicle_id);const driver=await drivers().get(driver_id);if(!vehicle||vehicle.is_deleted)throw new Error('Vehicle not found');if(!driver||driver.is_deleted)throw new Error('Driver not found');if(vehicle.lifecycle_status!==ACTIVE)throw new Error('Driver cannot be assigned to an inactive or retired vehicle');if(driver.status!==ACTIVE)throw new Error('Inactive driver cannot receive a new assignment');const start=assertAssignmentDates({start_date});if(driver.licence_expiry&&driver.licence_expiry<start)throw new Error('Driver licence is expired for the assignment start date');
    const driverRows=await listDriverAssignments(driver_id);if(driverRows.some(row=>row.status==='ACTIVE'&&!row.end_date))throw new Error('Driver already has an active vehicle assignment');
    const record=createRecord({vehicle_id,driver_id,start_date:start,end_date:null,status:'ACTIVE',reason:text(reason)},{ });return assignments().create(record,{});
  }

  async function reassignDriver({driver_id,new_vehicle_id,start_date,reason=''}){
    const current=(await listDriverAssignments(driver_id)).find(row=>row.status==='ACTIVE'&&!row.end_date);if(!current)throw new Error('Driver has no active assignment');const day=assertAssignmentDates({start_date});if(day<current.start_date)throw new RangeError('Reassignment date cannot be before the current assignment start date');await assignments().update(current,{status:'INACTIVE',end_date:day});return assignDriver({vehicle_id:new_vehicle_id,driver_id,start_date:day,reason});
  }

  async function closeAssignment(id,{end_date}){const existing=await assignments().get(id);if(!existing)throw new Error('Assignment not found');const day=date(end_date,'Assignment End Date');if(day<existing.start_date)throw new RangeError('Assignment End Date cannot be before Start Date');return assignments().update(existing,{status:'INACTIVE',end_date:day});}

  async function vehicleUsage(vehicleId){
    const sessions=live(await repository.entity('work_sessions').list());let businessKm=0,personalKm=0,unclassifiedKm=0;
    for(const row of sessions.filter(item=>item.vehicle_id===vehicleId)){const start=Number(row.start_odometer),end=Number(row.end_odometer);if(!Number.isFinite(start)||!Number.isFinite(end)||end<start){unclassifiedKm+=0;continue;}const km=end-start;if(String(row.scope).toUpperCase()==='BUSINESS')businessKm+=km;else if(String(row.scope).toUpperCase()==='PERSONAL')personalKm+=km;else unclassifiedKm+=km;}
    const vehicle=await vehicles().get(vehicleId);const endpoint=vehicle?.lifecycle_status===SOLD?vehicle.sale_odometer:vehicle?.lifecycle_status===RETIRED?vehicle.retirement_odometer:vehicle?.lifecycle_status===TRANSFERRED?vehicle.transfer_odometer:vehicle?.current_odometer;const lifetimeKm=endpoint==null?null:Number(endpoint)-Number(vehicle?.acquisition_odometer);return {lifetimeKm,businessKm,personalKm,unclassifiedKm};
  }

  async function listVehicleDisposals(){return (await listVehicles()).filter(row=>[SOLD,TRANSFERRED].includes(row.lifecycle_status)&&row.sale_amount_paise!=null||row.transfer_amount_paise!=null);}
  return Object.freeze({listVehicles,getVehicle,createVehicle,updateVehicle,recordOdometer,listOdometerHistory,retireVehicle,sellVehicle,transferVehicle,listDrivers,getDriver,createDriver,updateDriver,deactivateDriver,listAssignments,listVehicleAssignments,listDriverAssignments,assignDriver,reassignDriver,closeAssignment,vehicleUsage,listVehicleDisposals,odometerSourcePrecedence:ADMINISTRATOR_VEHICLE_SOURCES});
}
