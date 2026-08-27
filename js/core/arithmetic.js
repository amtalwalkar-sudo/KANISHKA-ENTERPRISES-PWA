// KFE 2.0 clean-room financial arithmetic.
// Money is represented as integer paise. Financial rounding is centralized here.

export function assertPaise(value) {
  if (!Number.isSafeInteger(value)) throw new TypeError('Currency must be a safe integer number of paise');
  return value;
}

export function paise(value) { return assertPaise(value); }

function asBigIntInteger(value, name) {
  if (typeof value === 'bigint') return value;
  if (!Number.isSafeInteger(value)) throw new TypeError(`${name} must be a safe integer`);
  return BigInt(value);
}

export function addPaise(...values) {
  return Number(values.reduce((a, v) => a + asBigIntInteger(assertPaise(v), 'paise'), 0n));
}

export function subtractPaise(a, b) {
  return Number(asBigIntInteger(assertPaise(a), 'paise') - asBigIntInteger(assertPaise(b), 'paise'));
}

// Central financial rounding: nearest paise, half-up for non-negative amounts.
// Negative values are rounded symmetrically away from zero at an exact half.
export function roundRational(numerator, denominator) {
  const n = asBigIntInteger(numerator, 'numerator');
  const d = asBigIntInteger(denominator, 'denominator');
  if (d <= 0n) throw new RangeError('denominator must be positive');
  const sign = n < 0n ? -1n : 1n;
  const a = n < 0n ? -n : n;
  const q = a / d;
  const r = a % d;
  const rounded = r * 2n >= d ? q + 1n : q;
  return Number(sign * rounded);
}

export function multiplyPaiseByRatio(amountPaise, numerator, denominator) {
  assertPaise(amountPaise);
  return roundRational(asBigIntInteger(amountPaise, 'paise') * asBigIntInteger(numerator, 'numerator'), denominator);
}

export function paisePerKmRate(amountPaise, km) {
  assertPaise(amountPaise);
  if (!Number.isSafeInteger(km) || km <= 0) throw new RangeError('KM denominator must be a positive safe integer');
  return { numerator: BigInt(amountPaise), denominator: BigInt(km) };
}

export function averageRates(rates) {
  if (!rates.length) return null;
  let numerator = rates[0].numerator;
  let denominator = rates[0].denominator;
  for (let i = 1; i < rates.length; i++) {
    numerator = numerator * rates[i].denominator + rates[i].numerator * denominator;
    denominator *= rates[i].denominator;
  }
  return { numerator, denominator: denominator * BigInt(rates.length) };
}

export function multiplyRateByKm(rate, km) {
  if (!Number.isSafeInteger(km) || km < 0) throw new RangeError('KM must be a non-negative safe integer');
  return roundRational(rate.numerator * BigInt(km), rate.denominator);
}

// Converts a finite decimal percentage to an exact rational representation.
export function decimalToFraction(value, name='decimal') {
  if(!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  const text=String(value);
  if(/[eE]/.test(text)) throw new TypeError(`${name} must use ordinary decimal notation`);
  const negative=text.startsWith('-');
  const unsigned=negative?text.slice(1):text;
  const [whole,fraction='']=unsigned.split('.');
  if(!/^\d+$/.test(whole)||!/^\d*$/.test(fraction))throw new TypeError(`${name} must be a decimal number`);
  const denominator=10n**BigInt(fraction.length);
  let numerator=BigInt(whole||'0')*denominator+BigInt(fraction||'0');
  if(negative)numerator=-numerator;
  return {numerator,denominator};
}
