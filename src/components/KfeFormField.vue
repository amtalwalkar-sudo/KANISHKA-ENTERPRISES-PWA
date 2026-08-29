<script setup>
import { computed } from 'vue';

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  required: { type: Boolean, default: false },
  optional: { type: Boolean, default: false },
  placeholder: { type: String, default: '' },
  help: { type: String, default: '' },
  error: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  autocomplete: { type: String, default: 'off' },
});

const emit = defineEmits(['update:modelValue', 'blur']);
const describedBy = computed(() => [props.help ? `${props.id}-help` : '', props.error ? `${props.id}-error` : ''].filter(Boolean).join(' ') || undefined);

function update(event) {
  emit('update:modelValue', event.target.value);
}
</script>

<template>
  <div class="kfe-form-field" :class="{ 'has-error': error, 'is-disabled': disabled }">
    <label class="kfe-form-label" :for="id">
      <span>{{ label }}</span>
      <span v-if="required" class="kfe-required">Required</span>
      <span v-else-if="optional" class="kfe-optional">Optional</span>
    </label>

    <input
      :id="id"
      class="kfe-form-input"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :autocomplete="autocomplete"
      :aria-invalid="error ? 'true' : 'false'"
      :aria-describedby="describedBy"
      @input="update"
      @blur="emit('blur')"
    />

    <p v-if="help" :id="`${id}-help`" class="kfe-form-help">{{ help }}</p>
    <p v-if="error" :id="`${id}-error`" class="kfe-form-error" role="alert">{{ error }}</p>
  </div>
</template>
