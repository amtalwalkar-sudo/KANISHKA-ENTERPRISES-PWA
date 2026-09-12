<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useDayShiftTripStore } from '../stores/dayShiftTrip.js'
import { DayShiftTripRepository } from '../repositories/dayShiftTripRepository.js'
import { TripNotificationService } from '../services/tripNotificationService.js'
import { saveFuelLog } from '../utils/indexedDB.js'

const store = useDayShiftTripStore()
const startOdoInput = ref('')
const endOdoInput = ref('')
const shiftRevenueInput = ref('')
const missedStart = ref('')
const missedEnd = ref('')
const showFuelForm = ref(false)
const fuelOdometer = ref('')
const pricePerKg = ref('')
const amountPaid = ref('')
const personalGapInput = ref('')
const deadGapInput = ref('')
const unclassifiedGapInput = ref('')
const showUberReconciliation = ref(false)
const uberEntries = ref([])
const showMovementSummary = ref(false)
const pendingEndOdo = ref('')
const pendingShiftRevenue = ref('')
const pendingGarageLocation = ref(null)
const endingShift = ref(false)
const showDurationInput = ref(false)
const tripDurationInput = ref('')
const MAX_CNG_KG = 15

const calculatedKg = computed(() => {
  const p = Number(pricePerKg.value)
  const a = Number(amountPaid.value)
  return p > 0 && a > 0 ? (a / p).toFixed(2) : '0.00'
})

const gapAllocatedTotal = computed(() =>
  Number(personalGapInput.value || 0) +
  Number(deadGapInput.value || 0) +
  Number(unclassifiedGapInput.value || 0)
)

const shiftLabel = computed(() => store.isShiftActive ? 'SHIFT ACTIVE' : 'SHIFT OFF')
const tripLabel = computed(() => store.isTripActive ? 'TRIP IN PROGRESS' : 'TRIP READY')

const locationLabel = location => {
  if (!location) return null
  if (typeof location === 'string') return location
  return location.name || location.label || location.address || location.formattedAddress || location.displayName || null
}

const locationOrCoordinates = location => {
  const name = locationLabel(location)
  if (name) return name
  if (location && Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude))) {
    return `${Number(location.latitude).toFixed(5)}, ${Number(location.longitude).toFixed(5)}`
  }
  return 'Location unavailable'
}

const tripRouteLabel = entry => `${locationOrCoordinates(entry.tripStartLocation)} → ${locationOrCoordinates(entry.tripEndLocation)}`

const load = async () => {
  await store.initialize()
  if (store.shift?.startOdometer != null) {
    startOdoInput.value = store.shift.startOdometer
    return
  }
  const lastShift = await DayShiftTripRepository.getLastCompletedShift()
  if (lastShift?.endOdometer != null) startOdoInput.value = lastShift.endOdometer
}

const handleStartDay = async () => {
  if (await store.startDay()) alert('Day started.')
}

const handleEndDay = async () => {
  if (await store.endDay()) alert('Day ended.')
}

const handleDurationRequest = () => {
  tripDurationInput.value = ''
  showDurationInput.value = true
}

const confirmDuration = async () => {
  if (await TripNotificationService.setDuration(tripDurationInput.value)) {
    showDurationInput.value = false
  } else {
    alert('Enter Trip duration as HH:MM.')
  }
}

const handleStartShift = async () => {
  if (await store.startShift(startOdoInput.value)) startOdoInput.value = ''
}

const handleAllocateGap = async () => {
  if (!store.interShiftGap) return
  const ok = await store.allocateInterShiftGap({
    personalKm: personalGapInput.value,
    deadKm: deadGapInput.value,
    unclassifiedKm: unclassifiedGapInput.value
  })
  if (ok) {
    personalGapInput.value = ''
    deadGapInput.value = ''
    unclassifiedGapInput.value = ''
    alert('Inter-shift KM allocation saved.')
  }
}

