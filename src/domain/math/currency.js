/**
 * Converts a Rupee decimal amount to integer Paise.
 * @param {number|string} rupees
 * @returns {number}
 */
export function rupeesToPaise(rupees) {
  const val = Number(rupees) || 0
  return Math.round(val * 100)
}

/**
 * Converts integer Paise to Rupee decimal amount.
 * @param {number} paise
 * @returns {number}
 */
export function paiseToRupees(paise) {
  const val = Number(paise) || 0
  return val / 100
}
