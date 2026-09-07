<script setup>
import { computed, onMounted, ref } from 'vue'

const props = defineProps({
  startOdometer: { type: [Number, String], default: null },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'submitted'])
const endOdometer = ref('')
const error = ref('')
const inputRef = ref(null)

function enforceDecimalInputs(input) {
  if (!input) return
  input.addEventListener('input', () => {
    const normalized = String(input.value || '').replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
    if (input.value !== normalized) input.value = normalized
    endOdometer.value = normalized
  })
}

const start = computed(() => Number(props.startOdometer))
const end = computed(() => Number(endOdometer.value))
const valid = computed(() => Number.isFinite(end.value) && end.value >= 0 && (!Number.isFinite(start.value) || end.value >= start.value))

function submit() {
  if (!valid.value) {
    error.value = 'End odometer cannot be below the trip start odometer.'
    return
  }
  error.value = ''
  emit('submitted', end.value)
}

onMounted(() => {
  enforceDecimalInputs(inputRef.value)
  inputRef.value?.focus()
})
</script>

<template>
  <div class="work-form-overlay" role="dialog" aria-modal="true" aria-labelledby="trip-end-title">
    <div class="work-form-card">
      <div class="drawer-header">
        <p class="kfe-eyebrow">END BUSINESS TRIP</p>
        <h2 id="trip-end-title">End Trip</h2>
        <button type="button" class="close-drawer-btn" data-kfe-action="cancel-end-trip" aria-label="Cancel" @click="$emit('close')">Cancel</button>
      </div>
      <div v-if="error" class="work-error" role="alert">{{ error }}</div>
      <label class="mandatory-field">End Odometer (km) *
        <input ref="inputRef" v-model="endOdometer" data-kfe-field="end_trip_odometer" type="text" inputmode="decimal" autocomplete="off" placeholder="Enter ending odometer">
      </label>
      <p class="muted">Start: {{ Number.isFinite(start) ? start : '—' }} km. The ending reading must not be lower.</p>
      <div class="work-form-actions">
        <button type="button" class="secondary-action touch-button-48" :disabled="props.busy" @click="$emit('close')">Back</button>
        <button type="button" data-kfe-action="end-trip" class="primary-action touch-button-48" :disabled="props.busy || !valid" @click="submit">End Trip</button>
      </div>
    </div>
  </div>
</template>
