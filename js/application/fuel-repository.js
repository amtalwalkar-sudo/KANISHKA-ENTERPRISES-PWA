import {all,read,remove,write} from '../core/hardened-db.js';

export const FUEL_STORE='fuel_records';

export function createFuelRepository(){
  return Object.freeze({
    create:value=>write(FUEL_STORE,value),
    update:value=>write(FUEL_STORE,value),
    get:id=>read(FUEL_STORE,id),
    list:()=>all(FUEL_STORE),
    remove:id=>remove(FUEL_STORE,id)
  });
}
