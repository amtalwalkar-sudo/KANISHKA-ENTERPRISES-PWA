<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useDayShiftTripStore } from '../stores/dayShiftTrip.js'

const store = useDayShiftTripStore()
const startOdo = ref('')
const gapPersonal = ref('')
const gapDead = ref('')
const selectedOperator = ref('')
const closingOdo = ref('')
const shiftRevenue = ref('')
const toll = ref('')
const parking = ref('')
const tollTreatment = ref('NONE')
const reviewTrips = ref(false)
const message = ref('')
const error = ref('')
const clock = ref(Date.now())
let interval

const gap = computed(() => store.calculateGap(startOdo.value))
const allocatedGap = computed(() => Number(gapPersonal.value || 0) + Number(gapDead.value || 0))
const tripTimer = computed(() => {
  if (!store.trip?.tripStartAt) return '00:00:00'
  const seconds = Math.max(0, Math.floor((clock.value - Date.parse(store.trip.tripStartAt)) / 1000))
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
})
const notify = text => { message.value = text; error.value = ''; window.setTimeout(() => { if (message.value === text) message.value = '' }, 2200) }
const fail = text => { error.value = text; message.value = '' }

const goOnline = async () => {
  const needsGap = gap.value.valid && gap.value.gapKm > 0
  const result = await store.startShift(startOdo.value, needsGap ? { personalKm: gapPersonal.value, deadKm: gapDead.value } : null)
  if (result.requiresGapAllocation) return fail(`Allocate exactly ${result.gapKm} km as Personal or Dead KM before going Online.`)
  if (!result.ok) return fail(result.reason)
  startOdo.value = ''; gapPersonal.value = ''; gapDead.value = ''; notify('Online.')
}

const startTrip = async () => {
  const result = await store.startTrip(selectedOperator.value || store.defaultOperator)
  if (!result.ok) return fail(result.reason)
  selectedOperator.value = result.trip.operator
  notify('Trip started.')
}
const endTrip = async () => { if (await store.endTrip()) notify('Trip completed.') }
const cancelTrip = async () => { if (confirm('Cancel this accidental trip? It will not become a completed trip.')) { if (await store.cancelTrip()) notify('Trip cancelled.') } }

const goOffline = async () => {
  const trips = reviewTrips.value ? store.completedTrips.map(t => ({ id: t.id, operator: t.operator, tripKm: t.tripKm ?? '', revenue: t.revenue ?? '' })) : []
  const result = await store.endShift({ closingOdometer: closingOdo.value, revenue: shiftRevenue.value, toll: toll.value, parking: parking.value, tollParkingRevenueTreatment: tollTreatment.value, trips })
  if (!result.ok) return fail(result.reason)
  closingOdo.value = ''; shiftRevenue.value = ''; toll.value = ''; parking.value = ''; tollTreatment.value = 'NONE'; reviewTrips.value = false; notify('Offline.')
}

const primaryAction = async () => {
  if (!store.isOnline) return goOnline()
  if (store.isTripActive) return endTrip()
  return goOffline()
}
const actionLabel = computed(() => !store.isOnline ? 'SWIPE TO GO ONLINE' : store.isTripActive ? 'SWIPE TO END TRIP' : 'SWIPE TO GO OFFLINE')
const actionClass = computed(() => store.isTripActive ? 'trip-action' : store.isOnline ? 'offline-action' : 'online-action')

onMounted(async () => {
  await store.initialize()
  startOdo.value = store.lastKnownOdometer ?? ''
  selectedOperator.value = store.defaultOperator
  interval = window.setInterval(() => { clock.value = Date.now() }, 1000)
})
onUnmounted(() => window.clearInterval(interval))
</script>

