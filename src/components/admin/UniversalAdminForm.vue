<script setup>
import { computed, reactive, ref } from 'vue';
import { validateAdminForm } from '../../application/admin/universalFormRules';

const props = defineProps({
  definition: { type: Object, required: true },
  modelValue: { type: Object, default: () => ({}) },
  context: { type: Object, default: () => ({}) },
  submitLabel: { type: String, default: 'Save' },
});

const emit = defineEmits(['update:modelValue', 'submit', 'cancel']);
const values = reactive({ ...props.modelValue });
const errors = ref({});

const fields = computed(() => props.definition.fields ?? []);

function setValue(key, value) {
  values[key] = value;
  emit('update:modelValue', { ...values });
  if (errors.value[key]) errors.value = { ...errors.value, [key]: undefined };
}

function submit() {
  const result = validateAdminForm(props.definition, values, props.context);
  errors.value = result.errors;
  if (result.valid) emit('submit', result.values);
}
</script>

<template>
  <form class="universal-admin-form" @submit.prevent="submit">
    <div class="form-grid">
      <label v-for="field in fields" :key="field.key" class="form-field">
        <span>{{ field.label }}<strong v-if="field.required"> *</strong></span>
        <select v-if="field.type === 'select'" :value="values[field.key] ?? ''" @change="setValue(field.key, $event.target.value)">
          <option value="">Select…</option>
          <option v-for="option in field.options || []" :key="option" :value="option">{{ option }}</option>
        </select>
        <textarea v-else-if="field.type === 'textarea'" :value="values[field.key] ?? ''" @input="setValue(field.key, $event.target.value)" />
        <input v-else :type="field.type === 'checkbox' ? 'checkbox' : field.type" :min="field.min" :max="field.max" :checked="field.type === 'checkbox' ? Boolean(values[field.key] ?? field.defaultValue) : undefined" :value="field.type === 'checkbox' ? undefined : values[field.key] ?? ''" @change="field.type === 'checkbox' ? setValue(field.key, $event.target.checked) : setValue(field.key, $event.target.value)" @input="field.type === 'checkbox' ? undefined : setValue(field.key, $event.target.value)" />
        <small v-if="errors[field.key]" class="form-error">{{ errors[field.key] }}</small>
      </label>
    </div>
    <div class="form-actions">
      <button type="button" @click="emit('cancel')">Cancel</button>
      <button type="submit">{{ submitLabel }}</button>
    </div>
  </form>
</template>

<style scoped>
.universal-admin-form { display: grid; gap: 1rem; }
.form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
.form-field { display: grid; gap: .35rem; min-width: 0; }
.form-field > span { font-weight: 600; }
.form-field input, .form-field select, .form-field textarea { width: 100%; box-sizing: border-box; padding: .6rem; border: 1px solid var(--border-color, #bbb); border-radius: .5rem; }
.form-field textarea { min-height: 5rem; resize: vertical; }
.form-error { color: var(--danger-color, #b42318); }
.form-actions { display: flex; justify-content: flex-end; gap: .75rem; flex-wrap: wrap; }
</style>
