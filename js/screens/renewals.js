import {daysUntilExpiry,renewalStatus} from '../domain/renewals.js';
export function createRenewalsScreen({state}){
  return {getViewModel(){const s=state.get().renewals||{};const expiry=Number(s.expiryMs);return {expiryMs:Number.isFinite(expiry)?expiry:null,daysUntilExpiry:daysUntilExpiry(expiry),status:renewalStatus(expiry)};}};
}
