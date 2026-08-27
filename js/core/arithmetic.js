// KFE 2.0 clean-room financial arithmetic.
// Money is represented as integer paise. Financial rounding is centralized here.

export function assertPaise(value) {
  if (!Number.isSafeInteger(value)) throw new TypeError('Currency must be a safe integer number of paise');
  return value;
}
export function paise(value) { return assertPaise(value); }

function asBigIntInteger(value, name) {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'string' && /^-?\d+$/.test(value)) return BigInt(value);
  if (!Number.isSafeInteger(value)) throw new TypeError(`${name} must be a safe integer`);
  return BigInt(value);
}

export function addPaise(...values) { return Number(values.reduce((a,v)=>a+asBigIntInteger(assertPaise(v),'paise'),0n)); }
export function subtractPaise(a,b) { return Number(asBigIntInteger(assertPaise(a),'paise')-asBigIntInteger(assertPaise(b),'paise')); }

// Central financial rounding: nearest paise, half-up for non-negative amounts.
// Negative values are rounded symmetrically away from zero at an exact half.
export function roundRational(numerator,denominator) {
  const n=asBigIntInteger(numerator,'numerator'),d=asBigIntInteger(denominator,'denominator');
  if(d<=0n)throw new RangeError('denominator must be positive');
  const sign=n<0n?-1n:1n,a=n<0n?-n:n,q=a/d,r=a%d;
  return Number(sign*(r*2n>=d?q+1n:q));
}

export function multiplyPaiseByRatio(amountPaise,numerator,denominator) {
  assertPaise(amountPaise);return roundRational(asBigIntInteger(amountPaise,'paise')*asBigIntInteger(numerator,'numerator'),denominator);
}

export function paisePerKmRate(amountPaise,km) {
  assertPaise(amountPaise);if(!Number.isSafeInteger(km)||km<=0)throw new RangeError('KM denominator must be a positive safe integer');
  return {numerator:String(amountPaise),denominator:String(km)};
}

export function averageRates(rates) {
  if(!rates.length)return null;
  let numerator=asBigIntInteger(rates[0].numerator,'rate numerator'),denominator=asBigIntInteger(rates[0].denominator,'rate denominator');
  for(let i=1;i<rates.length;i++){const n=asBigIntInteger(rates[i].numerator,'rate numerator'),d=asBigIntInteger(rates[i].denominator,'rate denominator');numerator=numerator*d+n*denominator;denominator*=d;}
  return {numerator:String(numerator),denominator:String(denominator*BigInt(rates.length))};
}

export function multiplyRateByKm(rate,km) {
  if(!Number.isSafeInteger(km)||km<0)throw new RangeError('KM must be a non-negative safe integer');
  return roundRational(asBigIntInteger(rate.numerator,'rate numerator')*BigInt(km),rate.denominator);
}

export function decimalToFraction(value,name='decimal') {
  if(!Number.isFinite(value))throw new TypeError(`${name} must be finite`);
  const text=String(value);if(/[eE]/.test(text))throw new TypeError(`${name} must use ordinary decimal notation`);
  const negative=text.startsWith('-'),unsigned=negative?text.slice(1):text,[whole,fraction='']=unsigned.split('.');
  if(!/^\d+$/.test(whole)||!/^\d*$/.test(fraction))throw new TypeError(`${name} must be a decimal number`);
  const denominator=10n**BigInt(fraction.length);let numerator=BigInt(whole||'0')*denominator+BigInt(fraction||'0');
  if(negative)numerator=-numerator;return {numerator,denominator};
}
