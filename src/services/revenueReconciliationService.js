export const RevenueReconciliationService = {
  reconcileShiftRevenue({ shiftRevenue, trips = [] } = {}) {
    const authoritativeShiftRevenue = Number(shiftRevenue)
    if (!Number.isFinite(authoritativeShiftRevenue) || authoritativeShiftRevenue < 0) throw new Error('Shift revenue must be a non-negative number.')
    const tripRevenue = trips
      .filter(trip => trip?.status === 'COMPLETED' && trip?.uberRevenue !== null && trip?.uberRevenue !== undefined)
      .reduce((total, trip) => total + Math.max(0, Number(trip.uberRevenue) || 0), 0)
    const unallocatedRevenue = authoritativeShiftRevenue - tripRevenue
    return {
      authoritativeShiftRevenue,
      tripRevenue,
      unallocatedRevenue,
      revenueStatus: unallocatedRevenue === 0 ? 'RECONCILED' : unallocatedRevenue > 0 ? 'UNALLOCATED_SHIFT_REVENUE' : 'TRIP_REVENUE_EXCEEDS_SHIFT_TOTAL',
      tripRevenueIsDetailOnly: true
    }
  }
}
