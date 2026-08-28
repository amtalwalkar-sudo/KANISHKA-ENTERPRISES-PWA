import {all,read,remove,write} from '../core/hardened-db.js';

export const MAINTENANCE_ITEM_STORE='maintenance_items';
export const MAINTENANCE_RECORD_STORE='maintenance_records';

export function createMaintenanceRepository(){
  return Object.freeze({
    create:value=>write(MAINTENANCE_ITEM_STORE,value),
    update:value=>write(MAINTENANCE_ITEM_STORE,value),
    get:id=>read(MAINTENANCE_ITEM_STORE,id),
    list:()=>all(MAINTENANCE_ITEM_STORE),
    remove:id=>remove(MAINTENANCE_ITEM_STORE,id),
    createRecord:value=>write(MAINTENANCE_RECORD_STORE,value),
    updateRecord:value=>write(MAINTENANCE_RECORD_STORE,value),
    getRecord:id=>read(MAINTENANCE_RECORD_STORE,id),
    listRecords:()=>all(MAINTENANCE_RECORD_STORE),
    removeRecord:id=>remove(MAINTENANCE_RECORD_STORE,id)
  });
}
