<script setup>
import { onMounted, ref } from 'vue'
import { enforceDecimalInputs } from '../../js/ui/decimal-input.js'

const props = defineProps({
  form: { type: String, required: true },
  busy: { type: Boolean, default: false },
  dayDiff: { type: Object, required: true },
  dayStartOdometer: { type: String, default: '' },
  dayBusinessKm: { type: String, default: '' },
  dayPersonalKm: { type: String, default: '' },
  personalStartOdometer: { type: String, default: '' },
  personalEndOdometer: { type: String, default: '' },
  personalEndValid: { type: Boolean, default: false },
  shiftEndOdometer: { type: String, default: '' },
  shiftEndValid: { type: Boolean, default: false },
})

defineEmits(['close','update:dayStartOdometer','update:dayBusinessKm','update:dayPersonalKm','update:personalStartOdometer','update:personalEndOdometer','update:shiftEndOdometer'])
const personalEndInput = ref(null)
function sanitizePersonalEnd() {
  const value = enforceDecimalInputs([personalEndInput.value], { scale: 3 })[0] || ''
  if (personalEndInput.value && personalEndInput.value.value !== value) personalEndInput.value.value = value
}
onMounted(() => {
  if (props.form === 'PERSONAL_END') {
    sanitizePersonalEnd()
    personalEndInput.value?.addEventListener('input', sanitizePersonalEnd)
  }
})
</script>

<template>
  <div class="work-form-overlay" role="dialog" aria-modal="true" aria-label="Work form">
    <div class="work-form-card" data-kfe-form="work">
      <div class="drawer-header">
        <p class="kfe-eyebrow">{{ props.form === 'DAY_START' ? 'START DAY' : props.form === 'PERSONAL_START' ? 'START PERSONAL TRIP' : props.form === 'PERSONAL_END' ? 'END PERSONAL TRIP' : 'END SHIFT' }}</p>
        <button type="button" class="close-drawer-btn" aria-label="Close" @click="$emit('close')">×</button>
      </div>

      <div v-if="props.form === 'DAY_START'" class="work-form-fields">
        <label>Start odometer *<input :value="props.dayStartOdometer" @input="$emit('update:dayStartOdometer', $event.target.value)" inputmode="numeric" type="number" min="0" step="1" autocomplete="off"></label>
        <div v-if="props.dayDiff.required" class="allocation-block">
          <p>Allocate {{ props.dayDiff.difference }} km</p>
          <label>Business KM *<input :value="props.dayBusinessKm" @input="$emit('update:dayBusinessKm', $event.target.value)" inputmode="numeric" type="number" min="0" step="1"></label>
          <label>Personal KM *<input :value="props.dayPersonalKm" @input="$emit('update:dayPersonalKm', $event.target.value)" inputmode="numeric" type="number" min="0" step="1"></label>
        </div>
        <p class="muted">The latest authoritative odometer is used as the reference when available.</p>
      </div>

      <div v-else-if="props.form === 'PERSONAL_START'" class="work-form-fields">
        <label>Start odometer *<input :value="props.personalStartOdometer" @input="$emit('update:personalStartOdometer', $event.target.value)" inputmode="numeric" type="number" min="0" step="1"></label>
      </div>

      <div v-else-if="props.form === 'PERSONAL_END'" class="work-form-fields">
        <label>End odometer *<input ref="personalEndInput" :value="props.personalEndOdometer" @input="$emit('update:personalEndOdometer', $event.target.value)" inputmode="numeric" type="text" min="0" :class="{ 'input-invalid': !props.personalEndValid && props.personalEndOdometer !== '' }" autocomplete="off"></label>
        <p class="muted">End odometer cannot be below the trip start reading.</p>
      </div>

      <div v-else class="work-form-fields">
        <label>End odometer *<input :value="props.shiftEndOdometer" @input="$emit('update:shiftEndOdometer', $event.target.value)" inputmode="numeric" type="number" min="0" step="1" :class="{ 'input-invalid': !props.shiftEndValid && props.shiftEndOdometer !== '' }"></label>
        <p class="muted">End the shift only after all trips are complete.</p>
      </div>

      <button class="secondary-action touch-button-48" type="button" :disabled="props.busy" @click="$emit('close')">CANCEL</button>
    </div>
  </div>
</template>