const handleEndShift = async () => {
  if (!endOdoInput.value || shiftRevenueInput.value === '') {
    alert('Enter End Odometer and Shift Revenue.')
    return
  }
  const location = await store.captureShiftEndLocation()
  pendingEndOdo.value = endOdoInput.value
  pendingShiftRevenue.value = shiftRevenueInput.value
  pendingGarageLocation.value = location
  await store.openUberReconciliation()
  uberEntries.value = store.reconciliationTrips.map(t => ({
    id: t.id,
    tripStartAt: t.tripStartAt,
    tripEndAt: t.tripEndAt,
    tripStartLocation: t.tripStartLocation,
    tripEndLocation: t.tripEndLocation,
    uberBusinessKm: t.uberBusinessKm ?? '',
    uberRevenue: t.uberRevenue ?? ''
  }))
  showUberReconciliation.value = true
}

const finishShift = async () => {
  endingShift.value = true
  try {
    if (uberEntries.value.length && await store.saveUberReconciliation(uberEntries.value) === false) return
    const ok = await store.endShift(pendingEndOdo.value, pendingShiftRevenue.value, pendingGarageLocation.value)
    if (ok) {
      showUberReconciliation.value = false
      pendingEndOdo.value = ''
      pendingShiftRevenue.value = ''
      pendingGarageLocation.value = null
      showMovementSummary.value = true
      alert('Shift ended and movement reconciliation saved.')
    }
  } finally {
    endingShift.value = false
  }
}

const cancelShiftEnd = () => {
  showUberReconciliation.value = false
  pendingEndOdo.value = ''
  pendingShiftRevenue.value = ''
  pendingGarageLocation.value = null
}

const handleStartTrip = async () => {
  if (await store.startTrip()) alert('Trip started.')
}

const handleEndTrip = async () => {
  if (await store.endTrip()) alert('Trip completed.')
}

const handleMissed = async () => {
  if (await store.recordMissedTrip(missedStart.value, missedEnd.value)) {
    missedStart.value = ''
    missedEnd.value = ''
    alert('Missed Trip recorded.')
  }
}

const handleSaveFuel = async () => {
  const odo = Number(fuelOdometer.value)
  const amount = Number(amountPaid.value)
  const kg = Number(calculatedKg.value)
  if (!odo || !amount) {
    alert('Enter odometer and amount.')
    return
  }
  if (kg > MAX_CNG_KG) {
    alert(`Calculated quantity exceeds ${MAX_CNG_KG} kg.`)
    return
  }
  try {
    await saveFuelLog({ odometer: odo, pricePerKg: Number(pricePerKg.value) || 0, amount, kg })
    showFuelForm.value = false
    fuelOdometer.value = ''
    pricePerKg.value = ''
    amountPaid.value = ''
    alert('CNG Fuel Log saved.')
  } catch (e) {
    console.error(e)
    alert('Error saving CNG fuel log.')
  }
}

onMounted(() => {
  load()
  window.addEventListener('kfe:trip-duration-input', handleDurationRequest)
})

onUnmounted(() => window.removeEventListener('kfe:trip-duration-input', handleDurationRequest))
</script>

