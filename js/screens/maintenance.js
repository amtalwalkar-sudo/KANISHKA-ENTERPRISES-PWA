import {calculateMaintenanceCostPerKm,calculateMaintenanceAllocation} from '../domain/maintenance.js';
export function createMaintenanceScreen({state}){
  return {getViewModel(){const s=state.get().maintenance||{};const amount=Number(s.amount)||0;const km=Number(s.allocatedKm)||0;return {amount,allocatedKm:km,costPerKm:calculateMaintenanceCostPerKm(amount,km),allocatedAmount:calculateMaintenanceAllocation(amount,Number(s.totalBusinessKm)||0,km)};}};
}
