<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { application, actions } from '../presentation/application/presentation-runtime.js'
import { createUiCommand } from '../../js/application/ui-contract.js'
import WorkBreakControl from './WorkBreakControl.vue'
import WorkSessionActions from './WorkSessionActions.vue'
import WorkSessionForm from './WorkSessionForm.vue'
import WorkSessionOverlays from './WorkSessionOverlays.vue'
import { clearFormDraft, hasFormDraft } from '../../js/ui/form-drafts.js'
import './work-session.css'

const loading = ref(true)
const busy = ref(false)
const error = ref('')
const notice = ref('')
const model = ref(null)
const workSummary = ref(null)
const form = ref(null)
const endDayConfirm = ref(false)
const now = ref(Date.now())
const theme = ref('DAY')

const dayStartOdometer = ref('')
const dayBusinessKm = ref('')
const dayPersonalKm = ref('')
const personalStartOdometer = ref('')
const personalBusinessKm = ref('')
const personalPersonalKm = ref('')
const personalEndOdometer = ref('')
const personalToll = ref('')
const personalParking = ref('')
const shiftRevenue = ref('')
const shiftEndOdometer = ref('')
const shiftToll = ref('')
const shiftParking = ref('')
const shiftTollNotIncluded = ref(false)
const shiftParkingNotIncluded = ref(false)
const ocrReviewOpen = ref(false)

let timer
const screenState = computed(() => model.value?.state || 'DAY_START')
const latestOdometer = computed(() => model.value?.latestOdometer)
const dayStatus = computed(() => model.value?.day?.status || 'NOT_STARTED')
const activeShift = computed(() => model.value?.shift?.active ? model.value.shift : null)
const activeTrip = computed(() => model.value?.trip?.active ? model.value.trip : null)
const shiftElapsed = computed(() => activeShift.value?.startedAt ? Math.max(0, Math.floor((now.value - Date.parse(activeShift.value.startedAt)) / 1000)) : 0)
const tripElapsed = computed(() => activeTrip.value?.startedAt ? Math.max(0, Math.floor((now.value - Date.parse(activeTrip.value.startedAt)) / 1000)) : 0)
const shiftTripCount = computed(() => activeShift.value?.tripCount || 0)
const unreviewedOcrRides = computed(() => Array.isArray(model.value?.unreviewedOcrRides) ? model.value.unreviewedOcrRides : [])
const unreviewedOcrRideCount = computed(() => unreviewedOcrRides.value.length)
const dayEnded = computed(() => screenState.value === 'DAY_ENDED')
const shiftSummaryCards = computed(() => [
  { label: 'Kms run', value: workSummary.value?.kmsRun == null ? '—' : `${workSummary.value.kmsRun} km` },
  { label: 'Dead kms', value: workSummary.value?.deadKms == null ? '—' : `${workSummary.value.deadKms} km` },
  { label: 'Revenue', value: workSummary.value?.revenuePaise == null ? '—' : `₹${(Number(workSummary.value.revenuePaise) / 100).toFixed(2)}` },
  { label: 'Target', value: workSummary.value?.targetPaise == null ? '—' : `₹${(Number(workSummary.value.targetPaise) / 100).toFixed(2)}` },
])

