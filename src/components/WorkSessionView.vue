<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { application, actions } from '../presentation/application/presentation-runtime.js'
import { createUiCommand } from '../../js/application/ui-contract.js'
import WorkSessionActions from './WorkSessionActions.vue'
import WorkSessionForm from './WorkSessionForm.vue'
import WorkSessionOverlays from './WorkSessionOverlays.vue'
import TripEndForm from './TripEndForm.vue'
import { clearFormDraft, hasFormDraft, installFormDraftRecovery } from '../../js/ui/form-drafts.js'
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
const rehydrated = ref(false)
const rehydratedTripDraft = ref(null)
const stateSource = ref('LOCAL_DB')
const stateError = ref(null)
const workflowStateOverride = ref(null)
const dayStartOdometer = ref('')
const dayBusinessKm = ref('')
const dayPersonalKm = ref('')
const personalStartOdometer = ref('')
const personalEndOdometer = ref('')
const shiftEndOdometer = ref('')
const stagedShiftOdometer = ref(null)
const personalTripReturnState = ref('DAY_START')
const tripTimerEl = ref(null)
let timer
let tripTimer

const screenState = computed(() => model.value?.state || 'DAY_START')
const displayScreenState = computed(() => workflowStateOverride.value || screenState.value)
const latestOdometer = computed(() => model.value?.latestOdometer)
const dayStatus = computed(() => model.value?.day?.status || 'NOT_STARTED')
const activeShift = computed(() => model.value?.shift?.active ? model.value.shift : null)
const activeTrip = computed(() => model.value?.trip?.active ? model.value.trip : null)
const shiftElapsed = computed(() => activeShift.value?.startedAt ? Math.max(0, Math.floor((now.value - Date.parse(activeShift.value.startedAt)) / 1000)) : 0)
const shiftTripCount = computed(() => activeShift.value?.tripCount || 0)
const dayDiff = computed(() => {
  const current = Number(dayStartOdometer.value)
  const previous = latestOdometer.value == null ? null : Number(latestOdometer.value)
  if (!Number.isFinite(current) || current < 0) return { valid: false, difference: 0, required: false }
  if (previous == null) return { valid: true, difference: 0, required: false }
  if (current < previous) return { valid: false, difference: previous - current, required: false }
  return { valid: true, difference: current - previous, required: current !== previous }
})
const dayAllocationValid = computed(() => {
  if (!dayDiff.value.valid) return false
  if (!dayDiff.value.required) return true
  const business = Number(dayBusinessKm.value)
  const personal = Number(dayPersonalKm.value)
  return Number.isInteger(business) && business >= 0 && Number.isInteger(personal) && personal >= 0 && business + personal === dayDiff.value.difference
})
const personalEndValid = computed(() => {
  const end = Number(personalEndOdometer.value)
  const start = Number(activeTrip.value?.startOdometer)
  return Number.isFinite(end) && end >= 0 && (!Number.isFinite(start) || end >= start)
})
const shiftEndValid = computed(() => {
  const end = Number(shiftEndOdometer.value)
  const start = Number(activeShift.value?.startOdometer)
  return Number.isInteger(end) && end >= 0 && (!Number.isFinite(start) || end >= start)
})
const canEndDay = computed(() => screenState.value === 'DAY_READY' && !activeShift.value && !activeTrip.value && dayStatus.value !== 'COMPLETED')
const activeStateThemeClass = computed(() => {
  if (form.value === 'SHIFT_END') return 'state-close'
  if (form.value === 'PERSONAL_START' || form.value === 'PERSONAL_END' || displayScreenState.value === 'PERSONAL_TRIP') return 'state-personal'
  if (displayScreenState.value === 'SHIFT_WAITING' || displayScreenState.value === 'BUSINESS_TRIP') return 'state-business'
  return 'state-standby'
})

