<script setup>
import { onMounted, ref } from 'vue'
import { RideCaptureService } from '../application/rideCapture/rideCaptureService.js'
import { notifyRideReview } from '../infrastructure/notifications/rideReviewNotification.js'

const file = ref(null)
const extraction = ref(null)
const shifts = ref([])
const recent = ref([])
const busy = ref(false)
const message = ref('')
const error = ref('')

const localDateTime = value => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
const isoDateTime = value => {
  if (!value) return ''
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString()
}
const setFile = event => { file.value = event.target.files?.[0] || null; extraction.value = null; error.value = ''; message.value = '' }
const extract = async () => {
  if (!file.value) return fail('Select a ride screenshot first.')
  busy.value = true; error.value = ''; message.value = ''
  try {
    const result = await RideCaptureService.extract(file.value)
    if (!result.ok) return fail(result.errors.join(' '))
    extraction.value = { ...result.value, shiftId: shifts.value[0]?.id || null, rideStartAt: localDateTime(result.value.rideStartAt), rideEndAt: localDateTime(result.value.rideEndAt) }
    await notifyRideReview(result.value)
    message.value = 'Ride extracted. Review every field before saving.'
  } catch (e) { fail(e?.message || 'Ride extraction failed.') } finally { busy.value = false }
}
const validate = () => {
  if (!extraction.value) return false
  const candidate = { ...extraction.value, rideStartAt: isoDateTime(extraction.value.rideStartAt), rideEndAt: isoDateTime(extraction.value.rideEndAt) }
  const result = RideCaptureService.validate(candidate)
  if (!result.ok) { fail(result.errors.join(' ')); return false }
  extraction.value = { ...result.value, rideStartAt: localDateTime(result.value.rideStartAt), rideEndAt: localDateTime(result.value.rideEndAt) }
  error.value = ''
  return true
}
const save = async () => {
  if (!validate()) return
  busy.value = true
  try {
    const payload = { ...extraction.value, rideStartAt: isoDateTime(extraction.value.rideStartAt), rideEndAt: isoDateTime(extraction.value.rideEndAt) }
    const result = await RideCaptureService.save(payload)
    if (!result.ok) return fail(result.errors.join(' '))
    message.value = 'Ride confirmed and saved to the canonical trip record.'
    extraction.value = null
    file.value = null
    const input = document.querySelector('#ride-screenshot')
    if (input) input.value = ''
    await refresh()
  } catch (e) { fail(e?.message || 'Ride could not be saved.') } finally { busy.value = false }
}
const fail = text => { error.value = text; message.value = '' }
const refresh = async () => {
  const context = await RideCaptureService.getReviewContext()
  shifts.value = context.shifts
  recent.value = await RideCaptureService.getRecentRides(10)
}
onMounted(refresh)
</script>

