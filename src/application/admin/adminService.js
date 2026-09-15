import { getAdminFormDefinition } from './adminFormDefinitions.js'
import { validateAdminForm } from './universalFormRules.js'
import { AdminRepository } from '../../repositories/adminRepository.js'

function definitionFor(formKey) {
  const definition = getAdminFormDefinition(formKey)
  if (!definition) throw new Error(`Unknown Admin form: ${formKey}`)
  return definition
}

export const AdminService = {
  async list(formKey) { definitionFor(formKey); return AdminRepository.list(formKey) },
  async save(formKey, values, existingId = null, context = {}) {
    const definition = definitionFor(formKey)
    const result = validateAdminForm(definition, values, context)
    if (!result.valid) { const error = new Error('Admin validation failed.'); error.validation = result.errors; throw error }
    return AdminRepository.save(formKey, result.values, existingId)
  },
  async remove(formKey, id) { definitionFor(formKey); if (!id) throw new Error('Admin record id is required.'); return AdminRepository.remove(formKey, id) },
}
