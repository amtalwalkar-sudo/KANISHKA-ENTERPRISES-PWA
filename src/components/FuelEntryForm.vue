<script setup>
import { computed, ref } from 'vue'
import { calculateFuelQuantityKg, rupeesToPaise } from '../domain/math/index.js'

const props = defineProps({
  application: { type: Object, required: true },
  activeRecord: { type: Object, default: null },
  lastPosition: { type: Object, default: null }
})

const emit = defineEmits(['saved', 'close'])

const busy = ref(false)
const error = ref('')
const success = ref('')

const isEdit = computed(() => !!props.activeRecord)

const draft = ref({
  recordedAt: props.activeRecord?.recordedAt || new Date().toISOString().slice(0, 16),
  odometer: props.activeRecord?.odometer || '',
  pricePerKg: props.activeRecord?.pricePerKg || '',
  amount: props.activeRecord?.amount || '',
  locationName: props.activeRecord?.locationName || '',
  locationArea: props.activeRecord?.locationArea || ''
})

const quantityKg = computed(() => {
  return calculateFuelQuantityKg(draft.value.amount, draft.value.pricePerKg)
})

const timestampLabel = computed(() => {
  return draft.value.recordedAt ? new Date(draft.value.recordedAt).toLocaleString() : '—'
})

function validate() {
  if (!draft.value.odometer || Number(draft.value.odometer) < 0) return 'Valid odometer reading is required.'
  if (!draft.value.pricePerKg || Number(draft.value.pricePerKg) <= 0) return 'Valid price per kg is required.'
  if (!draft.value.amount || Number(draft.value.amount) <= 0) return 'Valid amount is required.'
  return ''
}