<template>
  <div class="work-page">
    <header class="work-header">
      <div>
        <h1>Work</h1>
        <p>Drive workflow</p>
      </div>
      <div class="context-badges" aria-label="Current workflow state">
        <span class="context-badge" :class="{ active: store.isDayOnline }">DAY {{ store.isDayOnline ? 'ACTIVE' : 'OFF' }}</span>
        <span class="context-badge" :class="{ active: store.isShiftActive }">{{ shiftLabel }}</span>
        <span v-if="store.isShiftActive" class="context-badge" :class="{ active: store.isTripActive }">{{ tripLabel }}</span>
      </div>
    </header>

    <section class="day-card">
      <div class="card-heading">
        <div>
          <span class="eyebrow">DAY</span>
          <strong>{{ store.isDayOnline ? 'Active' : 'Offline' }}</strong>
        </div>
        <span class="state-dot" :class="{ active: store.isDayOnline }"></span>
      </div>
      <div v-if="!store.isDayOnline" class="day-off-state">
        <p>Start your work day before starting a Shift.</p>
        <button class="primary-action" @click="handleStartDay">▶ START DAY</button>
      </div>
      <div v-else class="day-on-state">
        <div class="supporting-text">
          Started {{ store.day?.dayStartAt ? new Date(store.day.dayStartAt).toLocaleString() : '' }}
        </div>
        <button class="secondary-danger" @click="handleEndDay" :disabled="store.isShiftActive || store.isTripActive">
          ■ END DAY
        </button>
        <small v-if="store.isShiftActive || store.isTripActive">End the active Trip/Shift first.</small>
      </div>
    </section>

    <section class="shift-card">
      <div class="shift-toggle-head">
        <div>
          <span class="eyebrow">SHIFT</span>
          <strong>{{ store.isShiftActive ? 'ACTIVE' : 'OFF' }}</strong>
        </div>
        <button
          class="shift-toggle"
          :class="{ active: store.isShiftActive }"
          :disabled="!store.isDayOnline || (store.isShiftActive && store.isTripActive)"
          @click="store.isShiftActive ? handleEndShift() : handleStartShift()"
          :aria-label="store.isShiftActive ? 'End Shift' : 'Start Shift'"
        >
          <span class="toggle-knob"></span>
          <span>{{ store.isShiftActive ? 'END SHIFT' : 'START SHIFT' }}</span>
        </button>
      </div>

      <div v-if="!store.isShiftActive" class="shift-start-fields">
        <label>Start Odometer (km)</label>
        <input v-model="startOdoInput" type="number" inputmode="decimal" :disabled="!store.isDayOnline" placeholder="Enter start odometer" />
        <p>Shift starts from this odometer reading.</p>
      </div>

      <div v-else class="shift-active-fields">
        <div class="metric-strip">
          <span>Start Odometer</span>
          <strong>{{ store.shift.startOdometer }} km</strong>
        </div>
        <div class="shift-end-fields">
          <div>
            <label>End Odometer (km)</label>
            <input v-model="endOdoInput" type="number" inputmode="decimal" :disabled="store.isTripActive" placeholder="Enter end odometer" />
          </div>
          <div>
            <label>Shift Revenue (₹)</label>
            <input v-model="shiftRevenueInput" type="number" inputmode="decimal" :disabled="store.isTripActive" placeholder="Enter revenue" />
          </div>
        </div>
        <small v-if="store.isTripActive" class="state-note">End the active Trip before ending the Shift.</small>
      </div>
    </section>

    <section v-if="store.interShiftGap" class="gap-card">
      <div class="card-heading">
        <div>
          <span class="eyebrow">BETWEEN SHIFTS</span>
          <strong>KM allocation</strong>
        </div>
      </div>
      <p>{{ store.interShiftGap.previousShiftEndOdometer }} km → {{ store.interShiftGap.currentShiftStartOdometer }} km · <strong>{{ store.interShiftGap.gapKm }} km</strong></p>
      <div class="field-grid">
        <div><label>Personal KM</label><input v-model="personalGapInput" type="number" min="0" step=".1" placeholder="0" /></div>
        <div><label>Dead KM</label><input v-model="deadGapInput" type="number" min="0" step=".1" placeholder="0" /></div>
        <div><label>Unclassified KM</label><input v-model="unclassifiedGapInput" type="number" min="0" step=".1" placeholder="0" /></div>
      </div>
      <div class="allocation-total">Allocated: <strong>{{ gapAllocatedTotal }} km</strong> / {{ store.interShiftGap.gapKm }} km</div>
      <button class="secondary-action" @click="handleAllocateGap">CONFIRM ALLOCATION</button>
    </section>

    <section v-if="store.isShiftActive" class="work-info-card">
      <div class="info-row"><span>Trip status</span><strong>{{ store.isTripActive ? 'In progress' : 'Ready' }}</strong></div>
      <div v-if="store.isTripActive" class="info-row"><span>Trip started</span><strong>{{ new Date(store.trip.tripStartAt).toLocaleTimeString() }}</strong></div>
      <div v-if="store.isTripActive" class="info-row"><span>GPS</span><strong>● Tracking</strong></div>
      <div v-if="store.isTripActive" class="trip-live-note">Keep the trip action below in view. Ending the Trip is always available in the same place.</div>
      <div v-else class="trip-live-note">Start a Trip when you are ready. Trip reconciliation is handled during Shift ending.</div>
      <details class="secondary-details">
        <summary>Record Missed Trip</summary>
        <div class="details-body">
          <label>Actual start</label>
          <input v-model="missedStart" type="datetime-local" />
          <label>Actual end</label>
          <input v-model="missedEnd" type="datetime-local" />
          <button class="secondary-action" @click="handleMissed">SAVE MISSED TRIP</button>
        </div>
      </details>
    </section>

    <section class="utility-card">
      <button class="utility-action" @click="showFuelForm = true">⛽ LOG CNG REFUELING</button>
    </section>

    <div v-if="store.isShiftActive" class="trip-action-dock">
      <div class="trip-action-state">
        <span class="eyebrow">{{ store.isTripActive ? 'TRIP IN PROGRESS' : 'TRIP READY' }}</span>
        <span v-if="store.isTripActive" class="trip-elapsed">Started {{ new Date(store.trip.tripStartAt).toLocaleTimeString() }}</span>
      </div>
      <button class="trip-primary-action" :class="{ ending: store.isTripActive }" @click="store.isTripActive ? handleEndTrip() : handleStartTrip()">
        {{ store.isTripActive ? '■ END TRIP' : '▶ START TRIP' }}
      </button>
    </div>

    <div v-if="showUberReconciliation" class="full-screen-modal">
      <div class="modal-inner">
        <div class="modal-header"><div><strong>End Shift — Reconciliation</strong><div class="supporting-text">End Odometer: {{ pendingEndOdo }} km · Revenue: ₹{{ pendingShiftRevenue }}</div></div><button @click="cancelShiftEnd" :disabled="endingShift">Cancel</button></div>
        <div class="notice">Final GPS location is optional. If unavailable, odometer remains authoritative and movement reconciliation uses the available trace.</div>
        <div v-if="!uberEntries.length" class="empty-state">No completed trips in this Shift. Odometer reconciliation will still complete.</div>
        <div v-for="entry in uberEntries" :key="entry.id" class="reconciliation-entry">
          <strong>{{ tripRouteLabel(entry) }}</strong>
          <span> · {{ new Date(entry.tripStartAt).toLocaleString() }}</span>
          <label>Actual Trip KM (optional)</label>
          <input v-model="entry.uberBusinessKm" type="number" min="0" step=".1" placeholder="Leave blank to keep GPS estimate" />
          <label>Revenue ₹ (optional)</label>
          <input v-model="entry.uberRevenue" type="number" min="0" step=".01" placeholder="Leave blank to keep existing estimate" />
        </div>
        <button class="danger-action" @click="finishShift" :disabled="endingShift">{{ endingShift ? 'RECONCILING…' : 'SAVE RECONCILIATION & END SHIFT' }}</button>
      </div>
    </div>

    <div v-if="showMovementSummary" class="overlay-modal">
      <div class="summary-modal">
        <div class="modal-header"><strong>Shift Reconciliation Complete</strong><button @click="showMovementSummary = false">Close</button></div>
        <div v-if="store.movementReconciliation" class="summary-list">
          <div>Total Shift Vehicle KM <strong>{{ Number(store.movementReconciliation.totalShiftVehicleKm).toFixed(1) }} km</strong></div>
          <div>Business KM <strong>{{ Number(store.movementReconciliation.businessMilesKm).toFixed(1) }} km</strong></div>
          <div>Dead KM <strong>{{ Number(store.movementReconciliation.deadMilesKm).toFixed(1) }} km</strong></div>
          <div>Unclassified KM <strong>{{ Number(store.movementReconciliation.unclassifiedKm).toFixed(1) }} km</strong></div>
          <small>Reconciliation status: {{ store.movementReconciliation.reconciliationStatus }} · GPS trace points: {{ store.movementReconciliation.gpsTracePoints ?? 0 }}</small>
        </div>
      </div>
    </div>

    <div v-if="showDurationInput" class="center-modal">
      <div class="small-modal">
        <strong>Trip Duration</strong>
        <p>Enter duration as HH:MM. This sets expected end only; it never ends the Trip automatically.</p>
        <input v-model="tripDurationInput" inputmode="numeric" placeholder="HH:MM" />
        <div class="modal-actions"><button @click="showDurationInput = false">Cancel</button><button class="secondary-action" @click="confirmDuration">DONE</button></div>
      </div>
    </div>

    <div v-if="showFuelForm" class="full-screen-modal fuel-modal">
      <div class="modal-inner">
        <div class="modal-header"><strong>CNG Refueling</strong><button @click="showFuelForm = false">Back</button></div>
        <label>Odometer</label><input v-model="fuelOdometer" type="number" inputmode="decimal" placeholder="Odometer" />
        <label>Price per kg</label><input v-model="pricePerKg" type="number" inputmode="decimal" step=".01" placeholder="Price per kg" />
        <label>Amount paid</label><input v-model="amountPaid" type="number" inputmode="decimal" placeholder="Amount paid" />
        <div class="calculated">Calculated: <strong>{{ calculatedKg }} kg</strong></div>
        <button class="primary-action" @click="handleSaveFuel">SAVE REFUELING</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.work-page {
  min-height: 100vh;
  box-sizing: border-box;
  padding: 14px 14px calc(170px + env(safe-area-inset-bottom));
  max-width: 640px;
  margin: 0 auto;
  color: #0f172a;
}

