// Maintenance-owned calculations. No imports from other screens.
export function calculateMaintenanceCostPerKm(amount,allocatedKm){
  if(!Number.isFinite(amount)||!Number.isFinite(allocatedKm)||allocatedKm<=0)return 0;
  return amount/allocatedKm;
}

export function calculateMaintenanceAllocation(amount,totalBusinessKm,periodKm){
  if(!Number.isFinite(amount)||!Number.isFinite(totalBusinessKm)||!Number.isFinite(periodKm))return 0;
  if(totalBusinessKm<=0||periodKm<=0)return 0;
  return amount*(periodKm/totalBusinessKm);
}
