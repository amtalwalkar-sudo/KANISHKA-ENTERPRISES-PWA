export function sanitizeDecimalInput(value, { scale = 2, allowNegative = false } = {}) {
  const text = String(value ?? '').replace(/,/g, '.').replace(/[^0-9.-]/g, '');
  const negative = allowNegative && text.startsWith('-');
  const unsigned = text.replace(/-/g, '');
  const firstDot = unsigned.indexOf('.');
  const integerPart = (firstDot >= 0 ? unsigned.slice(0, firstDot) : unsigned) || '0';
  const fractionPart = firstDot >= 0 ? unsigned.slice(firstDot + 1).replace(/\./g, '') : '';
  const fraction = fractionPart.slice(0, Math.max(0, scale));
  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, '');
  const prefix = negative ? '-' : '';
  return firstDot >= 0 ? `${prefix}${normalizedInteger}.${fraction}` : `${prefix}${normalizedInteger}`;
}

export function isValidDecimalInput(value, { scale = 2, allowNegative = false } = {}) {
  const text = String(value ?? '').trim();
  if (!text || text === '-' || text === '.') return false;
  const pattern = allowNegative ? /^-?\d+(?:\.\d+)?$/ : /^\d+(?:\.\d+)?$/;
  if (!pattern.test(text)) return false;
  const fraction = text.split('.')[1] || '';
  return fraction.length <= scale;
}

export function enforceDecimalInput(element, options = {}) {
  if (!element) return '';
  const value = sanitizeDecimalInput(element.value, options);
  if (element.value !== value) element.value = value;
  return value;
}

export function enforceDecimalInputs(elements, options = {}) {
  if (!elements) return [];
  return Array.from(elements, element => enforceDecimalInput(element, options));
}
