import {all,read,remove,write} from '../core/hardened-db.js';
export const RENEWALS_COMPLIANCE_STORE='renewals_compliance';
export function createRenewalsComplianceRepository(){return Object.freeze({create:value=>write(RENEWALS_COMPLIANCE_STORE,value),update:value=>write(RENEWALS_COMPLIANCE_STORE,value),get:id=>read(RENEWALS_COMPLIANCE_STORE,id),list:()=>all(RENEWALS_COMPLIANCE_STORE),remove:id=>remove(RENEWALS_COMPLIANCE_STORE,id)});}
