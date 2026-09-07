<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { kfePresentationApi } from '../presentation/application/presentation-api.js'
import { createUiCommand } from '../../js/application/ui-contract.js'

const props = defineProps({
  vehicleId: { type: [String, Number], default: '—' },
})

const currentState = ref('DAY_START')
const latestOdometer = ref(null)
const activeShift = ref(null)
const activeTrip = ref(null)
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const staged = ref(false)
let refreshTimer = null

const stateLabel = computed(() => ({
  DAY_START: 'Day Start',
  SHIFT_WAITING: 'Shift Waiting',
  SHIFT: 'Shift Active',
  BUSINESS_TRIP: 'Business Trip',
  PERSONAL_TRIP: 'Personal Trip',
  DAY_ENDED: 'Day Ended',
}[currentState.value] || currentState.value))

const tripState = computed(() => {
  if (activeTrip.value?.trip_type === 'PERSONAL') return 'PERSONAL_TRIP'
  if (activeTrip.value?.trip_type === 'BUSINESS') return 'BUSINESS_TRIP'
  return null
})

const projectedState = computed(() => tripState.value || (staged.value ? 'SHIFT_WAITING' : currentState.value))

const stateCard = computed(() => ({
  DAY_START: {
    title: 'Day Start',
    text: 'Start the operating day or record personal vehicle use.',
    actions: [
      { key: 'START_PERSONAL_TRIP', label: 'Personal Trip', kind: 'secondary' },
      { key: 'START_SHIFT', label: 'Start Shift', kind: 'primary' },
    ],
  },
  SHIFT_WAITING: {
    title: 'Shift Waiting',
    text: 'Odometer gap verification is handled by the operating engine before shift confirmation.',
    actions: [
      { key: 'START_PERSONAL_TRIP', label: 'Personal Trip', kind: 'secondary' },
      { key: 'CANCEL_SHIFT_STAGING', label: 'Cancel', kind: 'secondary' },
      { key: 'START_SHIFT', label: 'Confirm Start Shift', kind: 'primary' },
    ],
  },
  SHIFT: {
    title: 'Shift',
    text: 'The business shift is active. Start a business trip or finish the shift.',
    actions: [
      { key: 'START_TRIP', label: 'Business Trip', kind: 'primary' },
      { key: 'END_SHIFT', label: 'End Shift', kind: 'secondary' },
    ],
  },
  BUSINESS_TRIP: {
    title: 'Business Trip',
    text: 'A business trip is active.',
    actions: [
      { key: 'END_TRIP', label: 'End Business Trip', kind: 'primary' },
    ],
  },
  PERSONAL_TRIP: {
    title: 'Personal Trip',
    text: 'Personal vehicle use is active.',
    actions: [
      { key: 'END_PERSONAL_TRIP', label: 'End Personal Trip', kind: 'primary' },
    ],
  },
  DAY_ENDED: {
    title: 'Day Ended',
    text: 'The operating day is closed.',
    actions: [
      { key: 'BACK_TO_SHIFT', label: 'Back', kind: 'secondary' },
      { key: 'START_DAY', label: 'Confirm', kind: 'primary' },
    ],
  },
}[projectedState.value] || {
  title: 'Work',
  text: 'Waiting for the authoritative work state.',
  actions: [{ key: 'RETRY', label: 'Refresh', kind: 'primary' }],
}))

function formatOdometer(value) {
  if (value === null || value === undefined || value === '') return '—'
  const number = Number(value)
  return Number.isFinite(number) ? `${number.toLocaleString()} km` : '—'
}

async function loadState() {
  try {
    const state = await kfePresentationApi.getWorkState()
    currentState.value = state?.screen_state || state?.state || 'DAY_START'
    activeShift.value = state?.active_shift || null
    activeTrip.value = state?.active_trip || null

    const model = await kfePresentationApi.getWorkScreenState()
    latestOdometer.value = model?.latestOdometer ?? model?.latest_odometer ?? null

    if (!activeTrip.value && currentState.value !== 'SHIFT_WAITING') staged.value = false
  } catch (cause) {
    error.value = String(cause?.message || cause || 'Unable to load Work state')
  } finally {
    loading.value = false
  }
}

async function dispatchAction(action) {
  error.value = ''

  if (action === 'CANCEL_SHIFT_STAGING') {
    staged.value = false
    return
  }

  if (action === 'BACK_TO_SHIFT') {
    currentState.value = 'SHIFT'
    return
  }

  if (action === 'RETRY') {
    await loadState()
    return
  }

  const type = action === 'START_PERSONAL_TRIP'
    ? 'START_PERSONAL_TRIP'
    : action === 'END_PERSONAL_TRIP'
      ? 'END_PERSONAL_TRIP'
      : action === 'START_TRIP'
        ? 'START_TRIP'
        : action === 'END_TRIP'
          ? 'END_TRIP'
          : action

  const payload = {}

  if (type === 'START_PERSONAL_TRIP' || type === 'START_TRIP') {
    payload.start_odometer_km = Number(latestOdometer.value)
    payload.odometer = Number(latestOdometer.value)
    payload.trip_type = type === 'START_PERSONAL_TRIP' ? 'PERSONAL' : 'BUSINESS'
    if (type === 'START_TRIP') payload.shift_id = activeShift.value?.shift_id
  }

  if (type === 'END_TRIP' || type === 'END_PERSONAL_TRIP') {
    payload.trip_id = activeTrip.value?.trip_id
    payload.trip_type = type === 'END_PERSONAL_TRIP' ? 'PERSONAL' : 'BUSINESS'
    payload.end_odometer_km = Number(latestOdometer.value)
    payload.endOdometer = Number(latestOdometer.value)
  }

  if (type === 'START_SHIFT' && projectedState.value === 'DAY_START') {
    staged.value = true
    currentState.value = 'SHIFT_WAITING'
    return
  }

  busy.value = true
  try {
    await kfePresentationApi.dispatch(createUiCommand(type, payload))
    staged.value = false
    await loadState()
  } catch (cause) {
    error.value = String(cause?.message || cause || 'Work command failed')
  } finally {
    busy.value = false
  }
}

