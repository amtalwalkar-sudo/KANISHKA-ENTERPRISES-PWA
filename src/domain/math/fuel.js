export function calculateFuelQuantityKg(amountRupees, pricePerKg) {
  const amount = Number(amountRupees)
  const price = Number(pricePerKg)
  if (isNaN(amount) || isNaN(price) || amount <= 0 || price <= 0) {
    return null
  }
  return amount / price
}