<template>
  <main class="capture">
    <header class="hero"><div><small>KFE RIDE CAPTURE</small><h1>Screenshot → Ride</h1><p>Extract, validate, review, then save.</p></div></header>
    <div v-if="message" class="message">{{ message }}</div>
    <div v-if="error" class="error">{{ error }}</div>

    <section class="card">
      <div class="eyebrow">1 · CAPTURE</div>
      <h2>Ride screenshot</h2>
      <p class="muted">The multimodal provider is an external adapter. KFE does not depend on a specific AI/OCR vendor.</p>
      <input id="ride-screenshot" type="file" accept="image/*" capture="environment" @change="setFile">
      <button class="primary" :disabled="busy || !file" @click="extract">{{ busy ? 'Processing…' : 'Extract ride' }}</button>
      <p class="hint">If no provider is configured, KFE will stop safely here rather than invent ride data.</p>
    </section>

    <section v-if="extraction" class="card review">
      <div class="eyebrow">2 · REVIEW</div>
      <h2>Ride detected</h2>
      <label>Shift (optional)<select v-model="extraction.shiftId"><option :value="null">No shift association</option><option v-for="shift in shifts" :key="shift.id" :value="shift.id">{{ new Date(shift.shiftStartAt).toLocaleString() }} · {{ shift.startOdometer }} km start</option></select></label>
      <label>Operator<input v-model="extraction.operator"></label>
      <div class="two"><label>Pickup address<input v-model="extraction.pickupAddress"></label><label>Drop address<input v-model="extraction.dropAddress"></label></div>
      <div class="three"><label>Fare (₹)<input v-model="extraction.fare" type="number" min="0" step="0.01"></label><label>Ride KM<input v-model="extraction.rideKm" type="number" min="0" step="0.1"></label><label>Duration (min)<input v-model="extraction.durationMinutes" type="number" min="0" step="0.1"></label></div>
      <div class="two"><label>Ride start<input v-model="extraction.rideStartAt" type="datetime-local"></label><label>Ride end<input v-model="extraction.rideEndAt" type="datetime-local"></label></div>
      <label>Cancellation / status<input v-model="extraction.cancellation" placeholder="Blank for completed ride"></label>
      <div class="review-actions"><button class="secondary" @click="validate">Validate</button><button class="primary" :disabled="busy" @click="save">Confirm & Save</button></div>
      <p class="warning">Saving creates the canonical <strong>trip</strong> record. Fare/revenue and ride KM remain available to Work and Performance through the same authoritative trip data.</p>
    </section>

    <section class="card"><div class="eyebrow">3 · RECENT</div><h2>Recently captured / completed rides</h2><p v-if="!recent.length" class="muted">No rides saved yet.</p><div v-for="ride in recent" :key="ride.id" class="ride-row"><div><strong>{{ ride.operator || 'Unknown operator' }}</strong><span>{{ ride.pickupAddress || ride.tripStartLocation?.placeName || 'Pickup unavailable' }} → {{ ride.dropAddress || ride.tripEndLocation?.placeName || 'Drop unavailable' }}</span><small>{{ ride.tripStartAt ? new Date(ride.tripStartAt).toLocaleString() : 'Time unavailable' }}</small></div><strong>₹{{ Number(ride.revenue || 0).toFixed(2) }} · {{ Number(ride.tripKm || 0).toFixed(1) }} km</strong></div></section>
  </main>
</template>

<style scoped>
.capture{max-width:760px;margin:auto;padding:20px 16px 48px;color:#0f172a}.hero{margin-bottom:16px}.hero small,.eyebrow{font-size:.65rem;font-weight:900;letter-spacing:.12em;color:#64748b}.hero h1{margin:4px 0;font-size:1.6rem}.hero p{margin:0;color:#64748b}.card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:18px;margin:12px 0;box-shadow:0 6px 24px rgba(15,23,42,.05)}h2{margin:6px 0 10px}.muted,.hint{color:#64748b;font-size:.88rem}.hint{margin-bottom:0;font-size:.76rem}.message,.error{padding:12px 14px;border-radius:12px;margin:10px 0}.message{background:#ecfdf5;color:#166534}.error{background:#fef2f2;color:#991b1b}label{display:block;font-size:.78rem;font-weight:800;margin:10px 0}input,select{display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:11px;border:1px solid #cbd5e1;border-radius:10px;background:#fff;font:inherit;font-weight:500}.primary,.secondary{border:0;border-radius:10px;padding:11px 14px;font-weight:900;cursor:pointer;margin-top:12px}.primary{background:#0f172a;color:#fff}.secondary{background:#e2e8f0;color:#0f172a}.primary:disabled{opacity:.5}.two,.three{display:grid;gap:10px}.two{grid-template-columns:repeat(2,minmax(0,1fr))}.three{grid-template-columns:repeat(3,minmax(0,1fr))}.review-actions{display:flex;gap:10px}.review-actions button{flex:1}.warning{font-size:.76rem;color:#475569;background:#f8fafc;border-radius:10px;padding:10px;margin-top:12px}.ride-row{display:flex;justify-content:space-between;gap:14px;border-top:1px solid #e2e8f0;padding:12px 0}.ride-row div{min-width:0}.ride-row span,.ride-row small{display:block;color:#64748b;margin-top:3px}.ride-row span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}@media(max-width:560px){.two,.three{grid-template-columns:1fr}.ride-row{display:block}.ride-row>strong{display:block;margin-top:6px}}
</style>
