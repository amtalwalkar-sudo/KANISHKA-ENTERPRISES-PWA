<script setup>
const props = defineProps({
  form: { type: String, required: true },
  busy: { type: Boolean, default: false },
  latestOdometer: { type: [Number, String], default: null },
  dayDiff: { type: Object, required: true },
  dayStartOdometer: { type: String, default: '' },
  dayBusinessKm: { type: String, default: '' },
  dayPersonalKm: { type: String, default: '' },
  personalDiff: { type: Object, required: true },
  personalStartOdometer: { type: String, default: '' },
  personalBusinessKm: { type: String, default: '' },
  personalPersonalKm: { type: String, default: '' },
  personalEndOdometer: { type: String, default: '' },
  personalEndValid: { type: Boolean, default: false },
  personalToll: { type: String, default: '' },
  personalParking: { type: String, default: '' },
  shiftRevenue: { type: String, default: '' },
  shiftEndOdometer: { type: String, default: '' },
  shiftEndValid: { type: Boolean, default: false },
  shiftToll: { type: String, default: '' },
  shiftParking: { type: String, default: '' },
  shiftTollNotIncluded: { type: Boolean, default: false },
  shiftParkingNotIncluded: { type: Boolean, default: false },
  unreviewedOcrRideCount: { type: Number, default: 0 },
})

defineEmits([
  'close',
  'open-ocr-review',
  'update:dayStartOdometer',
  'update:dayBusinessKm',
  'update:dayPersonalKm',
  'update:personalStartOdometer',
  'update:personalBusinessKm',
  'update:personalPersonalKm',
  'update:personalEndOdometer',
  'update:personalToll',
  'update:personalParking',
  'update:shiftRevenue',
  'update:shiftEndOdometer',
  'update:shiftToll',
  'update:shiftParking',
  'update:shiftTollNotIncluded',
  'update:shiftParkingNotIncluded',
])
</script>

