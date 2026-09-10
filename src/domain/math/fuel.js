/**
 * Calculates CNG fuel weight in kg from total cost and price per kg.
 * @param {number|string} amountRupees
 * @param {number|string} pricePerKg
 * @returns {number|null}
 */
export function calculateFuelQuantityKg(amountRupees, pricePerKg) {
  const amt = Number(amountRupees)
  const price = Number(pricePerKg)
  if (!amt || !price || price <= 0) return null
  return amt / price
}
