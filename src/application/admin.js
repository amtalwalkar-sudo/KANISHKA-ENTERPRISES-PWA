import { AdminRepository } from '../repositories/adminRepository.js'
import { inspectAdminImpact, validateAdminForm } from '../domain/adminRules.js'

export async function validateAdminCommand({ kind, fields, values, existing, overrideWarning = false }) {
  const validation = validateAdminForm(fields, values)
  if (!validation.valid) return { ok: false, stage: 'VALIDATION', errors: validation.errors, warnings: [] }
  const warnings = inspectAdminImpact(kind, values, existing)
  if (warnings.length && !overrideWarning) return { ok: false, stage: 'WARNING', warnings, errors: {} }
  return { ok: true, warnings, errors: {} }
}

export async function saveAdminRecord({ kind, fields, values, existing, overrideWarning = false }) {
  const gate = await validateAdminCommand({ kind, fields, values, existing, overrideWarning })
  if (!gate.ok) return gate
  try {
    const record = await AdminRepository.save(kind, { ...values, id: existing?.id })
    return { ok: true, stage: 'SAVED', record, warnings: gate.warnings, errors: {} }
  } catch (error) {
    return { ok: false, stage: 'PERSISTENCE', errors: { _form: error?.message || 'Save failed.' }, warnings: gate.warnings }
  }
}

export async function deleteAdminRecord({ kind, id, confirm = false }) {
  if (!confirm) return { ok: false, stage: 'CONFIRMATION', warnings: ['This source record will be voided/deactivated and retained for audit and reconstruction. Confirm before continuing.'] }
  try {
    await AdminRepository.remove(kind, id)
    return { ok: true, stage: 'DELETED' }
  } catch (error) {
    return { ok: false, stage: 'PERSISTENCE', errors: { _form: error?.message || 'Delete failed.' } }
  }
}
