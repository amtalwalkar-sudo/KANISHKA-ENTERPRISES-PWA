/** Universal Admin form rules.
 * Strict by default, with explicit contextual relaxations where the source record
 * can legitimately be incomplete or action-driven.
 */

export const UNIVERSAL_FORM_RULES = {
  trimText: true,
  rejectUnknownFields: true,
  requiredFieldsMustBePresent: true,
  numbersMustBeFinite: true,
  numbersMustRespectBounds: true,
  datesMustBeValid: true,
  selectValuesMustBeAllowed: true,
  validateBeforeSave: true,
  preserveUnknownExistingValues: false,
};

const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

export function normalizeFormValues(definition, values = {}) {
  const normalized = {};
  for (const field of definition.fields) {
    let value = values[field.key];
    if (field.type === 'text' || field.type === 'textarea' || field.type === 'select') {
      if (typeof value === 'string' && UNIVERSAL_FORM_RULES.trimText) value = value.trim();
    }
    if (field.type === 'number' && value !== '' && value !== null && value !== undefined) {
      value = Number(value);
    }
    normalized[field.key] = value;
  }
  return normalized;
}

export function validateAdminForm(definition, values = {}, context = {}) {
  const errors = {};
  const normalized = normalizeFormValues(definition, values);
  const relaxed = new Set(context.relaxRequired ?? []);

  for (const field of definition.fields) {
    const value = normalized[field.key];
    const required = field.required && !relaxed.has(field.key);

    if (required && isBlank(value)) {
      errors[field.key] = `${field.label} is required.`;
      continue;
    }
    if (isBlank(value)) continue;

    if (field.type === 'number') {
      if (UNIVERSAL_FORM_RULES.numbersMustBeFinite && !Number.isFinite(value)) {
        errors[field.key] = `${field.label} must be a valid number.`;
      } else if (field.min !== undefined && value < field.min) {
        errors[field.key] = `${field.label} must be at least ${field.min}.`;
      } else if (field.max !== undefined && value > field.max) {
        errors[field.key] = `${field.label} must be at most ${field.max}.`;
      }
    }

    if (field.type === 'date' && UNIVERSAL_FORM_RULES.datesMustBeValid) {
      if (Number.isNaN(Date.parse(value))) errors[field.key] = `${field.label} must be a valid date.`;
    }

    if (field.type === 'select' && UNIVERSAL_FORM_RULES.selectValuesMustBeAllowed) {
      if (field.options?.length && !field.options.includes(value)) {
        errors[field.key] = `${field.label} has an invalid selection.`;
      }
    }
  }

  // Contextual relaxations: action forms may require only the action-specific
  // confirmation/reference, while edit forms may preserve existing values.
  if (definition.key === 'backupRestore' && normalized.operation === 'Create backup') {
    delete errors.backupReference;
  }
  if (definition.key === 'backupRestore' && normalized.operation === 'Verify backup') {
    if (isBlank(normalized.backupReference)) errors.backupReference = 'Backup reference is required for verification.';
  }
  if (definition.key === 'dataReset' && normalized.scope === 'Synthetic test data only') {
    // This is intentionally less restrictive than a full reset: the explicit
    // RESET token and reason remain mandatory, but no extra scope fields apply.
  }
  if (definition.key === 'loanPayment' && normalized.status === 'Delayed') {
    // Delayed payments may omit component allocation; charges remain optional
    // because the authoritative finance rules determine them.
    delete errors.principalComponent;
    delete errors.interestComponent;
  }

  return { valid: Object.keys(errors).length === 0, errors, values: normalized };
}
