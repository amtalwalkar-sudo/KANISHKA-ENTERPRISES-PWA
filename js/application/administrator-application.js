import {VEHICLE_ODOMETER_SOURCES} from '../domain/vehicle.js';
import {createAdministratorVehicleApplication} from './administrator-vehicle-application.js';
import {createAdministratorDriverApplication} from './administrator-driver-application.js';

export const ADMINISTRATOR_VEHICLE_SOURCES=VEHICLE_ODOMETER_SOURCES;

export function createAdministratorApplication({repository}){
  if(!repository?.entity||!repository?.atomic)throw new TypeError('Administrator application requires repository');
  const vehicleApplication=createAdministratorVehicleApplication({repository});
  const driverApplication=createAdministratorDriverApplication({repository});
  return Object.freeze({
    ...vehicleApplication,
    ...driverApplication
  });
}