function duration(seconds) {
  const value = Math.max(0, Number(seconds) || 0)
  return [Math.floor(value / 3600), Math.floor(value / 60) % 60, value % 60].map(v => String(v).padStart(2, '0')).join(':')
}
function publishDriverState() { window.dispatchEvent(new CustomEvent('kfe:driver-state', { detail: { state: displayScreenState.value } })) }
function publishRehydratedState(state) { window.dispatchEvent(new CustomEvent('kfe:work-state-changed', { detail: { state } })) }
function openForm(kind) {
  error.value = ''
  notice.value = ''
  form.value = kind
  if (kind === 'DAY_START') {
    dayStartOdometer.value = latestOdometer.value == null ? '' : String(latestOdometer.value)
    dayBusinessKm.value = ''
    dayPersonalKm.value = ''
  }
  if (kind === 'PERSONAL_START') personalStartOdometer.value = latestOdometer.value == null ? '' : String(latestOdometer.value)
  if (kind === 'PERSONAL_END') personalEndOdometer.value = ''
  if (kind === 'SHIFT_END') shiftEndOdometer.value = ''
}
function closeForm() {
  if (busy.value) return
  const root = document.querySelector('.work-form-card')
  if (root && hasFormDraft(root)) {
    const ok = globalThis.confirm?.('Discard this unsaved draft?')
    if (ok === false) return
    clearFormDraft(root)
  }
  form.value = null
  error.value = ''
}
function mergeRehydratedTrip(loaded) {
  const draft = rehydratedTripDraft.value
  if (!draft || loaded?.trip?.active) return loaded
  return {
    ...loaded,
    trip: {
      active: true,
      id: draft.trip_id,
      scope: draft.trip_type === 'PERSONAL' ? 'PERSONAL' : 'BUSINESS',
      tripType: draft.trip_type,
      shiftId: draft.shift_id,
      businessDate: draft.business_date,
      startOdometer: draft.start_odometer_km,
      startedAt: draft.started_at,
    },
  }
}
async function load() {
  loading.value = true
  try {
    model.value = mergeRehydratedTrip(await application.getWorkScreenState())
    if (activeTrip.value) workflowStateOverride.value = activeTrip.value.tripType === 'PERSONAL' ? 'PERSONAL_TRIP' : 'BUSINESS_TRIP'
    else if (screenState.value !== 'SHIFT_WAITING') workflowStateOverride.value = null
    workSummary.value = model.value?.state === 'DAY_ENDED' ? await application.getWorkSummary() : null
    updateTripTimer()
    publishDriverState()
  } catch (e) {
    error.value = String(e?.message || e)
  } finally {
    loading.value = false
  }
}
async function loadWorkState() {
  try {
    const restored = await application.getWorkState()
    rehydrated.value = restored?.rehydrated === true
    rehydratedTripDraft.value = restored?.active_trip || null
    stateSource.value = restored?.state_source || 'LOCAL_DB'
    stateError.value = restored?.state_error || null
    publishRehydratedState(restored?.screen_state || restored?.state || 'DAY_START')
  } catch (e) {
    rehydrated.value = false
    stateSource.value = 'LOCAL_DB'
    stateError.value = 'CORRUPTED'
    publishRehydratedState('DAY_START')
  }
}
async function dispatch(type, payload = {}) {
  if (busy.value) return null
  busy.value = true
  error.value = ''
  try {
    let result
    if (type === 'START_TRIP') {
      const start = Number(payload.start_odometer_km ?? latestOdometer.value)
      if (!Number.isFinite(start)) throw new Error('A latest authoritative odometer is required to start a business trip.')
      result = await application.startTrip({
        trip_type: 'BUSINESS',
        shift_id: activeShift.value?.id || null,
        business_date: activeShift.value?.businessDate || activeShift.value?.business_date || new Date().toISOString().slice(0, 10),
        start_odometer_km: start,
        actionMode: payload.actionMode || 'SWIPE',
        direction: payload.direction || 'RIGHT',
      })
    } else if (type === 'START_PERSONAL_TRIP') {
      const start = Number(payload.start_odometer_km ?? payload.odometer)
      if (!Number.isFinite(start)) throw new Error('A valid personal-trip start odometer is required.')
      result = await application.startTrip({
        trip_type: 'PERSONAL',
        shift_id: null,
        business_date: new Date().toISOString().slice(0, 10),
        start_odometer_km: start,
        prefilledOdometer: payload.prefilledOdometer,
        businessKm: 0,
        personalKm: 0,
        actionMode: payload.actionMode || 'SWIPE',
        direction: payload.direction || 'LEFT',
      })
    } else if (type === 'END_PERSONAL_TRIP') {
      result = await application.endTrip({
        trip_type: 'PERSONAL',
        trip_id: payload.id,
        end_odometer_km: payload.endOdometer,
        actionMode: payload.actionMode || 'SWIPE',
        direction: payload.direction || 'RIGHT',
      })
    } else {
      result = await actions.dispatch(createUiCommand(type, payload))
    }
    const root = document.querySelector('.work-form-card')
    if (root) clearFormDraft(root)
    form.value = null
    endDayConfirm.value = false
    rehydratedTripDraft.value = null
    await loadWorkState()
    await load()
    return result
  } catch (e) {
    error.value = String(e?.message || e)
    return null
  } finally {
    busy.value = false
  }
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
  if (!Number.isFinite(odometer) || odometer < 0) return (error.value = 'Enter the personal-trip start odometer.')
  personalTripReturnState.value = displayScreenState.value
  await dispatch('START_PERSONAL_TRIP', { odometer, prefilledOdometer: latestOdometer.value, actionMode: 'SWIPE', direction: 'LEFT' })
}
async function confirmPersonalEnd() {
  const odometer = Number(personalEndOdometer.value)
  if (!Number.isFinite(odometer) || odometer < 0) return (error.value = 'End odometer is compulsory.')
  if (!personalEndValid.value) return (error.value = 'End odometer cannot be below the trip start odometer.')
  const returnState = personalTripReturnState.value
  const result = await dispatch('END_PERSONAL_TRIP', { id: activeTrip.value?.id, endOdometer: odometer, actionMode: 'SWIPE', direction: 'RIGHT' })
  if (result && returnState === 'SHIFT_WAITING') {
    stagedShiftOdometer.value = odometer
    workflowStateOverride.value = 'SHIFT_WAITING'
    notice.value = `Shift baseline rebound to ${odometer} km.`
  }
}
async function confirmBusinessEnd(endOdometer) {
  const odometer = Number(endOdometer)
  if (!Number.isFinite(odometer) || odometer < 0) return (error.value = 'End odometer is compulsory.')
  const start = Number(activeTrip.value?.startOdometer)
  if (Number.isFinite(start) && odometer < start) return (error.value = 'End odometer cannot be below the trip start odometer.')
  await dispatch('END_TRIP', { id: activeTrip.value?.id, endOdometer: odometer, actionMode: 'SWIPE', direction: 'RIGHT' })
}
async function confirmShiftEnd() {
  const odometer = Number(shiftEndOdometer.value)
  if (!Number.isInteger(odometer) || odometer < 0) return (error.value = 'End odometer is compulsory.')
  if (!shiftEndValid.value) return (error.value = 'End odometer cannot be below the shift start odometer.')
  await dispatch('END_SHIFT', { id: activeShift.value?.id, endOdometer: odometer, actionMode: 'SWIPE', direction: 'LEFT' })
}
async function cancelShiftStaging() {
  if (busy.value || !activeShift.value || activeTrip.value) return
  busy.value = true
  error.value = ''
  try {
    await application.undoWorkAction({ type: 'START_SHIFT', id: activeShift.value.id })
    if (model.value?.day?.id) await application.undoWorkAction({ type: 'START_DAY', id: model.value.day.id })
    stagedShiftOdometer.value = null
    workflowStateOverride.value = null
    form.value = null
    await loadWorkState()
    await load()
  } catch (e) {
    error.value = String(e?.message || e)
  } finally {
    busy.value = false
  }
}
function onStateAuthority(state) {
  if (state === 'SHIFT_WAITING' && !activeShift.value && !activeTrip.value) workflowStateOverride.value = 'SHIFT_WAITING'
  else if (state !== 'SHIFT_WAITING') workflowStateOverride.value = null
  publishDriverState()
}
function handleSwipe(payload) {
  const action = typeof payload === 'string' ? payload : payload?.action
  if (action === 'START_DAY') return openForm('DAY_START')
  if (action === 'START_PERSONAL_TRIP') {
    personalTripReturnState.value = displayScreenState.value
    return openForm('PERSONAL_START')
  }
  if (action === 'START_SHIFT') {
    stagedShiftOdometer.value = latestOdometer.value == null ? null : Number(latestOdometer.value)
    return dispatch('START_SHIFT', { startOdometer: stagedShiftOdometer.value, actionMode: 'SWIPE', direction: 'RIGHT' })
  }
  if (action === 'START_TRIP') return dispatch('START_TRIP', { start_odometer_km: latestOdometer.value, actionMode: 'SWIPE', direction: 'RIGHT' })
  if (action === 'END_TRIP') return openForm('BUSINESS_END')
  if (action === 'END_PERSONAL_TRIP') return openForm('PERSONAL_END')
  if (action === 'END_SHIFT') return openForm('SHIFT_END')
  if (action === 'START_DAY_CONFIRM') return confirmDayStart()
  if (action === 'START_PERSONAL_TRIP_CONFIRM') return confirmPersonalStart()
  if (action === 'CLOSE_PERSONAL_TRIP') return confirmPersonalEnd()
  if (action === 'CLOSE_BUSINESS_TRIP') return openForm('BUSINESS_END')
  if (action === 'CLOSE_SHIFT') return confirmShiftEnd()
}
function updateTripTimer() {
  if (!tripTimerEl.value || !activeTrip.value?.startedAt) return
  tripTimerEl.value.textContent = duration(Math.max(0, Math.floor((Date.now() - Date.parse(activeTrip.value.startedAt)) / 1000)))
}
function requestEndDay() { if (canEndDay.value) endDayConfirm.value = true }
async function confirmEndDay() { if (canEndDay.value) await dispatch('END_DAY', { actionMode: 'BUTTON' }) }
function onKey(event) {
  if (event.key !== 'Escape') return
  if (endDayConfirm.value) endDayConfirm.value = false
  else if (form.value) closeForm()
}

