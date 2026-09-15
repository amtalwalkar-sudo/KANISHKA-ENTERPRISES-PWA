import { describe, expect, it } from 'vitest'
import { derivePerformance } from '../performanceEngine.js'

const range = { from: new Date('2026-09-01T00:00:00Z'), to: new Date('2026-09-30T23:59:59Z') }
const previous = { from: new Date('2026-08-01T00:00:00Z'), to: new Date('2026-08-31T23:59:59Z') }

describe('Performance canonical-source wiring', () => {
  it('reads target, loan, payment, maintenance, compliance and break-even from owning stores', () => {
    const metrics = derivePerformance({
      shifts: [{ id: 's1', startOdometer: 1000, endOdometer: 1200, shiftStartAt: '2026-09-05T08:00:00Z', shiftEndAt: '2026-09-05T18:00:00Z', toll: 100, parking: 50 }],
      trips: [{ id: 't1', status: 'COMPLETED', tripStartAt: '2026-09-05T09:00:00Z', tripEndAt: '2026-09-05T10:00:00Z', tripKm: 150, revenue: 1000, operator: 'Uber' }],
      fuelLogs: [{ id: 'f1', createdAt: '2026-09-05T12:00:00Z', amount: 200, kg: 2 }],
      maintenance: [{ id: 'm1', performedOn: '2026-09-04', cost: 75 }],
      compliance: [{ id: 'c1', validFrom: '2026-01-01', validUntil: '2026-12-31', cost: 3650 }],
      loans: [{ id: 'l1', principal: 550000, annualInterestRate: 10, tenureMonths: 60, startDate: '2026-04-01', status: 'Active' }],
      loanPayments: [{ id: 'p1', loanId: 'l1', paidOn: '2026-09-05', amount: 12000, principalComponent: 7500, interestComponent: 4500, status: 'Paid' }],
      prepayments: [],
      driverTargets: [{ id: 'dt1', driverId: 'd1', effectiveFrom: '2026-09-01', targetRevenue: 25000, active: true }],
      breakEvenInputs: [{ id: 'be1', effectiveFrom: '2026-09-01', fixedCosts: 10000, variableCostPerKm: 2, variableCostPerHour: 20, expectedRevenuePerKm: 10, expectedRevenuePerHour: 250 }],
    }, range, previous)

    expect(metrics.revenue).toBe(1000)
    expect(metrics.vehicleKm).toBe(200)
    expect(metrics.businessKm).toBe(150)
    expect(metrics.deadKm).toBe(50)
    expect(metrics.maintenanceProvision).toBe(75)
    expect(metrics.target).toBe(25000)
    expect(metrics.loanProvision).toBe(12000)
    expect(metrics.loanInterest).toBe(4500)
    expect(metrics.completeness.breakEven).toBe(true)
    expect(metrics.authority.target).toBe('DRIVER_TARGET_RECORDS')
    expect(metrics.authority.loan).toBe('LOAN_AND_PAYMENT_RECORDS')
    expect(metrics.authority.maintenance).toBe('MAINTENANCE_RECORDS')
    expect(metrics.authority.breakEven).toBe('BREAK_EVEN_INPUT_RECORDS')
  })
})
