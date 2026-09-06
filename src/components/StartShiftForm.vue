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
const businessKm = ref('0')
const personalKm = ref('0')
const openingCashFloat = ref('0')
const vehicleInspectionCleared = ref(false)
const submitting = ref(false)
const error = ref('')

const previousOdometer = computed(() => previousOdometerValue.value)
const startValue = computed(() => Number(startOdometer.value))
const gap = computed(() => previousOdometer.value == null ? 0 : Math.max(0, startValue.value - previousOdometer.value))
const allocationValid = computed(() => {
  const business = Number(businessKm.value)
  const personal = Number(personalKm.value)
  return Number.isInteger(business) && Number.isInteger(personal) && business >= 0 && personal >= 0 && business + personal === gap.value
})
const cashValid = computed(() => Number.isFinite(Number(openingCashFloat.value)) && Number(openingCashFloat.value) >= 0)
const odometerValid = computed(() => Number.isInteger(startValue.value) && startValue.value > 0 && (previousOdometer.value == null || startValue.value >= previousOdometer.value))
const canSubmit = computed(() => odometerValid.value && allocationValid.value && cashValid.value && vehicleInspectionCleared.value && !submitting.value && !props.busy)

function enforceDecimalInputs() {
  document.querySelectorAll('[data-kfe-shift-state="STARTING_SHIFT"] input[type="number"]').forEach(input => {
    input.addEventListener('input', event => {
      const target = event.target
      if (target instanceof HTMLInputElement && target.value.includes('.')) target.value = target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1')
    })
  })
}

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

async function submit() {
  if (!canSubmit.value) return
  submitting.value = true
  error.value = ''
  const now = new Date()
  const startedAt = now.toISOString()
  const businessDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  try {
    await kfePresentationApi.startShift({
      start_odometer_km: startValue.value,
      previous_odometer_km: previousOdometer.value,
      odometer_gap_km: gap.value,
      business_km: Number(businessKm.value),
      personal_km: Number(personalKm.value),
      opening_cash_float_paise: Math.round(Number(openingCashFloat.value) * 100),
      vehicle_inspection_cleared: true,
      business_date: businessDate,
      started_at: startedAt,
      actionMode: 'SWIPE',
      direction: 'RIGHT',
    })
    window.dispatchEvent(new CustomEvent('kfe:work-state-changed'))
    emit('submitted')
  } catch (cause) {
    error.value = String(cause?.message || cause)
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await loadPreviousOdometer()
  enforceDecimalInputs()
})
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
        <input v-model="startOdometer" type="number" inputmode="numeric" min="1" step="1">
      </label>
      <div data-kfe-field="odometer_gap_km" class="allocation-block"><span>Odometer Gap</span><strong>{{ gap }} km</strong></div>
      <label data-kfe-field="business_km">Business Allocation (km) *
        <input v-model="businessKm" type="number" inputmode="numeric" min="0" step="1">
      </label>
      <label data-kfe-field="personal_km">Personal Allocation (km) *
        <input v-model="personalKm" type="number" inputmode="numeric" min="0" step="1">
      </label>
      <label data-kfe-field="opening_cash_float">Opening Cash Float (₹) *
        <input v-model="openingCashFloat" type="number" inputmode="decimal" min="0" step="0.01">
      </label>
      <label data-kfe-field="vehicle_inspection_cleared" class="fare-checks">
        <input v-model="vehicleInspectionCleared" type="checkbox">
        Vehicle inspection cleared
      </label>
      <div class="work-form-actions">
        <button type="button" data-kfe-action="cancel-start-shift" class="secondary-action touch-button-48" :disabled="submitting" @click="emit('close')">Cancel</button>
        <button type="button" data-kfe-action="submit-start-shift" class="primary-action touch-button-48" :disabled="!canSubmit" @click="submit">Confirm Start Shift</button>
      </div>
    </div>
  </div>
</template>