function duration(seconds) {
  const value = Math.max(0, Number(seconds) || 0)
  return [Math.floor(value / 3600), Math.floor(value / 60) % 60, value % 60].map(v => String(v).padStart(2, '0')).join(':')
}
function odometerDifference(current, previous) {
  const value = Number(current)
  const prior = previous == null ? null : Number(previous)
  if (!Number.isInteger(value) || value < 0) return { valid: false, difference: 0, required: false }
  if (prior == null) return { valid: true, difference: 0, required: false }
  if (value < prior) return { valid: false, difference: prior - value, required: false }
  return { valid: true, difference: value - prior, required: value !== prior }
}
function allocationValid(diff, business, personal) {
  if (!diff.valid) return false
  if (!diff.required) return true
  const b = Number(business)
  const p = Number(personal)
  return Number.isInteger(b) && Number.isInteger(p) && b >= 0 && p >= 0 && b + p === diff.difference
}
const dayDiff = computed(() => odometerDifference(dayStartOdometer.value, latestOdometer.value))
const personalDiff = computed(() => odometerDifference(personalStartOdometer.value, latestOdometer.value))
const dayAllocationValid = computed(() => allocationValid(dayDiff.value, dayBusinessKm.value, dayPersonalKm.value))
const personalAllocationValid = computed(() => allocationValid(personalDiff.value, personalBusinessKm.value, personalPersonalKm.value))
const shiftEndValid = computed(() => {
  const n = Number(shiftEndOdometer.value)
  return Number.isInteger(n) && n >= 0 && (!activeShift.value?.startOdometer || n >= Number(activeShift.value.startOdometer))
})
const personalEndValid = computed(() => {
  const n = Number(personalEndOdometer.value)
  return Number.isInteger(n) && n >= 0 && (!activeTrip.value?.startOdometer || n >= Number(activeTrip.value.startOdometer))
})
const shiftRevenueValid = computed(() => String(shiftRevenue.value).trim() !== '' && Number.isFinite(Number(shiftRevenue.value)) && Number(shiftRevenue.value) >= 0)
const canEndDay = computed(() => screenState.value === 'DAY_READY' && !activeShift.value && !activeTrip.value && dayStatus.value !== 'COMPLETED')
const activeStateThemeClass = computed(() => {
  if (form.value === 'SHIFT_END') return 'state-close'
  if (form.value === 'PERSONAL_START' || form.value === 'PERSONAL_END' || screenState.value === 'PERSONAL_TRIP') return 'state-personal'
  if (screenState.value === 'SHIFT_WAITING' || screenState.value === 'BUSINESS_TRIP') return 'state-business'
  return 'state-standby'
})
function publishDriverState() { window.dispatchEvent(new CustomEvent('kfe:driver-state', { detail: { state: screenState.value } })) }
function cycleTheme() { if (theme.value === 'DAY') theme.value = 'DUSK'; else if (theme.value === 'DUSK') theme.value = 'NIGHT'; else theme.value = 'DAY' }
function openForm(kind) {
  error.value = ''
  notice.value = ''
  form.value = kind
  ocrReviewOpen.value = false
  if (kind === 'DAY_START') dayStartOdometer.value = latestOdometer.value == null ? '' : String(latestOdometer.value)
  if (kind === 'PERSONAL_START') personalStartOdometer.value = latestOdometer.value == null ? '' : String(latestOdometer.value)
  if (kind === 'PERSONAL_END') personalEndOdometer.value = ''
  if (kind === 'SHIFT_END') {
    shiftRevenue.value = ''
    shiftEndOdometer.value = ''
    shiftToll.value = ''
    shiftParking.value = ''
    shiftTollNotIncluded.value = false
    shiftParkingNotIncluded.value = false
  }
}
function closeForm() {
  if (busy.value) return
  ocrReviewOpen.value = false
  const root = document.querySelector('.work-form-card')
  if (root && hasFormDraft(root)) {
    const ok = globalThis.confirm?.('Discard this unsaved draft?')
    if (ok === false) return
    clearFormDraft(root)
  }
  form.value = null
  error.value = ''
}
async function load() {
  loading.value = true
  try {
    model.value = await application.getWorkScreenState()
    workSummary.value = model.value?.state === 'DAY_ENDED' ? await application.getWorkSummary() : null
    publishDriverState()
  } catch (e) { error.value = String(e?.message || e) }
  finally { loading.value = false }
}
async function dispatch(type, payload = {}) {
  if (busy.value) return null
  busy.value = true
  error.value = ''
  try {
    const result = await actions.dispatch(createUiCommand(type, payload))
    const root = document.querySelector('.work-form-card')
    if (root) clearFormDraft(root)
    form.value = null
    ocrReviewOpen.value = false
    endDayConfirm.value = false
    await load()
    return result
  } catch (e) { error.value = String(e?.message || e); return null }
  finally { busy.value = false }
}
async function confirmDayStart() {
  const odometer = Number(dayStartOdometer.value)
  if (!Number.isInteger(odometer) || odometer < 0) return (error.value = 'Enter the day-start odometer.')
  if (!dayDiff.value.valid) return (error.value = 'Odometer cannot decrease.')
  if (!dayAllocationValid.value) return (error.value = `Allocate exactly ${dayDiff.value.difference} km between business and personal.`)
  await dispatch('START_DAY', { odometer, prefilledOdometer: latestOdometer.value, businessKm: dayDiff.value.required ? Number(dayBusinessKm.value) : 0, personalKm: dayDiff.value.required ? Number(dayPersonalKm.value) : 0, actionMode: 'SWIPE', direction: 'RIGHT' })
}
async function confirmPersonalStart() {
  const odometer = Number(personalStartOdometer.value)
  if (!Number.isInteger(odometer) || odometer < 0) return (error.value = 'Enter the personal-trip start odometer.')
  if (!personalDiff.value.valid) return (error.value = 'Odometer cannot decrease.')
  if (!personalAllocationValid.value) return (error.value = `Allocate exactly ${personalDiff.value.difference} km between business and personal.`)
  await dispatch('START_PERSONAL_TRIP', { odometer, prefilledOdometer: latestOdometer.value, businessKm: personalDiff.value.required ? Number(personalBusinessKm.value) : 0, personalKm: personalDiff.value.required ? Number(personalPersonalKm.value) : 0, actionMode: 'SWIPE', direction: 'LEFT' })
}
async function confirmPersonalEnd() {
  const odometer = Number(personalEndOdometer.value)
  if (!Number.isInteger(odometer) || odometer < 0) return (error.value = 'End odometer is compulsory.')
  if (!personalEndValid.value) return (error.value = 'End odometer cannot be below the trip start odometer.')
  await dispatch('END_PERSONAL_TRIP', { id: activeTrip.value?.id, endOdometer: odometer, tollPaise: Math.round(Math.max(0, Number(personalToll.value) || 0) * 100), parkingPaise: Math.round(Math.max(0, Number(personalParking.value) || 0) * 100), actionMode: 'SWIPE', direction: 'RIGHT' })
}
async function confirmShiftEnd() {
  if (!shiftRevenueValid.value) return (error.value = 'Revenue is compulsory to close the business shift.')
  const odometer = Number(shiftEndOdometer.value)
  if (!Number.isInteger(odometer) || odometer < 0) return (error.value = 'End odometer is compulsory.')
  if (!shiftEndValid.value) return (error.value = 'End odometer cannot be below the shift start odometer.')
  await dispatch('END_SHIFT', { id: activeShift.value?.id, endOdometer: odometer, revenuePaise: Math.round(Number(shiftRevenue.value) * 100), tollPaise: Math.round(Math.max(0, Number(shiftToll.value) || 0) * 100), parkingPaise: Math.round(Math.max(0, Number(shiftParking.value) || 0) * 100), tollIncludedInFare: !shiftTollNotIncluded.value, parkingIncludedInFare: !shiftParkingNotIncluded.value, actionMode: 'SWIPE', direction: 'LEFT' })
}
function handleSwipe(action) {
  if (action === 'START_DAY') return openForm('DAY_START')
  if (action === 'START_PERSONAL_TRIP') return openForm('PERSONAL_START')
  if (action === 'START_SHIFT') return dispatch('START_SHIFT', { actionMode: 'SWIPE', direction: 'RIGHT' })
  if (action === 'START_TRIP') return dispatch('START_TRIP', { actionMode: 'SWIPE', direction: 'RIGHT' })
  if (action === 'END_TRIP') return dispatch('END_TRIP', { id: activeTrip.value?.id, actionMode: 'SWIPE', direction: 'RIGHT' })
  if (action === 'END_PERSONAL_TRIP') return openForm('PERSONAL_END')
  if (action === 'END_SHIFT') return openForm('SHIFT_END')
  if (action === 'START_DAY_CONFIRM') return confirmDayStart()
  if (action === 'START_PERSONAL_TRIP_CONFIRM') return confirmPersonalStart()
  if (action === 'CLOSE_PERSONAL_TRIP') return confirmPersonalEnd()
  if (action === 'CLOSE_SHIFT') return confirmShiftEnd()
}
function openOcrReview() { if (unreviewedOcrRideCount.value > 0) ocrReviewOpen.value = true }
function requestEndDay() { if (canEndDay.value) endDayConfirm.value = true }
async function confirmEndDay() { if (canEndDay.value) await dispatch('END_DAY', { actionMode: 'BUTTON' }) }
function onKey(event) {
  if (event.key === 'Escape') {
    if (ocrReviewOpen.value) ocrReviewOpen.value = false
    else if (endDayConfirm.value) endDayConfirm.value = false
    else if (form.value) closeForm()
  }
}
onMounted(() => { timer = setInterval(() => { now.value = Date.now() }, 1000); window.addEventListener('keydown', onKey); load() })
onUnmounted(() => { clearInterval(timer); window.removeEventListener('keydown', onKey) })
</script>