<template>
  <div class="work-form-overlay" role="dialog" aria-modal="true">
    <div class="work-form-card" data-kfe-draft-form="true" :data-kfe-draft-key="`work:${props.form}`">
      <div class="drawer-header">
        <p class="kfe-eyebrow">
          {{ props.form === 'DAY_START' ? 'START OF DAY' : props.form === 'PERSONAL_START' ? 'START PERSONAL TRIP' : props.form === 'PERSONAL_END' ? 'END PERSONAL TRIP' : 'END SHIFT' }}
        </p>
        <button type="button" class="close-drawer-btn" aria-label="Close" @click="$emit('close')">[X]</button>
      </div>

      <div v-if="props.form === 'DAY_START'" class="work-form-fields">
        <label>Start odometer *
          <input :value="props.dayStartOdometer" @input="$emit('update:dayStartOdometer', $event.target.value)" inputmode="numeric" type="number" min="0" step="1">
        </label>
        <div v-if="props.dayDiff.required" class="allocation-block">
          <p>Allocate {{ props.dayDiff.difference }} km (Odometer Gap)</p>
          <label>Business KM *<input :value="props.dayBusinessKm" @input="$emit('update:dayBusinessKm', $event.target.value)" inputmode="numeric" type="number" min="0" step="1"></label>
          <label>Personal KM *<input :value="props.dayPersonalKm" @input="$emit('update:dayPersonalKm', $event.target.value)" inputmode="numeric" type="number" min="0" step="1"></label>
        </div>
        <p class="muted">Prefilled from the latest authoritative odometer when available; editable.</p>
      </div>

      <div v-else-if="props.form === 'PERSONAL_START'" class="work-form-fields">
        <label>Start odometer *
          <input :value="props.personalStartOdometer" @input="$emit('update:personalStartOdometer', $event.target.value)" inputmode="numeric" type="number" min="0" step="1">
        </label>
        <div v-if="props.personalDiff.required" class="allocation-block">
          <p>Allocate {{ props.personalDiff.difference }} km (Odometer Gap)</p>
          <label>Business KM *<input :value="props.personalBusinessKm" @input="$emit('update:personalBusinessKm', $event.target.value)" inputmode="numeric" type="number" min="0" step="1"></label>
          <label>Personal KM *<input :value="props.personalPersonalKm" @input="$emit('update:personalPersonalKm', $event.target.value)" inputmode="numeric" type="number" min="0" step="1"></label>
        </div>
        <p class="muted">Prefilled from the latest authoritative odometer; editable.</p>
      </div>

      <div v-else-if="props.form === 'PERSONAL_END'" class="work-form-fields">
        <label class="mandatory-field">End odometer *
          <input :value="props.personalEndOdometer" @input="$emit('update:personalEndOdometer', $event.target.value)" inputmode="numeric" type="number" min="0" step="1" :class="{ 'input-invalid': !props.personalEndValid && props.personalEndOdometer !== '' }" placeholder="Starts Empty (Mandatory)">
        </label>
        <label>Toll <span class="muted">Optional</span>
          <input :value="props.personalToll" @input="$emit('update:personalToll', $event.target.value)" inputmode="decimal" type="number" min="0" step="0.01" placeholder="0.00">
        </label>
        <label>Parking <span class="muted">Optional</span>
          <input :value="props.personalParking" @input="$emit('update:personalParking', $event.target.value)" inputmode="decimal" type="number" min="0" step="0.01" placeholder="0.00">
        </label>
        <p class="muted">End odometer is required and starts empty. Complete the form, then use the Close Personal Trip swipe.</p>
      </div>

      <div v-else class="work-form-fields shift-end-fields">
        <label>Revenue *
          <input :value="props.shiftRevenue" @input="$emit('update:shiftRevenue', $event.target.value)" inputmode="decimal" type="number" min="0" step="0.01" placeholder="0.00">
        </label>
        <label class="mandatory-field">End odometer *
          <input :value="props.shiftEndOdometer" @input="$emit('update:shiftEndOdometer', $event.target.value)" inputmode="numeric" type="number" min="0" step="1" :class="{ 'input-invalid': !props.shiftEndValid && props.shiftEndOdometer !== '' }" placeholder="Required">
        </label>
        <div class="optional-row">
          <label>Toll <span class="optional">Optional</span>
            <input :value="props.shiftToll" @input="$emit('update:shiftToll', $event.target.value)" inputmode="decimal" type="number" min="0" step="0.01" placeholder="0.00">
          </label>
          <label>Parking <span class="optional">Optional</span>
            <input :value="props.shiftParking" @input="$emit('update:shiftParking', $event.target.value)" inputmode="decimal" type="number" min="0" step="0.01" placeholder="0.00">
          </label>
        </div>
        <div class="fare-checks">
          <label><input :checked="props.shiftTollNotIncluded" @change="$emit('update:shiftTollNotIncluded', $event.target.checked)" type="checkbox"> Toll was not included in fare</label>
          <label><input :checked="props.shiftParkingNotIncluded" @change="$emit('update:shiftParkingNotIncluded', $event.target.checked)" type="checkbox"> Parking was not included in fare</label>
        </div>
        <button
          class="ocr-review-entry"
          type="button"
          :class="{ 'is-empty': props.unreviewedOcrRideCount === 0 }"
          :disabled="props.unreviewedOcrRideCount === 0"
          :aria-label="`Unreviewed OCR rides: ${props.unreviewedOcrRideCount}`"
          @click="$emit('open-ocr-review')"
        >
          <span>Unreviewed OCR rides</span>
          <strong>{{ props.unreviewedOcrRideCount }}</strong>
          <span v-if="props.unreviewedOcrRideCount > 0" class="ocr-review-hint">Review rides →</span>
        </button>
        <p class="muted">Revenue and end odometer are required. Toll and parking are optional. Tick the box only when that charge was not included in the fare. Then use the Close Shift swipe.</p>
      </div>

      <button class="secondary-action touch-button-48" type="button" :disabled="props.busy" @click="$emit('close')">
        CANCEL
      </button>
    </div>
  </div>
</template>
