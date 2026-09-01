export const APPLICATION_MODULES=Object.freeze([
  Object.freeze({id:'vehicle',label:'Vehicle',route:'Vehicle'}),
  Object.freeze({id:'work-sessions',label:'Work Sessions',route:'Work'}),
  Object.freeze({id:'fuel',label:'Fuel',route:'Fuel'}),
  Object.freeze({id:'expenses',label:'Expenses',route:'Expenses'}),
  Object.freeze({id:'revenue',label:'Revenue',route:'Revenue'}),
  Object.freeze({id:'loans',label:'Loans',route:'Loans'}),
  Object.freeze({id:'renewals-compliance',label:'Renewals / Compliance',route:'Compliance'}),
  Object.freeze({id:'maintenance',label:'Maintenance',route:'Maintenance'}),
  Object.freeze({id:'profitability',label:'Basic Profitability',route:'Profitability'}),
  Object.freeze({id:'dashboard',label:'Dashboard',route:'Dashboard'})
]);

export function moduleById(id){return APPLICATION_MODULES.find(module=>module.id===id)||null;}
export function moduleByRoute(route){return APPLICATION_MODULES.find(module=>module.route===route)||null;}