<template>
  <section class="kfe-work-session" :class="[activeStateThemeClass, `theme-${theme.toLowerCase()}`]" aria-labelledby="work-title">
    <div v-if="loading" class="work-loading" role="status">Loading Work…</div>
    <template v-else>
      <header class="work-header">
        <div><p class="kfe-eyebrow">Operational cockpit</p><h1 id="work-title">Work</h1><p>Today · <span class="state-badge">{{ screenState.replaceAll('_', ' ') }}</span></p></div>
        <div class="work-header-status"><button type="button" class="theme-toggle-btn" @click="cycleTheme" aria-label="Toggle Night Mode Theme">[{{ theme }}]</button><span class="work-shift-mini">SHIFT {{ activeShift ? duration(shiftElapsed) : '—' }}</span></div>
      </header>
      <div v-if="error" class="work-error" role="alert">{{ error }}</div>
      <div v-if="notice" class="work-notice" role="status">✓ {{ notice }}</div>
      <main class="work-main">
        <section v-if="screenState === 'DAY_START'" class="work-state-panel day-start-panel start-of-day-panel">
          <div class="welcome-card" role="banner"><span class="kfe-eyebrow">WELCOME</span><h2>Hello, Welcome to Kanishka Enterprises</h2></div>
          <p class="kfe-eyebrow">START OF DAY</p>
          <h2>Ready for operation</h2>
          <p class="muted">{{ latestOdometer == null ? 'Enter the odometer to establish the first authoritative reading.' : 'Your latest authoritative odometer is ready for the day-start flow.' }}</p>
        </section>
        <section v-else-if="screenState === 'DAY_ENDED'" class="work-state-panel day-start-panel day-ended-panel">
          <p class="kfe-eyebrow">DAY ENDED</p>
          <h2>Shift summary</h2>
          <div class="shift-summary-grid" aria-label="Completed day shift summary">
            <article v-for="card in shiftSummaryCards" :key="card.label" class="shift-summary-card"><span>{{ card.label }}</span><strong>{{ card.value }}</strong></article>
          </div>
        </section>
        <section v-else-if="screenState === 'DAY_READY'" class="work-state-panel ready-panel">
          <p class="kfe-eyebrow">READY FOR OPERATION</p>
          <div class="ready-odometer"><span>Odometer</span><strong>{{ latestOdometer }}</strong><small>km</small></div>
          <div class="ready-status"><span>Shift: <b>NOT ACTIVE</b></span><span>Personal trip: <b>NOT ACTIVE</b></span></div>
          <button class="end-day-button" type="button" :disabled="busy || !canEndDay" @click="requestEndDay">End day</button>
        </section>
        <section v-else-if="screenState === 'SHIFT_WAITING'" class="work-state-panel waiting-panel">
          <p class="kfe-eyebrow">SHIFT ACTIVE</p><div class="waiting-metrics"><div><span>Trips</span><strong>{{ shiftTripCount }}</strong></div><div><span>Shift time</span><strong>{{ duration(shiftElapsed) }}</strong></div></div><p class="waiting-copy">Waiting for the next ride.</p>
        </section>
        <section v-else-if="screenState === 'BUSINESS_TRIP'" class="work-state-panel trip-panel business-trip-card"><p class="kfe-eyebrow">BUSINESS TRIP</p><div class="trip-timer">{{ duration(tripElapsed) }}</div><p class="muted">Trip active</p></section>
        <section v-else-if="screenState === 'PERSONAL_TRIP'" class="work-state-panel trip-panel personal-trip-card"><p class="kfe-eyebrow">PERSONAL TRIP</p><div class="trip-timer">{{ duration(tripElapsed) }}</div><p class="muted">Personal trip active</p></section>
      </main>
      <WorkBreakControl />
      <WorkSessionActions :form="form" :screen-state="screenState" :busy="busy" :day-allocation-valid="dayAllocationValid" :personal-allocation-valid="personalAllocationValid" :personal-end-valid="personalEndValid" :shift-end-valid="shiftEndValid" :shift-revenue-valid="shiftRevenueValid" @swipe="handleSwipe" />
      <WorkSessionForm data-kfe-draft-form="true" :form="form" :busy="busy" :latest-odometer="latestOdometer" :day-diff="dayDiff" :day-start-odometer="dayStartOdometer" :day-business-km="dayBusinessKm" :day-personal-km="dayPersonalKm" :personal-diff="personalDiff" :personal-start-odometer="personalStartOdometer" :personal-business-km="personalBusinessKm" :personal-personal-km="personalPersonalKm" :personal-end-odometer="personalEndOdometer" :personal-end-valid="personalEndValid" :personal-toll="personalToll" :personal-parking="personalParking" :shift-revenue="shiftRevenue" :shift-end-odometer="shiftEndOdometer" :shift-end-valid="shiftEndValid" :shift-toll="shiftToll" :shift-parking="shiftParking" :shift-toll-not-included="shiftTollNotIncluded" :shift-parking-not-included="shiftParkingNotIncluded" :unreviewed-ocr-ride-count="unreviewedOcrRideCount" @close="closeForm" @open-ocr-review="openOcrReview" @update:day-start-odometer="dayStartOdometer = $event" @update:day-business-km="dayBusinessKm = $event" @update:day-personal-km="personalStartOdometer = $event" @update:personal-business-km="personalBusinessKm = $event" @update:personal-personal-km="personalPersonalKm = $event" @update:personal-end-odometer="personalEndOdometer = $event" @update:personal-toll="personalToll = $event" @update:personal-parking="personalParking = $event" @update:shift-revenue="shiftRevenue = $event" @update:shift-end-odometer="shiftEndOdometer = $event" @update:shift-end-valid="shiftEndValid = $event" @update:shift-toll="shiftToll = $event" @update:shift-parking="shiftParking = $event" @update:shift-toll-not-included="shiftTollNotIncluded = $event" @update:shift-parking-not-included="shiftParkingNotIncluded = $event" />
      <WorkSessionOverlays :ocr-review-open="ocrReviewOpen" :end-day-confirm="endDayConfirm" :busy="busy" :unreviewed-ocr-rides="unreviewedOcrRides" :unreviewed-ocr-ride-count="unreviewedOcrRideCount" @close-ocr-review="ocrReviewOpen = false" @confirm-end-day="confirmEndDay" @cancel-end-day="endDayConfirm = false" />
    </template>
  </section>
</template>
