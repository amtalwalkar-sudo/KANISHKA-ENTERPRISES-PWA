<script setup>
defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  id: { type: String, default: () => `input-${Math.random().toString(36).substring(2, 9)}` }
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div :class="['base-input-group', { 'has-error': error }]">
    <label v-if="label" :for="id" class="input-label">
      {{ label }} <span v-if="required" class="required-star">*</span>
    </label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      class="input-field"
      @input="emit('update:modelValue', $event.target.value)"
    />
    <span v-if="error" class="input-error-msg">{{ error }}</span>
  </div>
</template>

<style scoped>
.base-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  width: 100%;
}
.input-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-main, #334155);
}
.required-star {
  color: #dc2626;
}
.input-field {
  padding: 0.45rem 0.6rem;
  border-radius: 6px;
  border: 1px solid var(--border-color, #cbd5e1);
  font-size: 0.78rem;
  background: var(--bg-surface, #fff);
  color: var(--text-main, #0f172a);
  outline: none;
}
.input-field:focus {
  border-color: var(--color-primary, #2563eb);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}
.has-error .input-field {
  border-color: #dc2626;
}
.input-error-msg {
  font-size: 0.65rem;
  color: #dc2626;
}
</style>
