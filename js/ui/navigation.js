export const PRIMARY_DESTINATIONS=Object.freeze([
  Object.freeze({id:'Work',label:'Work'}),
  Object.freeze({id:'Performance',label:'Performance'}),
  Object.freeze({id:'Timeline',label:'Timeline'}),
  Object.freeze({id:'Admin',label:'Admin'})
]);

export const ADMIN_GROUPS=Object.freeze([
  Object.freeze({title:'BUSINESS',items:Object.freeze(['Vehicle','Driver'])}),
  Object.freeze({title:'FINANCE',items:Object.freeze(['Finance'])}),
  Object.freeze({title:'OPERATIONS',items:Object.freeze(['Renewals','Maintenance','Loans'])}),
  Object.freeze({title:'SYSTEM',items:Object.freeze(['Settings'])})
]);

export const TIMELINE_HORIZONS=Object.freeze(['Day','Week','Long-term']);

export function isPrimaryDestination(path){
  return PRIMARY_DESTINATIONS.some(destination=>destination.id===path);
}