onMounted(() => {
  void loadState()
  refreshTimer = window.setInterval(() => void loadState(), 5000)
})

onUnmounted(() => {
  if (refreshTimer) window.clearInterval(refreshTimer)
})
</script>

<template>
  <section class="work-canvas" aria-label="Work">
    <header class="work-header">
      <div class="state-block">
        <span class="state-caption">STATE</span>
        <strong class="state-badge" :data-state="projectedState">{{ stateLabel }}</strong>
      </div>

      <div class="vehicle-block">
        <span>Vehicle</span>
        <strong>{{ props.vehicleId }}</strong>
      </div>

      <div class="odometer-block">
        <span>Odometer</span>
        <strong>{{ formatOdometer(latestOdometer) }}</strong>
      </div>
    </header>

    <main class="work-main">
      <div v-if="loading" class="state-card">
        <p>Loading Work state…</p>
      </div>

      <div v-else class="state-card" :data-state="projectedState">
        <span class="state-index">{{ projectedState }}</span>
        <h1>{{ stateCard.title }}</h1>
        <p>{{ stateCard.text }}</p>

        <div v-if="activeShift" class="raw-data">
          <span>Shift</span>
          <strong>{{ activeShift.shift_id || 'Active' }}</strong>
        </div>

        <div v-if="activeTrip" class="raw-data">
          <span>Active trip</span>
          <strong>{{ activeTrip.trip_id || 'Active' }}</strong>
        </div>

        <div v-if="error" class="error-card" role="alert">
          {{ error }}
        </div>
      </div>
    </main>

    <footer class="action-bar" aria-label="Work actions">
      <button
        v-for="action in stateCard.actions"
        :key="action.key"
        :data-kfe-action="action.key"
        type="button"
        :class="action.kind === 'primary' ? 'primary-action' : 'secondary-action'"
        :disabled="busy"
        @click="dispatchAction(action.key)"
      >
        {{ action.label }}
      </button>
    </footer>

    <nav class="bottom-nav" aria-label="Work modules">
      <button type="button" :data-kfe-action="'select-work'" aria-current="page">Work</button>
      <button type="button" :data-kfe-action="'select-fleet'">Fleet</button>
      <button type="button" :data-kfe-action="'select-expenses'">Expenses</button>
    </nav>
  </section>
</template>

<style scoped>
.work-canvas{min-height:100dvh;display:flex;flex-direction:column;padding:16px 16px calc(148px + env(safe-area-inset-bottom));box-sizing:border-box}.work-header{display:grid;grid-template-columns:1fr auto auto;gap:12px;align-items:center;padding:8px 0 16px}.state-block,.vehicle-block,.odometer-block{display:flex;flex-direction:column;gap:3px;min-width:0}.state-caption,.vehicle-block span,.odometer-block span{font-size:.7rem;opacity:.6;text-transform:uppercase;letter-spacing:.08em}.state-badge{width:max-content;padding:5px 9px;border:1px solid currentColor;border-radius:999px;font-size:.8rem}.vehicle-block,.odometer-block{text-align:right}.vehicle-block strong,.odometer-block strong{font-size:.9rem}.work-main{width:100%;max-width:760px;flex:1;margin:0 auto;display:flex;align-items:flex-start}.state-card{width:100%;padding:22px;border:1px solid rgba(127,127,127,.22);border-radius:18px;box-sizing:border-box}.state-index{font-size:.7rem;opacity:.55;letter-spacing:.1em}.state-card h1{margin:8px 0}.state-card p{margin:0;line-height:1.5;opacity:.72}.raw-data{display:flex;justify-content:space-between;gap:12px;margin-top:16px;padding:12px;border-radius:12px;background:rgba(127,127,127,.08)}.raw-data span{opacity:.6}.error-card{margin-top:16px;padding:12px;border-radius:12px;border:1px solid currentColor}.action-bar{position:fixed;left:12px;right:12px;bottom:calc(74px + env(safe-area-inset-bottom));z-index:20;display:flex;gap:8px;max-width:760px;margin:auto}.action-bar button{flex:1;min-height:52px;border-radius:13px;padding:10px 12px;border:1px solid rgba(127,127,127,.22);font:inherit;font-weight:700}.primary-action{background:var(--kfe-ui-accent,#111);color:var(--kfe-ui-accent-text,#fff)}.secondary-action{background:var(--kfe-ui-surface,#fff);color:inherit}.action-bar button:disabled{opacity:.5}.bottom-nav{position:fixed;left:0;right:0;bottom:0;z-index:19;display:grid;grid-template-columns:repeat(3,1fr);padding:8px 12px max(8px,env(safe-area-inset-bottom));background:var(--kfe-ui-surface,#fff);border-top:1px solid rgba(127,127,127,.2)}.bottom-nav button{min-height:48px;border:0;background:transparent;color:inherit;font:inherit;font-weight:700}.bottom-nav button[aria-current="page"]{font-weight:900}@media(max-width:560px){.work-header{grid-template-columns:1fr 1fr}.odometer-block{grid-column:1/-1;text-align:left}.action-bar{flex-wrap:wrap}.action-bar button{min-width:calc(50% - 4px)}.work-canvas{padding-left:12px;padding-right:12px}}
</style>
