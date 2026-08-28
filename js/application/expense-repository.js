import {all,read,remove,write} from '../core/hardened-db.js';

export const EXPENSE_STORE='expense_records';

export function createExpenseRepository(){
  return Object.freeze({
    create:value=>write(EXPENSE_STORE,value),
    update:value=>write(EXPENSE_STORE,value),
    get:id=>read(EXPENSE_STORE,id),
    list:()=>all(EXPENSE_STORE),
    remove:id=>remove(EXPENSE_STORE,id)
  });
}
