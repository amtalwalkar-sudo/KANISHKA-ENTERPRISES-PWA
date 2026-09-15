/** Universal Admin form rules. */

export const UNIVERSAL_FORM_RULES = {
  trimText: true,
  rejectUnknownFields: true,
  requiredFieldsMustBePresent: true,
  numbersMustBeFinite: true,
  numbersMustRespectBounds: true,
  datesMustBeValid: true,
  selectValuesMustBeAllowed: true,
  validateBeforeSave: true,
};

const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

export function normalizeFormValues(definition, values = {}) {
  const normalized = {};
  for (const field of definition.fields ?? []) {
    let value = values[field.key];
    if (value === undefined && field.defaultValue !== undefined) value = field.defaultValue;
    if (field.type === 'text' || field.type === 'textarea' || field.type === 'select') {
      if (typeof value === 'string' && UNIVERSAL_FORM_RULES.trimText) value = value.trim();
    }
    if (field.type === 'number' && value !== '' && value !== null && value !== undefined) value = Number(value);
    if (field.type === 'checkbox') value = Boolean(value);
    normalized[field.key] = value;
  }
  return normalized;
}

export function validateAdminForm(definition, values = {}, context = {}) {
  const errors = {};
  const normalized = normalizeFormValues(definition, values);
  const allowedKeys = new Set((definition.fields ?? []).map((field) => field.key));

  if (UNIVERSAL_FORM_RULES.rejectUnknownFields) {
    for (const key of Object.keys(values)) {
      if (!allowedKeys.has(key)) errors[key] = 'Unknown field is not permitted.';
    }
  }

  const relaxed = new Set(context.relaxRequired ?? []);
  for (const field of definition.fields ?? []) {
    const value = normalized[field.key];
    const required = field.required && !relaxed.has(field.key);
    if (required && isBlank(value)) { errors[field.key] = `${field.label} is required.`; continue; }
    if (isBlank(value)) continue;

    if (field.type === 'number') {
      if (UNIVERSAL_FORM_RULES.numbersMustBeFinite && !Number.isFinite(value)) errors[field.key] = `${field.label} must be a valid number.`;
      else if (field.min !== undefined && value < field.min) errors[field.key] = `${field.label} must be at least ${field.min}.`;
      else if (field.max !== undefined && value > field.max) errors[field.key] = `${field.label} must be at most ${field.max}.`;
    }
    if (field.type === 'date' && UNIVERSAL_FORM_RULES.datesMustBeValid && Number.isNaN(Date.parse(value))) errors[field.key] = `${field.label} must be a valid date.`;
    if (field.type === 'select' && UNIVERSAL_FORM_RULES.selectValuesMustBeAllowed && field.options?.length && !field.options.includes(value)) errors[field.key] = `${field.label} has an invalid selection.`;
  }

  if (definition.key === 'backupRestore' && normalized.operation === 'Create backup') delete errors.backupReference;
  if (definition.key === 'backupRestore' && normalized.operation === 'Verify backup' && isBlank(normalized.backupReference)) errors.backupReference = 'Backup reference is required for verification.';
  if (definition.key === 'loanPayment' && normalized.status === 'Delayed') {
    delete errors.principalComponent;
    delete errors.interestComponent;
  }
  if (definition.key === 'dataReset' && normalized.confirmation !== 'RESET') errors.confirmation = 'Type RESET to confirm.';

  return { valid: Object.keys(errors).length === 0, errors, values: normalized };
}
