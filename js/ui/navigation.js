export const PRIMARY_DESTINATIONS=Object.freeze([
  Object.freeze({id:'Work',label:'Work'}),
  Object.freeze({id:'Performance',label:'Performance'}),
  Object.freeze({id:'Timeline',label:'Timeline'}),
  Object.freeze({id:'More',label:'More'})
]);

export const MORE_GROUPS=Object.freeze([
  Object.freeze({title:'Vehicle',items:Object.freeze(['Vehicle','Driver'])}),
  Object.freeze({title:'Money',items:Object.freeze(['Fuel','Expenses','Revenue','Loans'])}),
  Object.freeze({title:'Vehicle Operations',items:Object.freeze(['Maintenance','Compliance'])}),
  Object.freeze({title:'Business',items:Object.freeze(['Dashboard','Profitability'])}),
  Object.freeze({title:'System',items:Object.freeze(['Settings'])})
]);

export const TIMELINE_HORIZONS=Object.freeze(['Today','Week','Month','Year']);

export function isPrimaryDestination(path){
  return PRIMARY_DESTINATIONS.some(destination=>destination.id===path);
}
