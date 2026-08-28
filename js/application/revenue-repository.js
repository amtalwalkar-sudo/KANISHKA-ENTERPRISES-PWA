import {all,read,remove,write} from '../core/hardened-db.js';

export const REVENUE_STORE='revenue_records';

export function createRevenueRepository(){
  return Object.freeze({
    create:value=>write(REVENUE_STORE,value),
    update:value=>write(REVENUE_STORE,value),
    get:id=>read(REVENUE_STORE,id),
    list:()=>all(REVENUE_STORE),
    remove:id=>remove(REVENUE_STORE,id)
  });
}
