// Dashboard aggregation boundary.
// Dashboard consumes published screen view-models only. It never imports screen-domain calculations.
export function createDashboardAggregator({ screens }) {
  return {
    getSnapshot() {
      return Object.fromEntries([
        'work','fuel','expenses','revenue','maintenance','loan','renewals'
      ].map(name => [name, screens[name].getViewModel()]));
    }
  };
}