.work-header { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; margin-bottom:14px; }
.work-header h1 { margin:0; font-size:1.35rem; font-weight:800; }
.work-header p { margin:3px 0 0; color:#64748b; font-size:.82rem; }
.context-badges { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:5px; max-width:260px; }
.context-badge { border:1px solid #cbd5e1; border-radius:999px; padding:4px 7px; font-size:.62rem; font-weight:800; color:#64748b; background:#f8fafc; }
.context-badge.active { color:#047857; border-color:#a7f3d0; background:#ecfdf5; }

.day-card,.shift-card,.gap-card,.work-info-card,.utility-card { background:#fff; border:1px solid #dbe2ea; border-radius:16px; padding:16px; margin-bottom:12px; box-shadow:0 2px 8px rgba(15,23,42,.04); }
.card-heading,.shift-toggle-head { display:flex; justify-content:space-between; align-items:center; gap:12px; }
.card-heading strong,.shift-toggle-head strong { display:block; font-size:1rem; }
.eyebrow { display:block; font-size:.68rem; font-weight:900; letter-spacing:.08em; color:#64748b; }
.state-dot { width:10px; height:10px; border-radius:50%; background:#94a3b8; }
.state-dot.active { background:#10b981; box-shadow:0 0 0 4px #d1fae5; }
.supporting-text { color:#64748b; font-size:.78rem; }
.day-off-state,.day-on-state { margin-top:14px; }
.day-off-state p { color:#64748b; font-size:.82rem; margin:0 0 12px; }
.day-on-state { display:flex; flex-direction:column; gap:8px; }
.day-on-state small,.state-note { color:#b45309; font-size:.72rem; }

.primary-action,.secondary-action,.secondary-danger,.danger-action,.utility-action { width:100%; min-height:48px; border:0; border-radius:12px; font-weight:900; font-size:.84rem; cursor:pointer; }
.primary-action { background:#16a34a; color:#fff; }
.secondary-action { background:#2563eb; color:#fff; }
.secondary-danger { background:#fff1f2; color:#be123c; border:1px solid #fecdd3; }
.danger-action { background:#dc2626; color:#fff; }
.utility-action { background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; }
button:disabled { opacity:.45; cursor:not-allowed; }

.shift-card { padding:14px; }
.shift-toggle-head { padding-bottom:14px; border-bottom:1px solid #e2e8f0; }
.shift-toggle { min-width:132px; min-height:50px; padding:7px 12px 7px 7px; border:1px solid #cbd5e1; border-radius:999px; background:#f1f5f9; color:#475569; display:flex; align-items:center; justify-content:center; gap:7px; font-size:.72rem; font-weight:900; }
.shift-toggle.active { background:#ecfdf5; color:#047857; border-color:#86efac; }
.toggle-knob { width:30px; height:30px; border-radius:50%; background:#94a3b8; box-shadow:0 1px 3px rgba(15,23,42,.2); }
.shift-toggle.active .toggle-knob { background:#10b981; }
.shift-start-fields,.shift-active-fields { padding-top:14px; }
.shift-start-fields p { margin:7px 0 0; color:#64748b; font-size:.72rem; }
label { display:block; margin:0 0 5px; font-size:.74rem; font-weight:800; color:#334155; }
input { width:100%; box-sizing:border-box; min-height:44px; padding:10px 11px; border:1px solid #cbd5e1; border-radius:10px; background:#fff; color:#0f172a; font:inherit; }
input:focus { outline:2px solid #93c5fd; outline-offset:1px; }
.metric-strip { display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:#f8fafc; border-radius:10px; font-size:.8rem; margin-bottom:12px; }
.shift-end-fields,.field-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.field-grid > div:last-child { grid-column:1/-1; }

.gap-card { background:#fffaf0; border-color:#fed7aa; }
.gap-card p { margin:8px 0 12px; font-size:.8rem; color:#475569; }
.allocation-total { margin:10px 0; font-size:.78rem; color:#475569; }

.work-info-card { display:grid; gap:8px; }
.info-row { display:flex; justify-content:space-between; gap:12px; font-size:.8rem; }
.info-row strong { color:#047857; }
.trip-live-note { padding:10px; border-radius:10px; background:#f8fafc; color:#64748b; font-size:.73rem; line-height:1.4; }
.secondary-details { margin-top:4px; border-top:1px solid #e2e8f0; padding-top:10px; }
.secondary-details summary { cursor:pointer; font-size:.78rem; font-weight:800; }
.details-body { display:grid; gap:7px; padding-top:10px; }

.trip-action-dock { position:fixed; z-index:900; left:50%; transform:translateX(-50%); bottom:calc(60px + env(safe-area-inset-bottom)); width:min(640px, calc(100% - 20px)); padding:9px; border:1px solid #cbd5e1; border-radius:16px; background:rgba(255,255,255,.96); box-shadow:0 8px 30px rgba(15,23,42,.16); backdrop-filter:blur(10px); }
.trip-action-state { display:flex; justify-content:space-between; align-items:center; padding:2px 5px 7px; }
.trip-elapsed { color:#64748b; font-size:.7rem; }
.trip-primary-action { width:100%; min-height:56px; border:0; border-radius:13px; background:#2563eb; color:#fff; font-size:1rem; font-weight:900; letter-spacing:.01em; }
.trip-primary-action.ending { background:#dc2626; }

.full-screen-modal { position:fixed; inset:0; z-index:10000; background:#f8fafc; padding:16px; overflow:auto; }
.modal-inner { width:min(600px,100%); margin:0 auto; display:grid; gap:10px; padding-bottom:24px; }
.modal-header { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:4px; }
.modal-header button { border:0; background:transparent; color:#2563eb; font-weight:800; padding:8px; }
.notice { background:#fff7ed; border:1px solid #fdba74; border-radius:10px; padding:12px; font-size:.78rem; color:#7c2d12; }
.empty-state { background:#fff; border-radius:10px; padding:14px; color:#64748b; font-size:.8rem; }
.reconciliation-entry { background:#fff; border:1px solid #cbd5e1; border-radius:12px; padding:12px; display:grid; gap:7px; font-size:.8rem; }
.reconciliation-entry > span { color:#64748b; }
.fuel-modal .modal-inner { padding-bottom:40px; }
.calculated { padding:12px; border-radius:10px; background:#ecfdf5; color:#047857; font-size:.85rem; }
.overlay-modal,.center-modal { position:fixed; inset:0; z-index:11000; padding:16px; background:rgba(15,23,42,.48); display:flex; align-items:center; justify-content:center; overflow:auto; }
.summary-modal,.small-modal { width:min(600px,100%); background:#fff; border-radius:16px; padding:18px; box-shadow:0 20px 60px rgba(15,23,42,.25); }
.small-modal { width:min(360px,100%); }
.small-modal p { color:#64748b; font-size:.78rem; line-height:1.4; }
.modal-actions { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:10px; }
.modal-actions button { min-height:44px; border:0; border-radius:10px; font-weight:800; }
.summary-list { display:grid; gap:8px; }
.summary-list > div { display:flex; justify-content:space-between; gap:12px; padding:11px; border-radius:9px; background:#f8fafc; font-size:.82rem; }
.summary-list small { color:#64748b; font-size:.7rem; }

@media (max-width:480px) {
  .work-header { display:block; }
  .context-badges { justify-content:flex-start; max-width:none; margin-top:9px; }
  .shift-toggle-head { align-items:flex-start; }
  .shift-toggle { min-width:126px; }
  .shift-end-fields,.field-grid { grid-template-columns:1fr; }
  .field-grid > div:last-child { grid-column:auto; }
}
</style>
