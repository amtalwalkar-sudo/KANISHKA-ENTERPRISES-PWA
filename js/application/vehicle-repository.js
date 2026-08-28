import {all,read,remove,write} from '../core/hardened-db.js';

export const VEHICLE_STORE='vehicles';

export function createVehicleRepository(){
  return Object.freeze({
    create:value=>write(VEHICLE_STORE,value),
    update:value=>write(VEHICLE_STORE,value),
    get:id=>read(VEHICLE_STORE,id),
    list:()=>all(VEHICLE_STORE),
    remove:id=>remove(VEHICLE_STORE,id)
  });
}
