import {all,read,remove,write} from '../core/hardened-db.js';

export const LOAN_STORE='loans';
export const LOAN_PAYMENT_STORE='loan_payments';

export function createLoanRepository(){
  return Object.freeze({
    create:value=>write(LOAN_STORE,value),
    update:value=>write(LOAN_STORE,value),
    get:id=>read(LOAN_STORE,id),
    list:()=>all(LOAN_STORE),
    remove:id=>remove(LOAN_STORE,id),
    createPayment:value=>write(LOAN_PAYMENT_STORE,value),
    updatePayment:value=>write(LOAN_PAYMENT_STORE,value),
    getPayment:id=>read(LOAN_PAYMENT_STORE,id),
    listPayments:()=>all(LOAN_PAYMENT_STORE),
    removePayment:id=>remove(LOAN_PAYMENT_STORE,id)
  });
}
