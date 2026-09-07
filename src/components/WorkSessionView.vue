<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { application, actions } from '../presentation/application/presentation-runtime.js'
import { createUiCommand } from '../../js/application/ui-contract.js'
import WorkBreakControl from './WorkBreakControl.vue'
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
const theme = ref('DAY')
const rehydrated = ref(false)
const rehydratedTripDraft = ref(null)
const stateSource = ref('LOCAL_DB')
const stateError = ref(null)
const workflowStateOverride = ref(null)
const dayStartOdometer = ref('')
const dayBusinessKm = ref('')
const dayPersonalKm = ref('')
const personalStartOdometer = ref('')
const personalBusinessKm = ref('')
const personalPersonalKm = ref('')
const personalEndOdometer = ref('')
const personalToll = ref('')
const personalParking = ref('')
const businessEndOdometer = ref('')
const shiftRevenue = ref('')
const shiftEndOdometer = ref('')
const shiftToll = ref('')
const shiftParking = ref('')
const shiftTollNotIncluded = ref(false)
const shiftParkingNotIncluded = ref(false)
const stagedShiftOdometer = ref(null)
const personalTripReturnState = ref('DAY_START')
const tripTimerEl = ref(null)
const ocrReviewOpen = ref(false)
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
const unreviewedOcrRides = computed(() => Array.isArray(model.value?.unreviewedOcrRides) ? model.value.unreviewedOcrRides : [])
const unreviewedOcrRideCount = computed(() => unreviewedOcrRides.value.length)
const shiftSummaryCards = computed(() => [
  { label: 'Kms run', value: workSummary.value?.kmsRun == null ? '—' : `${workSummary.value.kmsRun} km` },
  { label: 'Dead kms', value: workSummary.value?.deadKms == null ? '—' : `${workSummary.value.deadKms} km` },
  { label: 'Revenue', value: workSummary.value?.revenuePaise == null ? '—' : `₹${(Number(workSummary.value.revenuePaise) / 100).toFixed(2)}` },
  { label: 'Target', value: workSummary.value?.targetPaise == null ? '—' : `₹${(Number(workSummary.value.targetPaise) / 100).toFixed(2)}` },
])
function duration(seconds) { const value = Math.max(0, Number(seconds) || 0); return [Math.floor(value / 3600), Math.floor(value / 60) % 60, value % 60].map(v => String(v).padStart(2, '0')).join(':') }
function odometerDifference(current, previous) { const value = Number(current); const prior = previous == null ? null : Number(previous); if (!Number.isFinite(value) || value < 0) return { valid: false, difference: 0, required: false }; if (prior == null) return { valid: true, difference: 0, required: false }; if (value < prior) return { valid: false, difference: prior - value, required: false }; return { valid: true, difference: value - prior, required: value !== prior } }
function allocationValid(diff, business, personal) { if (!diff.valid) return false; if (!diff.required) return true; const b = Number(business); const p = Number(personal); return Number.isInteger(b) && Number.isInteger(p) && b >= 0 && p >= 0 && b + p === diff.difference }
const dayDiff = computed(() => odometerDifference(dayStartOdometer.value, latestOdometer.value))
const personalDiff = computed(() => odometerDifference(personalStartOdometer.value, latestOdometer.value))
const dayAllocationValid = computed(() => allocationValid(dayDiff.value, dayBusinessKm.value, dayPersonalKm.value))
const personalAllocationValid = ref(true)
const shiftEndValid = computed(() => { const n = Number(shiftEndOdometer.value); return Number.isInteger(n) && n >= 0 && (!activeShift.value?.startOdometer || n >= Number(activeShift.value.startOdometer)) })
const personalEndValid = computed(() => { const n = Number(personalEndOdometer.value); const start = Number(activeTrip.value?.startOdometer); return Number.isFinite(n) && n >= 0 && (!Number.isFinite(start) || n >= start) })
const businessEndValid = computed(() => { const n = Number(businessEndOdometer.value); const start = Number(activeTrip.value?.startOdometer); return Number.isFinite(n) && n >= 0 && (!Number.isFinite(start) || n >= start) })
const shiftRevenueValid = computed(() => String(shiftRevenue.value).trim() !== '' && Number.isFinite(Number(shiftRevenue.value)) && Number(shiftRevenue.value) >= 0)
const canEndDay = computed(() => screenState.value === 'DAY_READY' && !activeShift.value && !activeTrip.value && dayStatus.value !== 'COMPLETED')
const activeStateThemeClass = computed(() => { if (form.value === 'SHIFT_END') return 'state-close'; if (form.value === 'PERSONAL_START' || form.value === 'PERSONAL_END' || displayScreenState.value === 'PERSONAL_TRIP') return 'state-personal'; if (displayScreenState.value === 'SHIFT_WAITING' || displayScreenState.value === 'BUSINESS_TRIP') return 'state-business'; return 'state-standby' })
function publishDriverState() { window.dispatchEvent(new CustomEvent('kfe:driver-state', { detail: { state: displayScreenState.value } })) }
function publishRehydratedState(state) { window.dispatchEvent(new CustomEvent('kfe:work-state-changed', { detail: { state } })) }
function cycleTheme() { if (theme.value === 'DAY') theme.value = 'DUSK'; else if (theme.value === 'DUSK') theme.value = 'NIGHT'; else theme.value = 'DAY' }
function openForm(kind) { error.value = ''; notice.value = ''; form.value = kind; ocrReviewOpen.value = false; if (kind === 'DAY_START') dayStartOdometer.value = latestOdometer.value == null ? '' : String(latestOdometer.value); if (kind === 'PERSONAL_START') personalStartOdometer.value = latestOdometer.value == null ? '' : String(latestOdometer.value); if (kind === 'PERSONAL_END') personalEndOdometer.value = ''; if (kind === 'BUSINESS_END') businessEndOdometer.value = ''; if (kind === 'SHIFT_END') { shiftRevenue.value = ''; shiftEndOdometer.value = ''; shiftToll.value = ''; shiftParking.value = ''; shiftTollNotIncluded.value = false; shiftParkingNotIncluded.value = false } }
function closeForm() { if (busy.value) return; ocrReviewOpen.value = false; const root = document.querySelector('.work-form-card'); if (root && hasFormDraft(root)) { const ok = globalThis.confirm?.('Discard this unsaved draft?'); if (ok === false) return; clearFormDraft(root) } form.value = null; error.value = '' }
function mergeRehydratedTrip(loaded) { const draft = rehydratedTripDraft.value; if (!draft || loaded?.trip?.active) return loaded; return { ...loaded, trip: { active: true, id: draft.trip_id, scope: draft.trip_type === 'PERSONAL' ? 'PERSONAL' : 'BUSINESS', tripType: draft.trip_type, shiftId: draft.shift_id, businessDate: draft.business_date, startOdometer: draft.start_odometer_km, startedAt: draft.started_at } } }
async function load() { loading.value = true; try { model.value = mergeRehydratedTrip(await application.getWorkScreenState()); if (activeTrip.value && !activeShift.value) workflowStateOverride.value = activeTrip.value.tripType === 'PERSONAL' ? 'PERSONAL_TRIP' : 'BUSINESS_TRIP'; else if (screenState.value === 'SHIFT_WAITING' || screenState.value === 'BUSINESS_TRIP' || screenState.value === 'PERSONAL_TRIP' || screenState.value === 'DAY_START' || screenState.value === 'DAY_ENDED') workflowStateOverride.value = null; workSummary.value = model.value?.state === 'DAY_ENDED' ? await application.getWorkSummary() : null; updateTripTimer(); publishDriverState() } catch (e) { error.value = String(e?.message || e) } finally { loading.value = false } }
async function loadWorkState() { try { const restored = await application.getWorkState(); rehydrated.value = restored?.rehydrated === true; rehydratedTripDraft.value = restored?.active_trip || null; stateSource.value = restored?.state_source || 'LOCAL_DB'; stateError.value = restored?.state_error || null; publishRehydratedState(restored?.screen_state || restored?.state || 'OFF_SHIFT') } catch (e) { rehydrated.value = true; stateSource.value = 'LOCAL_DB'; stateError.value = 'CORRUPTED'; publishRehydratedState('OFF_SHIFT') } }
async function dispatch(type, payload = {}) { if (busy.value) return null; busy.value = true; error.value = ''; try { let result; if (type === 'START_TRIP') { const tripType = 'BUSINESS'; const start = Number(payload.start_odometer_km ?? latestOdometer.value); if (!Number.isFinite(start)) throw new Error('A latest authoritative odometer is required to start a business trip.'); result = await application.startTrip({ trip_type: tripType, shift_id: activeShift.value?.id || null, business_date: activeShift.value?.businessDate || activeShift.value?.business_date || new Date().toISOString().slice(0, 10), start_odometer_km: start, actionMode: payload.actionMode || 'SWIPE', direction: payload.direction || 'RIGHT' }); } else if (type === 'START_PERSONAL_TRIP') { const start = Number(payload.start_odometer_km ?? payload.odometer); if (!Number.isFinite(start)) throw new Error('A valid personal-trip start odometer is required.'); result = await application.startTrip({ trip_type: 'PERSONAL', shift_id: null, business_date: new Date().toISOString().slice(0, 10), start_odometer_km: start, prefilledOdometer: payload.prefilledOdometer, businessKm: 0, personalKm: 0, actionMode: payload.actionMode || 'SWIPE', direction: payload.direction || 'LEFT' }); } else if (type === 'END_PERSONAL_TRIP') { result = await application.endTrip({ trip_type: 'PERSONAL', trip_id: payload.id, end_odometer_km: payload.endOdometer, tollPaise: payload.tollPaise, parkingPaise: payload.parkingPaise, actionMode: payload.actionMode || 'SWIPE', direction: payload.direction || 'RIGHT' }); } else { result = await actions.dispatch(createUiCommand(type, payload)); } const root = document.querySelector('.work-form-card'); if (root) clearFormDraft(root); form.value = null; ocrReviewOpen.value = false; endDayConfirm.value = false; rehydratedTripDraft.value = null; await load(); return result } catch (e) { error.value = String(e?.message || e); return null } finally { busy.value = false } }
async function confirmDayStart() { const odometer = Number(dayStartOdometer.value); if (!Number.isInteger(odometer) || odometer < 0) return (error.value = 'Enter the day-start odometer.'); if (!dayDiff.value.valid) return (error.value = 'Odometer cannot decrease.'); if (!dayAllocationValid.value) return (error.value = `Allocate exactly ${dayDiff.value.difference} km between business and personal.`); await dispatch('START_DAY', { odometer, prefilledOdometer: latestOdometer.value, businessKm: dayDiff.value.required ? Number(dayBusinessKm.value) : 0, personalKm: dayDiff.value.required ? Number(dayPersonalKm.value) : 0, actionMode: 'SWIPE', direction: 'RIGHT' }) }
async function confirmPersonalStart() { const odometer = Number(personalStartOdometer.value); if (!Number.isFinite(odometer) || odometer < 0) return (error.value = 'Enter the personal-trip start odometer.'); if (!personalDiff.value.valid) return (error.value = 'Odometer cannot decrease.'); personalTripReturnState.value = displayScreenState.value; await dispatch('START_PERSONAL_TRIP', { odometer, prefilledOdometer: latestOdometer.value, actionMode: 'SWIPE', direction: 'LEFT' }) }
async function confirmPersonalEnd() { const odometer = Number(personalEndOdometer.value); if (!Number.isFinite(odometer) || odometer < 0) return (error.value = 'End odometer is compulsory.'); if (!personalEndValid.value) return (error.value = 'End odometer cannot be below the trip start odometer.'); await dispatch('END_PERSONAL_TRIP', { id: activeTrip.value?.id, endOdometer: odometer, tollPaise: Math.round(Math.max(0, Number(personalToll.value) || 0) * 100), parkingPaise: Math.round(Math.max(0, Number(personalParking.value) || 0) * 100), actionMode: 'SWIPE', direction: 'RIGHT' }); if (personalTripReturnState.value === 'SHIFT_WAITING') stagedShiftOdometer.value = odometer; workflowStateOverride.value = personalTripReturnState.value }
async function confirmBusinessEnd() { const odometer = Number(businessEndOdometer.value); if (!Number.isFinite(odometer) || odometer < 0) return (error.value = 'End odometer is compulsory.'); if (!businessEndValid.value) return (error.value = 'End odometer cannot be below the trip start odometer.'); await dispatch('END_TRIP', { id: activeTrip.value?.id, endOdometer: odometer, actionMode: 'SWIPE', direction: 'RIGHT' }) }
async function confirmShiftEnd() { if (!shiftRevenueValid.value) return (error.value = 'Revenue is compulsory to close the business shift.'); const odometer = Number(shiftEndOdometer.value); if (!Number.isInteger(odometer) || odometer < 0) return (error.value = 'End odometer is compulsory.'); if (!shiftEndValid.value) return (error.value = 'End odometer cannot be below the shift start odometer.'); await dispatch('END_SHIFT', { id: activeShift.value?.id, endOdometer: odometer, revenuePaise: Math.round(Number(shiftRevenue.value) * 100), tollPaise: Math.round(Math.max(0, Number(shiftToll.value) || 0) * 100), parkingPaise: Math.round(Math.max(0, Number(shiftParking.value) || 0) * 100), tollIncludedInFare: !shiftTollNotIncluded.value, parkingIncludedInFare: !shiftParkingNotIncluded.value, actionMode: 'SWIPE', direction: 'LEFT' }) }
function onStateAuthority(state) { if (state === 'SHIFT_WAITING' && !activeShift.value && !activeTrip.value) workflowStateOverride.value = 'SHIFT_WAITING'; else if (state !== 'SHIFT_WAITING' && state !== 'BUSINESS_END') workflowStateOverride.value = null; publishDriverState() }
function handleSwipe(payload) { const action = typeof payload === 'string' ? payload : payload?.action; const odometer = typeof payload === 'object' ? payload?.odometer : null; if (action === 'START_DAY') return openForm('DAY_START'); if (action === 'START_PERSONAL_TRIP') { personalTripReturnState.value = displayScreenState.value; return openForm('PERSONAL_START') } if (action === 'START_SHIFT') return dispatch('START_SHIFT', { startOdometer: odometer, actionMode: 'SWIPE', direction: 'RIGHT' }); if (action === 'START_TRIP') return dispatch('START_TRIP', { start_odometer_km: latestOdometer.value, actionMode: 'SWIPE', direction: 'RIGHT' }); if (action === 'END_TRIP') return openForm('BUSINESS_END'); if (action === 'END_PERSONAL_TRIP') return openForm('PERSONAL_END'); if (action === 'END_SHIFT') return openForm('SHIFT_END'); if (action === 'START_DAY_CONFIRM') return confirmDayStart(); if (action === 'START_PERSONAL_TRIP_CONFIRM') return confirmPersonalStart(); if (action === 'CLOSE_PERSONAL_TRIP') return confirmPersonalEnd(); if (action === 'CLOSE_BUSINESS_TRIP') return confirmBusinessEnd(); if (action === 'CLOSE_SHIFT') return confirmShiftEnd() }
function updateTripTimer() { if (!tripTimerEl.value || !activeTrip.value?.startedAt) return; tripTimerEl.value.textContent = duration(Math.max(0, Math.floor((Date.now() - Date.parse(activeTrip.value.startedAt)) / 1000))) }
function openOcrReview() { if (unreviewedOcrRideCount.value > 0) ocrReviewOpen.value = true }
function requestEndDay() { if (canEndDay.value) endDayConfirm.value = true }
async function confirmEndDay() { if (canEndDay.value) await dispatch('END_DAY', { actionMode: 'BUTTON' }) }
function onKey(event) { if (event.key === 'Escape') { if (ocrReviewOpen.value) ocrReviewOpen.value = false; else if (endDayConfirm.value) endDayConfirm.value = false; else if (form.value) closeForm() } }
onMounted(async () => { installFormDraftRecovery(); timer = setInterval(() => { now.value = Date.now() }, 1000); tripTimer = setInterval(updateTripTimer, 1000); window.addEventListener('keydown', onKey); await loadWorkState(); await load() })
onUnmounted(() => { clearInterval(timer); clearInterval(tripTimer); window.removeEventListener('keydown', onKey) })
</script>