onMounted(async () => {
  installFormDraftRecovery()
  timer = setInterval(() => { now.value = Date.now() }, 1000)
  tripTimer = setInterval(updateTripTimer, 1000)
  window.addEventListener('keydown', onKey)
  await loadWorkState()
  await load()
})
onUnmounted(() => {
  clearInterval(timer)
  clearInterval(tripTimer)
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <section class="kfe-work-session" :class="activeStateThemeClass" aria-labelledby="work-title" :data-kfe-shift-state="activeTrip ? 'SHIFT' : (displayScreenState === 'SHIFT_WAITING' ? 'SHIFT_WAITING' : undefined)" :data-kfe-trip-state="activeTrip ? (activeTrip.scope === 'PERSONAL' ? 'IN_PERSONAL_TRIP' : 'IN_BUSINESS_TRIP') : undefined" :data-kfe-rehydrated="rehydrated ? 'true' : undefined" :data-kfe-state-source="stateSource" :data-kfe-state-error="stateError || undefined">
    <div v-if="loading" class="work-loading" role="status">Loading Work…</div>
    <template v-else>
      <header class="work-header">
        <div>
          <p class="kfe-eyebrow">Operational cockpit</p>
          <h1 id="work-title">Work</h1>
          <p>Today · <span class="state-badge">{{ displayScreenState.replaceAll('_', ' ') }}</span></p>
        </div>
        <div class="work-header-status"><span class="work-shift-mini">SHIFT {{ activeShift ? duration(shiftElapsed) : '—' }}</span></div>
      </header>
      <div v-if="error" class="work-error" role="alert">{{ error }}</div>
      <div v-if="notice" class="work-notice" role="status">✓ {{ notice }}</div>

      <main class="work-main">
        <section v-if="displayScreenState === 'DAY_START'" class="work-state-panel day-start-panel start-of-day-panel">
          <div class="welcome-card" role="banner"><span class="kfe-eyebrow">WELCOME</span><h2>Hello, Welcome to Kanishka Enterprises</h2><p class="muted">{{ latestOdometer == null ? 'Enter the odometer to establish the first authoritative reading.' : 'Your latest authoritative odometer is ready for the day-start flow.' }}</p></div>
          <p class="kfe-eyebrow">START OF DAY</p><h2>Ready for operation</h2>
        </section>

        <section v-else-if="displayScreenState === 'DAY_ENDED'" class="work-state-panel day-start-panel day-ended-panel">
          <p class="kfe-eyebrow">DAY ENDED</p><h2>Day complete</h2>
          <div class="shift-summary-grid" aria-label="Completed day shift summary">
            <article v-for="card in [
              { label: 'Kms run', value: workSummary?.kmsRun == null ? '—' : `${workSummary.kmsRun} km` },
              { label: 'Dead kms', value: workSummary?.deadKms == null ? '—' : `${workSummary.deadKms} km` },
              { label: 'Revenue', value: workSummary?.revenuePaise == null ? '—' : `₹${(Number(workSummary.revenuePaise) / 100).toFixed(2)}` },
            ]" :key="card.label" class="shift-summary-card"><span>{{ card.label }}</span><strong>{{ card.value }}</strong></article>
          </div>
        </section>

        <section v-else-if="displayScreenState === 'DAY_READY'" class="work-state-panel ready-panel">
          <p class="kfe-eyebrow">READY FOR OPERATION</p><div class="ready-odometer"><span>Odometer</span><strong>{{ latestOdometer }}</strong><small>km</small></div>
          <div class="ready-status"><span>Shift: <b>NOT ACTIVE</b></span><span>Personal trip: <b>NOT ACTIVE</b></span></div>
          <button class="end-day-button" type="button" :disabled="busy || !canEndDay" @click="requestEndDay">End day</button>
        </section>

        <section v-else-if="displayScreenState === 'SHIFT_WAITING' && !activeShift" class="work-state-panel waiting-panel">
          <p class="kfe-eyebrow">SHIFT WAITING</p><div class="waiting-metrics"><div><span>Odometer</span><strong>{{ stagedShiftOdometer ?? latestOdometer ?? '—' }}</strong></div></div>
          <p class="waiting-copy">Shift is staged from the latest authoritative odometer.</p>
          <button class="secondary-action touch-button-48" type="button" :disabled="busy" data-kfe-action="cancel-shift-staging" @click="cancelShiftStaging">Cancel</button>
        </section>

        <section v-else-if="displayScreenState === 'SHIFT_WAITING'" class="work-state-panel waiting-panel">
          <p class="kfe-eyebrow">SHIFT</p><div class="waiting-metrics"><div><span>Trips</span><strong>{{ shiftTripCount }}</strong></div><div><span>Shift time</span><strong>{{ duration(shiftElapsed) }}</strong></div></div>
          <p class="waiting-copy">Shift is active. Start a Business Trip or take a Personal Trip.</p>
          <button class="secondary-action touch-button-48" type="button" :disabled="busy || !!activeTrip" data-kfe-action="cancel-shift-staging" @click="cancelShiftStaging">Cancel</button>
        </section>

        <section v-else-if="displayScreenState === 'BUSINESS_TRIP'" class="work-state-panel trip-panel business-trip-card" role="region" aria-label="Active Business Trip">
          <p class="kfe-eyebrow">BUSINESS TRIP</p><div ref="tripTimerEl" class="trip-timer">00:00:00</div><p class="muted">Business trip active</p>
        </section>
        <section v-else-if="displayScreenState === 'PERSONAL_TRIP'" class="work-state-panel trip-panel personal-trip-card" role="region" aria-label="Active Personal Trip">
          <p class="kfe-eyebrow">PERSONAL TRIP</p><div ref="tripTimerEl" class="trip-timer">00:00:00</div><p class="muted">Personal trip active</p>
        </section>
      </main>

      <WorkSessionActions :form="form" :screen-state="displayScreenState" :active-trip="activeTrip" :busy="busy" :day-allocation-valid="dayAllocationValid" :personal-allocation-valid="true" :personal-end-valid="personalEndValid" :shift-end-valid="shiftEndValid" :business-end-valid="true" @swipe="handleSwipe" @state-authority="onStateAuthority" />
      <WorkSessionForm v-if="form" :form="form" :busy="busy" :day-diff="dayDiff" :day-start-odometer="dayStartOdometer" :day-business-km="dayBusinessKm" :day-personal-km="dayPersonalKm" :personal-start-odometer="personalStartOdometer" :personal-end-odometer="personalEndOdometer" :personal-end-valid="personalEndValid" :shift-end-odometer="shiftEndOdometer" :shift-end-valid="shiftEndValid" @close="closeForm" @update:day-start-odometer="dayStartOdometer=$event" @update:day-business-km="dayBusinessKm=$event" @update:day-personal-km="dayPersonalKm=$event" @update:personal-start-odometer="personalStartOdometer=$event" @update:personal-end-odometer="personalEndOdometer=$event" @update:shift-end-odometer="shiftEndOdometer=$event" />
      <WorkSessionOverlays :end-day-confirm="endDayConfirm" :busy="busy" @confirm-end-day="confirmEndDay" @cancel-end-day="endDayConfirm=false" />
      <TripEndForm v-if="form === 'PERSONAL_END'" :start-odometer="activeTrip?.startOdometer" :busy="busy" trip-type="PERSONAL" @close="closeForm" @submitted="confirmPersonalEnd" />
      <TripEndForm v-if="form === 'BUSINESS_END'" :start-odometer="activeTrip?.startOdometer" :busy="busy" trip-type="BUSINESS" @close="closeForm" @submitted="confirmBusinessEnd" />
    </template>
  </section>
</template>