async function save() {
  if (busy.value) return
  error.value = ''
  
  const validationError = validate()
  if (validationError) {
    error.value = validationError
    return
  }

  busy.value = true
  try {
    let result
    const recordedAtIso = new Date(draft.value.recordedAt).toISOString()

    if (isEdit.value) {
      result = await props.application.saveHistoricalCorrection(
        {
          entityType: 'Fuel',
          entityId: props.activeRecord?.entityId || props.activeRecord?.id
        },
        {
          recordedAt: recordedAtIso,
          odometer: Number(draft.value.odometer),
          pricePerKg: Number(draft.value.pricePerKg),
          amount: Number(draft.value.amount),
          locationName: draft.value.locationName || null,
          locationArea: draft.value.locationArea || null
        }
      )
      success.value = 'Fuel record updated successfully.'
    } else {
      const pos = props.lastPosition
      result = await props.application.recordFuel({
        odometer: Number(draft.value.odometer),
        price_per_kg: Number(draft.value.pricePerKg),
        amount_paise: rupeesToPaise(draft.value.amount),
        recorded_at: recordedAtIso,
        date: recordedAtIso.slice(0, 10),
        scope: 'BUSINESS',
        entry_source: 'FUEL',
        latitude: pos?.coords?.latitude ?? null,
        longitude: pos?.coords?.longitude ?? null,
        location_name: draft.value.locationName || null,
        location_area: draft.value.locationArea || null
      })
      success.value = 'Fuel record saved successfully.'
    }

    emit('saved', result)
    emit('close')
  } catch (e) {
    error.value = String(e?.message || e)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="fuel-form-card">
    <div class="fuel-form-header">
      <div>
        <p class="fuel-eyebrow">{{ isEdit ? 'CORRECTION' : 'ENTRY' }}</p>
        <h2>{{ isEdit ? 'Edit Fuel Record' : 'Record CNG Fuel' }}</h2>
      </div>
      <button type="button" class="kfe-qf-close" :disabled="busy" @click="emit('close')">×</button>
    </div>

    <form @submit.prevent="save">
      <div class="fuel-fields">
        <label>
          Odometer *
          <input v-model="draft.odometer" inputmode="numeric" type="number" min="0" step="1" required />
        </label>
        <label>
          Price / kg *
          <input v-model="draft.pricePerKg" inputmode="decimal" type="number" min="0" step="0.01" required />
        </label>
        <label>
          Amount *
          <input v-model="draft.amount" inputmode="decimal" type="number" min="0" step="0.01" required />
        </label>
      </div>

      <div class="fuel-summary">
        <span>Refuelled kg: <strong>{{ quantityKg === null ? '—' : quantityKg.toFixed(3) + ' kg' }}</strong></span>
        <span>🕒 {{ timestampLabel }}</span>
      </div>

      <p v-if="error" class="kfe-qf-error" role="alert">{{ error }}</p>
      <p v-if="success" class="kfe-qf-success" role="status">✓ {{ success }}</p>

      <div class="fuel-actions">
        <button type="button" class="secondary-action" :disabled="busy" @click="emit('close')">Cancel</button>
        <button type="submit" class="kfe-qf-swipe-track" :disabled="busy">
          {{ busy ? 'Saving…' : isEdit ? 'Save Correction' : 'Save Fuel' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.fuel-form-card {
  padding: 0.8rem;
  border-radius: 12px;
  background: var(--bg-surface, #ffffff);
  color: var(--text-main, #0f172a);
  border: 1px solid var(--border-color, #e2e8f0);
}

.fuel-form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.35rem;
}

.fuel-form-header h2 {
  margin: 0 0 0.22rem;
  font-size: 0.9rem;
}

.fuel-eyebrow {
  margin: 0;
  font-size: 0.52rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--text-muted, #64748b);
}

.kfe-qf-close {
  border: 0;
  background: transparent;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  color: var(--text-main, #0f172a);
}

.fuel-fields {
  display: grid;
  grid-template-columns: 1.1fr 1fr 1fr;
  gap: 0.3rem;
  margin-top: 0.5rem;
}

.fuel-form-card label {
  display: grid;
  gap: 0.13rem;
  font-size: 0.62rem;
  font-weight: 700;
}

.fuel-form-card input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.4rem 0.44rem;
  border: 1px solid var(--border-color, #c7cbd1);
  border-radius: 7px;
  background: var(--bg-surface, #fff);
  color: var(--text-main, #111);
  font-size: 0.82rem;
}

.fuel-summary {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.18rem 0.5rem;
  margin-top: 0.5rem;
  padding: 0.4rem 0;
  border-top: 1px solid var(--border-color, #e3e5e8);
  font-size: 0.65rem;
  color: var(--text-muted, #64748b);
}

.fuel-summary strong {
  font-size: 0.75rem;
  color: var(--text-main, #0f172a);
}

.kfe-qf-error, .kfe-qf-success {
  padding: 0.3rem;
  border-radius: 7px;
  margin: 0.24rem 0;
  font-size: 0.62rem;
}

.kfe-qf-error { background: #ffe9e9; color: #8a1f1f; }
.kfe-qf-success { background: #e9f8ed; color: #176b32; font-weight: 800; }

.fuel-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.3rem;
  margin-top: 0.5rem;
}

.secondary-action {
  padding: 0.38rem 0.56rem;
  border-radius: 7px;
  border: 1px solid var(--border-color, #bbb);
  background: var(--bg-surface, #fff);
  font-size: 0.66rem;
  cursor: pointer;
}

.kfe-qf-swipe-track {
  padding: 0.4rem 0.62rem;
  border-radius: 7px;
  border: none;
  background: var(--color-primary, #2563eb);
  color: #fff;
  font-weight: 800;
  font-size: 0.66rem;
  cursor: pointer;
}

.kfe-qf-swipe-track:disabled, .secondary-action:disabled {
  opacity: 0.55;
  cursor: wait;
}

@media(max-width: 520px) {
  .fuel-fields {
    grid-template-columns: 1fr 1fr;
  }
  .fuel-fields label:first-child {
    grid-column: 1 / -1;
  }
}
</style>
