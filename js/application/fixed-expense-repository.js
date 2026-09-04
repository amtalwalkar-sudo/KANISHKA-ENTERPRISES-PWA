import {all,read,remove,write} from '../core/hardened-db.js';

export const FIXED_EXPENSE_STORE='fixed_expenses';

export function createFixedExpenseRepository(){
  return Object.freeze({
    create:value=>write(FIXED_EXPENSE_STORE,value),
    update:value=>write(FIXED_EXPENSE_STORE,value),
    get:id=>read(FIXED_EXPENSE_STORE,id),
    list:()=>all(FIXED_EXPENSE_STORE),
    remove:id=>remove(FIXED_EXPENSE_STORE,id)
  });
}
