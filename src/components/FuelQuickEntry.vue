<script setup>
import { computed, onMounted, ref } from 'vue'
import { application } from '../../js/app.js'
import KfeSwipeBar from './KfeSwipeBar.vue'

const props = defineProps({ authoritativeOdometer: { type: [Number, String], default: null } })
const emit = defineEmits(['close','saved'])

const odometer = ref('')
const price = ref('')
const amount = ref('')
const busy = ref(false)
const error = ref('')
const notice = ref('')
const confirmOpen = ref(false)
const editing = ref(false)
const editingId = ref(null)
const lastFuel = ref(null)
const locationState = ref({ latitude: null, longitude: null, location_name: null })

const authoritative = computed(() => props.authoritativeOdometer == null || props.authoritativeOdometer === '' ? null : Number(props.authoritativeOdometer))
const quantity = computed(() => {
  const p = Number(price.value), a = Number(amount.value)
  return Number.isFinite(p) && p > 0 && Number.isFinite(a) && a > 0 ? a / p : null
})
const odometerValid = computed(() => {
  const n = Number(odometer.value)
  return Number.isInteger(n) && n >= 0 && (authoritative.value == null || n >= authoritative.value)
})
const fieldsValid = computed(() => odometerValid.value && Number(price.value) > 0 && Number(amount.value) > 0)

async function loadLast() {
  const rows = (await application.listFuel()).filter(r => !r.is_deleted).sort((a,b) => String(b.recorded_at || b.created_at || '').localeCompare(String(a.recorded_at || a.created_at || '')))
  lastFuel.value = rows[0] || null
}

function beginNew() {
  editing.value = false
  editingId.value = null
  odometer.value = authoritative.value == null ? '' : String(authoritative.value)
  price.value = ''
  amount.value = ''
  error.value = ''
  notice.value = ''
}

function beginEdit() {
  if (!lastFuel.value) return
  editing.value = true
  editingId.value = lastFuel.value.id
  odometer.value = String(lastFuel.value.odometer ?? '')
  price.value = String(lastFuel.value.price_per_kg ?? '')
  amount.value = String((Number(lastFuel.value.amount_paise || 0) / 100).toFixed(2))
  error.value = ''
  notice.value = ''
}

async function captureLocation() {
  locationState.value = { latitude: null, longitude: null, location_name: null }
  try {
    if (!navigator.geolocation) return
    const position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 2500, maximumAge: 300000 }))
    const latitude = position.coords.latitude
    const longitude = position.coords.longitude
    locationState.value = { latitude, longitude, location_name: null }
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`, { headers: { Accept: 'application/json' } })
      if (response.ok) {
        const data = await response.json()
        locationState.value.location_name = data.display_name || null
      }
    } catch {}
  } catch {}
}

async function requestSave() {
  if (!fieldsValid.value) {
    error.value = authoritative.value != null && Number(odometer.value) < authoritative.value ? 'Fuel odometer cannot be below the authoritative odometer.' : 'Enter odometer, fuel price, and amount.'
    return
  }
  confirmOpen.value = true
}

async function confirmSave() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const data = {
      odometer: Number(odometer.value),
      price_per_kg: Number(price.value),
      amount_paise: Math.round(Number(amount.value) * 100),
      scope: 'BUSINESS',
      entry_source: editing.value ? 'EDIT_LAST_FUEL' : 'FUEL'
    }
    if (editing.value) {
      await application.updateFuel(editingId.value, data)
    } else {
      data.recorded_at = new Date().toISOString()
      data.latitude = locationState.value.latitude
      data.longitude = locationState.value.longitude
      data.location_name = locationState.value.location_name
      await application.recordFuel(data)
    }
    await loadLast()
    confirmOpen.value = false
    notice.value = 'Fuel saved.'
    emit('saved')
    setTimeout(() => emit('close'), 250)
  } catch (e) {
    error.value = String(e?.message || e)
  } finally {
    busy.value = false
  }
}

function cancel() {
  if (!busy.value) emit('close')
}

onMounted(() => {
  beginNew()
  void loadLast()
  void captureLocation()
})
</script>

<template>
  <div class="fuel-form-overlay" role="dialog" aria-modal="true">
    <div class="fuel-form-card">
      <p class="kfe-eyebrow">⛽ REFUEL</p>
      <h2>Quick Fuel</h2>
      <div class="fuel-form-fields">
        <label>Odometer *<input v-model="odometer" inputmode="numeric" type="number" min="0" step="1" autocomplete="off"></label>
        <label>Fuel price per litre/kg *<input v-model="price" inputmode="decimal" type="number" min="0" step="0.01" autocomplete="off"></label>
        <label>Amount *<input v-model="amount" inputmode="decimal" type="number" min="0" step="0.01" autocomplete="off"></label>
        <p v-if="quantity != null" class="muted">Quantity: {{ quantity.toFixed(3) }} kg</p>
      </div>
      <div v-if="lastFuel" class="last-fuel-entry">
        <p class="kfe-eyebrow">LAST FUEL ENTRY</p>
        <p>Odometer: {{ lastFuel.odometer }}</p>
        <p>Price: ₹{{ Number(lastFuel.price_per_kg).toFixed(2) }}</p>
        <p>Amount: ₹{{ (Number(lastFuel.amount_paise || 0) / 100).toFixed(2) }}</p>
        <button type="button" class="secondary-action" :disabled="busy" @click="beginEdit">Edit</button>
      </div>
      <p v-if="error" class="work-error" role="alert">{{ error }}</p>
      <p v-if="notice" class="work-notice" role="status">{{ notice }}</p>
      <KfeSwipeBar v-if="!confirmOpen" right-label="SAVE FUEL" right-action="SAVE_FUEL" :disabled="busy || !fieldsValid" @swipe="requestSave" />
      <div v-else class="fuel-confirmation" role="alertdialog" aria-modal="true">
        <p>Confirm this fuel entry?</p>
        <button type="button" class="primary-action" :disabled="busy" @click="confirmSave">Confirm</button>
        <button type="button" class="secondary-action" :disabled="busy" @click="confirmOpen=false">Cancel</button>
      </div>
      <button type="button" class="secondary-action" :disabled="busy" @click="cancel">Cancel</button>
    </div>
  </div>
</template>

<style scoped>
.fuel-form-overlay{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:1rem;background:rgba(0,0,0,.45)}
.fuel-form-card{width:min(32rem,100%);max-height:90vh;overflow:auto;border-radius:1rem;padding:1.25rem;background:var(--surface,#fff);box-shadow:0 1rem 3rem rgba(0,0,0,.2)}
.fuel-form-fields,.last-fuel-entry{display:grid;gap:.75rem;margin:.75rem 0 1rem}
.fuel-form-card label{display:grid;gap:.35rem;font-weight:600}
.fuel-form-card input{width:100%;box-sizing:border-box;padding:.75rem;border:1px solid #bbb;border-radius:.5rem}
.fuel-confirmation{display:grid;gap:.5rem;margin:1rem 0}
</style>