<template>
  <div class="cockpit">
    <header class="hero"><div><small>KFE WORK</small><h1>Driver Cockpit</h1></div><b :class="store.isOnline ? 'on' : 'off'">{{ store.isOnline ? 'ONLINE' : 'OFFLINE' }}</b></header>
    <div v-if="message" class="message">{{ message }}</div><div v-if="error" class="error">{{ error }}</div>

    <section class="card state"><div><span>Shift</span><strong>{{ store.isOnline ? 'Active' : 'Ready' }}</strong></div><div><span>Financial Day</span><strong>{{ store.isFinancialDayActive ? 'Active' : 'Not active' }}</strong></div></section>

    <section v-if="!store.isOnline" class="card gate">
      <h2>Start Shift</h2><p class="muted">Enter the current odometer. The Shift starts only after this gate succeeds.</p>
      <label>Current odometer (km)<input v-model="startOdo" type="number" min="0" inputmode="decimal"></label>
      <div v-if="gap.valid && gap.gapKm > 0" class="gap"><strong>Odometer gap: {{ gap.gapKm }} km</strong><p>Allocate the complete gap between Personal and Dead KM.</p><label>Personal KM<input v-model="gapPersonal" type="number" min="0" step="0.1"></label><label>Dead KM<input v-model="gapDead" type="number" min="0" step="0.1"></label><small>Allocated {{ allocatedGap }} / {{ gap.gapKm }} km</small></div>
      <p v-else-if="gap.valid" class="muted">No odometer gap.</p><p v-else-if="startOdo" class="error-text">{{ gap.reason }}</p>
    </section>

    <section v-else-if="!store.isTripActive" class="card gate">
      <h2>Start Trip</h2><div class="current-operator"><span>Operator for this trip</span><strong>{{ selectedOperator || store.defaultOperator }}</strong></div><p class="muted">Check this before every ride. The selected operator carries forward until changed.</p>
      <div class="operators"><button v-for="operator in store.operators" :key="operator" :class="{selected:(selectedOperator || store.defaultOperator)===operator}" @click="selectedOperator=operator">{{ operator }}</button></div>
      <button class="secondary" @click="startTrip">Start Trip now</button>
    </section>

    <section v-if="store.isTripActive" class="card trip">
      <small>TRIP ACTIVE</small><h2>{{ store.trip.operator }}</h2><div class="timer">{{ tripTimer }}</div><button class="quiet" @click="cancelTrip">Cancel accidental trip</button>
    </section>

    <section v-if="store.isOnline && !store.isTripActive" class="card gate">
      <h2>End Shift</h2><p class="muted">Closing odometer and revenue are required. ₹0 revenue and an unchanged odometer are allowed.</p>
      <label>Closing odometer (km)<input v-model="closingOdo" type="number" min="0" inputmode="decimal"></label>
      <label>Shift revenue (₹)<input v-model="shiftRevenue" type="number" min="0" inputmode="decimal" placeholder="0"></label>
      <div class="two"><label>Toll (optional)<input v-model="toll" type="number" min="0" step="0.01" placeholder="0"></label><label>Parking (optional)<input v-model="parking" type="number" min="0" step="0.01" placeholder="0"></label></div>
      <label v-if="Number(toll||0)>0 || Number(parking||0)>0">Toll/Parking treatment<select v-model="tollTreatment"><option value="NONE">None</option><option value="INCLUDED">Included in revenue</option><option value="EXCLUDED">Excluded from revenue</option></select></label>
      <button class="secondary" @click="reviewTrips=!reviewTrips">{{ reviewTrips ? 'Hide optional trip review' : 'Optional trip review / correction' }}</button>
      <div v-if="reviewTrips" class="reviews"><p v-if="!store.completedTrips.length" class="muted">No completed trips.</p><div v-for="t in store.completedTrips" :key="t.id" class="review"><select v-model="t.operator"><option v-for="operator in store.operators" :key="operator">{{ operator }}</option></select><input v-model="t.tripKm" type="number" min="0" step="0.1" placeholder="KM optional"><input v-model="t.revenue" type="number" min="0" step="0.01" placeholder="₹ optional"></div></div>
    </section>

    <div class="action-reserve"></div>
    <div class="persistent-action"><button :class="actionClass" @click="primaryAction">{{ actionLabel }}</button></div>
  </div>
</template>

<style scoped>
.cockpit{max-width:600px;margin:auto;padding:16px 16px 125px;color:#0f172a}.hero{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.hero small{font-size:.65rem;font-weight:900;color:#64748b;letter-spacing:.12em}.hero h1{margin:2px 0;font-size:1.45rem}.hero b{padding:7px 10px;border-radius:18px;font-size:.7rem}.on{background:#dcfce7;color:#166534}.off{background:#e2e8f0;color:#475569}.card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px;margin-bottom:14px;box-shadow:0 1px 2px rgba(15,23,42,.05)}.state{display:flex;justify-content:space-between}.state div{display:flex;flex-direction:column;gap:3px}.state span,.muted{font-size:.75rem;color:#64748b}.state strong{font-size:.9rem}.gate h2{margin:0 0 5px;font-size:1rem}.gate label{display:block;font-size:.76rem;font-weight:800;margin:11px 0}.gate input,.gate select,.review input,.review select{width:100%;box-sizing:border-box;padding:10px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;margin-top:5px;font:inherit}.secondary,.quiet{width:100%;padding:13px;border:0;border-radius:9px;font-weight:900;margin-top:12px}.secondary{background:#e2e8f0;color:#1e293b}.quiet{background:transparent;color:#64748b}.gap{background:#fff7ed;border:1px solid #fdba74;border-radius:10px;padding:12px}.gap p{font-size:.75rem;color:#92400e}.current-operator{display:flex;justify-content:space-between;padding:12px;background:#f1f5f9;border-radius:10px}.operators{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.operators button{padding:11px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;font-weight:800}.operators button.selected{border:2px solid #111827}.trip{text-align:center}.trip h2{margin:7px 0}.timer{font:700 2rem ui-monospace,SFMono-Regular,Menlo,monospace;margin:14px 0}.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.review{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:8px}.review input,.review select{font-size:.7rem;padding:8px}.message,.error{padding:10px 12px;border-radius:9px;margin-bottom:12px;font-size:.8rem}.message{background:#dcfce7;color:#166534}.error{background:#fee2e2;color:#991b1b}.error-text{color:#991b1b}.action-reserve{height:58px}.persistent-action{position:fixed;left:0;right:0;bottom:60px;height:58px;padding:7px 12px;box-sizing:border-box;background:rgba(248,250,252,.98);border-top:1px solid #e2e8f0;z-index:9998}.persistent-action button{width:100%;height:44px;border:0;border-radius:10px;color:#fff;font-weight:900;letter-spacing:.02em}.online-action{background:#111827}.offline-action{background:#dc2626}.trip-action{background:#dc2626}@media(max-width:380px){.two,.review{grid-template-columns:1fr}}
</style>
