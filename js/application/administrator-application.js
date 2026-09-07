import {VEHICLE_ODOMETER_SOURCES} from '../domain/vehicle.js';
import {createAdministratorVehicleApplication} from './administrator-vehicle-application.js';
import {createAdministratorDriverApplication} from './administrator-driver-application.js';

export const ADMINISTRATOR_VEHICLE_SOURCES=VEHICLE_ODOMETER_SOURCES;

export function createAdministratorApplication({repository}){
  if(!repository?.entity||!repository?.atomic)throw new TypeError('Administrator application requires repository');
  const vehicleApplication=createAdministratorVehicleApplication({repository});
  const driverApplication=createAdministratorDriverApplication({repository});

  // Stable application boundary: vehicle and driver responsibilities remain
  // separate while callers retain the original administrator API surface.
  const listVehicles=(...args)=>vehicleApplication.listVehicles(...args);
  const getVehicle=(...args)=>vehicleApplication.getVehicle(...args);
  const createVehicle=(...args)=>vehicleApplication.createVehicle(...args);
  const updateVehicle=(...args)=>vehicleApplication.updateVehicle(...args);
  const recordOdometer=(...args)=>vehicleApplication.recordOdometer(...args);
  const listOdometerHistory=(...args)=>vehicleApplication.listOdometerHistory(...args);
  const listVehicleLifecycleHistory=(...args)=>vehicleApplication.listVehicleLifecycleHistory(...args);
  const retireVehicle=(...args)=>vehicleApplication.retireVehicle(...args);
  const sellVehicle=(...args)=>vehicleApplication.sellVehicle(...args);
  const transferVehicle=(...args)=>vehicleApplication.transferVehicle(...args);
  const vehicleUsage=(...args)=>vehicleApplication.vehicleUsage(...args);
  const listVehicleDisposals=(...args)=>vehicleApplication.listVehicleDisposals(...args);
  const listAssignments=(...args)=>driverApplication.listAssignments(...args);
  const listVehicleAssignments=(...args)=>driverApplication.listVehicleAssignments(...args);
  const listDrivers=(...args)=>driverApplication.listDrivers(...args);
  const getDriver=(...args)=>driverApplication.getDriver(...args);
  const createDriver=(...args)=>driverApplication.createDriver(...args);
  const updateDriver=(...args)=>driverApplication.updateDriver(...args);
  const deactivateDriver=(...args)=>driverApplication.deactivateDriver(...args);
  const listDriverAssignments=(...args)=>driverApplication.listDriverAssignments(...args);
  const assignDriver=(...args)=>driverApplication.assignDriver(...args);
  const reassignDriver=(...args)=>driverApplication.reassignDriver(...args);
  const closeAssignment=(...args)=>driverApplication.closeAssignment(...args);

  return Object.freeze({
    listVehicles,getVehicle,createVehicle,updateVehicle,recordOdometer,
    listOdometerHistory,listVehicleLifecycleHistory,retireVehicle,sellVehicle,
    transferVehicle,vehicleUsage,listVehicleDisposals,
    listDrivers,getDriver,createDriver,updateDriver,deactivateDriver,
    listAssignments,listVehicleAssignments,listDriverAssignments,
    assignDriver,reassignDriver,closeAssignment,
    odometerSourcePrecedence:VEHICLE_ODOMETER_SOURCES
  });
}
