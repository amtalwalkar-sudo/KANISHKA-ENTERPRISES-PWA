// KFE performance guardrails. Keep the critical driver path small.
export const PERFORMANCE_BUDGET=Object.freeze({
  initialJsBytes:250*1024,
  initialCssBytes:100*1024,
  criticalModules:['./js/app.js','./js/ui-shell.js','./js/core/store.js','./js/core/repository.js'],
  lazyModules:['./js/screens/maintenance.js','./js/screens/loan.js','./js/screens/renewals.js','./js/dashboard/aggregator.js']
});

export function lazyLoad(modulePath){
  if(!PERFORMANCE_BUDGET.lazyModules.includes(modulePath)) throw new Error(`Lazy-load policy violation: ${modulePath}`);
  return import(modulePath);
}
