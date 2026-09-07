<script setup>
import { computed, onMounted, ref } from 'vue'
import { kfePresentationApi } from '../presentation/application/presentation-api.js'

const props = defineProps({
  previousOdometer: { type: [Number, String], default: null },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'submitted'])

const previousOdometerValue = ref(props.previousOdometer == null ? null : Number(props.previousOdometer))
const startOdometer = ref(props.previousOdometer == null ? '' : String(props.previousOdometer))
const submitting = ref(false)
const error = ref('')

const previousOdometer = computed(() => previousOdometerValue.value)
const startValue = computed(() => Number(startOdometer.value))
const odometerValid = computed(() => Number.isInteger(startValue.value) && startValue.value >= 0 && (previousOdometer.value == null || startValue.value >= previousOdometer.value))
const canSubmit = computed(() => odometerValid.value && !submitting.value && !props.busy)

async function loadPreviousOdometer() {
  if (previousOdometer.value != null) return
  try {
    const state = await kfePresentationApi.getWorkScreenState()
    const latest = state?.latestOdometer
    if (latest != null) {
      previousOdometerValue.value = Number(latest)
      startOdometer.value = String(latest)
    }
  } catch (cause) {
    error.value = String(cause?.message || cause)
  }
}

function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  error.value = ''
  emit('submitted', startValue.value)
  submitting.value = false
}

onMounted(loadPreviousOdometer)
</script>

<template>
  <div data-kfe-shift-state="STARTING_SHIFT" class="work-form-overlay" role="dialog" aria-modal="true" aria-labelledby="start-shift-title">
    <div class="work-form-card" data-kfe-draft-form="start-shift-form" data-kfe-draft-key="shift_start_draft">
      <div class="drawer-header">
        <p class="kfe-eyebrow">STARTING SHIFT</p>
        <h2 id="start-shift-title">Start Shift</h2>
        <button type="button" class="close-drawer-btn" data-kfe-action="cancel-start-shift" aria-label="Cancel" @click="emit('close')">Cancel</button>
      </div>
      <div v-if="error" class="work-error" role="alert">{{ error }}</div>
      <label data-kfe-field="start_odometer">Start Odometer (km) *
        <input v-model="startOdometer" type="number" inputmode="numeric" min="0" step="1">
      </label>
      <p class="muted">Enter the odometer reading for the shift. No inspection, cash float, or kilometre allocation is required here.</p>
      <div class="work-form-actions">
        <button type="button" data-kfe-action="cancel-start-shift" class="secondary-action touch-button-48" :disabled="submitting" @click="emit('close')">Cancel</button>
        <button type="button" data-kfe-action="submit-start-shift" class="primary-action touch-button-48" :disabled="!canSubmit" @click="submit">Continue</button>
      </div>
    </div>
  </div>
</template>