<template>
  <section class="kfe-work-session" :class="[activeStateThemeClass, `theme-${theme.toLowerCase()}`]" aria-labelledby="work-title" :data-kfe-rehydrated="rehydrated ? 'true' : undefined" :data-kfe-state-source="stateSource" :data-kfe-state-error="stateError || undefined">
    <div v-if="loading" class="work-loading" role="status">Loading Work…</div>
    <template v-else>
      <header class="work-header"><div><p class="kfe-eyebrow">Operational cockpit</p><h1 id="work-title">Work</h1><p>Today · <span class="state-badge">{{ displayScreenState.replaceAll('_', ' ') }}</span></p></div><div class="work-header-status"><button type="button" class="theme-toggle-btn" @click="cycleTheme" aria-label="Toggle Night Mode Theme">[{{ theme }}]</button><span class="work-shift-mini">SHIFT {{ activeShift ? duration(shiftElapsed) : '—' }}</span></div></header>
      <div v-if="error" class="work-error" role="alert">{{ error }}</div><div v-if="notice" class="work-notice" role="status">✓ {{ notice }}</div>
      <main class="work-main">
        <section v-if="displayScreenState === 'DAY_START'" class="work-state-panel day-start-panel start-of-day-panel"><div class="welcome-card" role="banner"><span class="kfe-eyebrow">WELCOME</span><h2>Hello, Welcome to Kanishka Enterprises</h2><p class="muted">{{ latestOdometer == null ? 'Enter the odometer to establish the first authoritative reading.' : 'Your latest authoritative odometer is ready for the day-start flow.' }}</p></div><p class="kfe-eyebrow">START OF DAY</p><h2>Ready for operation</h2></section>
        <section v-else-if="displayScreenState === 'DAY_ENDED'" class="work-state-panel day-start-panel day-ended-panel"><p class="kfe-eyebrow">DAY ENDED</p><h2>Shift summary</h2><div class="shift-summary-grid" aria-label="Completed day shift summary"><article v-for="card in shiftSummaryCards" :key="card.label" class="shift-summary-card"><span>{{ card.label }}</span><strong>{{ card.value }}</strong></article></div></section>
        <section v-else-if="displayScreenState === 'DAY_READY'" class="work-state-panel ready-panel"><p class="kfe-eyebrow">READY FOR OPERATION</p><div class="ready-odometer"><span>Odometer</span><strong>{{ latestOdometer }}</strong><small>km</small></div><div class="ready-status"><span>Shift: <b>NOT ACTIVE</b></span><span>Personal trip: <b>NOT ACTIVE</b></span></div><button class="end-day-button" type="button" :disabled="busy || !canEndDay" @click="requestEndDay">End day</button></section>
        <section v-else-if="displayScreenState === 'SHIFT_WAITING'" class="work-state-panel waiting-panel"><p class="kfe-eyebrow">START SHIFT</p><div class="waiting-metrics"><div><span>Trips</span><strong>{{ shiftTripCount }}</strong></div><div><span>Shift time</span><strong>{{ activeShift ? duration(shiftElapsed) : '00:00:00' }}</strong></div></div><p class="waiting-copy">Choose Start Shift, or take a Personal Trip first.</p></section>
        <section v-else-if="displayScreenState === 'BUSINESS_TRIP'" class="work-state-panel trip-panel business-trip-card" role="region" aria-label="Active Trip" data-kfe-trip-state="IN_BUSINESS_TRIP" :data-kfe-rehydrated="rehydratedTripDraft ? 'true' : undefined"><p class="kfe-eyebrow">BUSINESS TRIP</p><div ref="tripTimerEl" data-kfe-field="trip_duration" class="trip-timer">00:00:00</div><p class="muted">Trip active</p></section>
        <section v-else-if="displayScreenState === 'PERSONAL_TRIP'" class="work-state-panel trip-panel personal-trip-card" role="region" aria-label="Active Trip" data-kfe-trip-state="IN_PERSONAL_TRIP" :data-kfe-rehydrated="rehydratedTripDraft ? 'true' : undefined"><p class="kfe-eyebrow">PERSONAL TRIP</p><div ref="tripTimerEl" data-kfe-field="trip_duration" class="trip-timer">00:00:00</div><p class="muted">Personal trip active</p></section>
      </main>
      <WorkBreakControl v-if="activeShift" />
      <WorkSessionActions :form="form" :screen-state="displayScreenState" :work-state="displayScreenState" :active-trip="activeTrip" :busy="busy" :latest-odometer="latestOdometer" :staged-shift-odometer="stagedShiftOdometer" :day-allocation-valid="dayAllocationValid" :personal-allocation-valid="personalAllocationValid" :personal-end-valid="personalEndValid" :shift-end-valid="shiftEndValid" :shift-revenue-valid="shiftRevenueValid" :business-end-valid="businessEndValid" @swipe="handleSwipe" @state-authority="onStateAuthority" />
      <WorkSessionForm data-kfe-draft-form="true" :form="form" :busy="busy" :latest-odometer="latestOdometer" :day-start-odometer="dayStartOdometer" :day-business-km="dayBusinessKm" :day-personal-km="dayPersonalKm" :personal-start-odometer="personalStartOdometer" :personal-business-km="personalBusinessKm" :personal-personal-km="personalPersonalKm" :personal-end-odometer="personalEndOdometer" :personal-toll="personalToll" :personal-parking="personalParking" :shift-end-odometer="shiftEndOdometer" :shift-revenue="shiftRevenue" :shift-toll="shiftToll" :shift-parking="shiftParking" :shift-toll-not-included="shiftTollNotIncluded" :shift-parking-not-included="shiftParkingNotIncluded" :shift-end-valid="shiftEndValid" :shift-revenue-valid="shiftRevenueValid" :day-allocation-valid="dayAllocationValid" :personal-allocation-valid="personalAllocationValid" :personal-end-valid="personalEndValid" :business-end-odometer="businessEndOdometer" :business-end-valid="businessEndValid" @update:day-start-odometer="dayStartOdometer=$event" @update:day-business-km="dayBusinessKm=$event" @update:day-personal-km="dayPersonalKm=$event" @update:personal-start-odometer="personalStartOdometer=$event" @update:personal-business-km="personalBusinessKm=$event" @update:personal-personal-km="personalPersonalKm=$event" @update:personal-end-odometer="personalEndOdometer=$event" @update:personal-toll="personalToll=$event" @update:personal-parking="personalParking=$event" @update:shift-end-odometer="shiftEndOdometer=$event" @update:shift-revenue="shiftRevenue=$event" @update:shift-toll="shiftToll=$event" @update:shift-parking="shiftParking=$event" @update:shift-toll-not-included="shiftTollNotIncluded=$event" @update:shift-parking-not-included="shiftParkingNotIncluded=$event" />
      <WorkSessionOverlays :form="form" :busy="busy" :error="error" :end-day-confirm="endDayConfirm" :can-end-day="canEndDay" :unreviewed-ocr-rides="unreviewedOcrRides" :ocr-review-open="ocrReviewOpen" @close-form="closeForm" @confirm-end-day="confirmEndDay" @cancel-end-day="endDayConfirm=false" @open-ocr-review="openOcrReview" @close-ocr-review="ocrReviewOpen=false" />
      <TripEndForm v-if="form === 'PERSONAL_END'" :busy="busy" :latest-odometer="latestOdometer" :start-odometer="activeTrip?.startOdometer" :end-odometer="personalEndOdometer" :toll="personalToll" :parking="personalParking" :valid="personalEndValid" @update:end-odometer="personalEndOdometer=$event" @update:toll="personalToll=$event" @update:parking="personalParking=$event" @cancel="closeForm" @submit="confirmPersonalEnd" />
      <TripEndForm v-if="form === 'BUSINESS_END'" :busy="busy" :latest-odometer="latestOdometer" :start-odometer="activeTrip?.startOdometer" :end-odometer="businessEndOdometer" :valid="businessEndValid" @update:end-odometer="businessEndOdometer=$event" @cancel="closeForm" @submit="confirmBusinessEnd" />
    </template>
  </section>
</template>
