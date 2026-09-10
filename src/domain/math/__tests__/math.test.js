import { describe, it, expect } from 'vitest'
import { 
  rupeesToPaise, 
  paiseToRupees, 
  calculateFuelQuantityKg, 
  calculateDistanceKm, 
  calculateTotalAmount 
} from '../index.js'

describe('Currency Conversion', () => {
  it('converts rupee amounts to integer paise', () => {
    expect(rupeesToPaise(10.50)).toBe(1050)
    expect(rupeesToPaise('120.75')).toBe(12075)
    expect(rupeesToPaise(0)).toBe(0)
    expect(rupeesToPaise(null)).toBe(0)
  })

  it('converts paise to decimal rupees', () => {
    expect(paiseToRupees(1050)).toBe(10.5)
    expect(paiseToRupees(12075)).toBe(120.75)
    expect(paiseToRupees(0)).toBe(0)
  })
})

describe('CNG Fuel Calculation', () => {
  it('calculates weight in kg from total cost and price per kg', () => {
    expect(calculateFuelQuantityKg(500, 90)).toBeCloseTo(5.5555, 3)
    expect(calculateFuelQuantityKg(900, 90)).toBe(10)
  })

  it('returns null for invalid or non-positive inputs', () => {
    expect(calculateFuelQuantityKg(0, 90)).toBeNull()
    expect(calculateFuelQuantityKg(500, 0)).toBeNull()
    expect(calculateFuelQuantityKg(null, 90)).toBeNull()
  })
})

describe('Odometer Differential', () => {
  it('calculates total distance correctly', () => {
    expect(calculateDistanceKm(12000, 12250)).toBe(250)
  })

  it('returns null if start is higher than end or invalid', () => {
    expect(calculateDistanceKm(12250, 12000)).toBeNull()
    expect(calculateDistanceKm('abc', 12000)).toBeNull()
  })
})

describe('Financial Aggregations', () => {
  it('sums record arrays safely', () => {
    const rows = [
      { amount_paise: 1000 },
      { amount_paise: 2500 },
      { amount_paise: '500' }
    ]
    expect(calculateTotalAmount(rows, 'amount_paise')).toBe(4000)
  })

  it('handles empty or malformed inputs gracefully', () => {
    expect(calculateTotalAmount([], 'amount_paise')).toBe(0)
    expect(calculateTotalAmount(null, 'amount_paise')).toBe(0)
  })
})
