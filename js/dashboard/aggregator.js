// Dashboard aggregation boundary.
// Dashboard consumes published screen view-models only. It never imports screen-domain calculations.
export function createDashboardAggregator({ screens }) {
  return {
    getSnapshot() {
      return {
        work: screens.work.getViewModel(),
        fuel: screens.fuel.getViewModel(),
        expenses: screens.expenses.getViewModel(),
        revenue: screens.revenue.getViewModel()
      };
    }
  };
}
