<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import './styles/ui-tokens.css'
import './styles/shell.css'
import './styles/forms.css'
import './styles/kfe2-shell.css'
import { kfePresentationApi } from './presentation/application/presentation-api.js'
import PerformanceModuleView from './components/PerformanceModuleView.vue'
import AdminModuleView from './components/AdminModuleView.vue'
import ShiftWaitingCard from './presentation/ShiftWaitingCard.vue'
import PersonalTripCard from './presentation/PersonalTripCard.vue'
import BusinessTripCard from './presentation/BusinessTripCard.vue'
import ShiftCard from './presentation/ShiftCard.vue'
import DayEndCard from './presentation/DayEndCard.vue'

const activeModule = ref('Performance')
const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
const performanceModel = ref(null)
const currentWorkState = ref(null)
const personalTripMetrics = ref(null)
const businessTripMetrics = ref(null)
const shiftMetrics = ref(null)
const dayEndSummary = ref(null)

function syncRoute() {
  const next = location.hash.slice(1)
  activeModule.value = ['Performance', 'Admin'].includes(next) ? next : 'Performance'
}

async function loadPerformance() {
  try {
    performanceModel.value = await kfePresentationApi.read.getPerformance()
  } catch (error) {
    performanceModel.value = { error: String(error?.message || error) }
  }
}

async function refreshWorkState() {
  const nextState = await kfePresentationApi.read.getWorkScreenState()
  currentWorkState.value = nextState

  if (nextState === 'SHIFT') {
    const shift = await kfePresentationApi.read.getActiveShift()
    const startedAtEpochMs = Date.parse(String(shift?.started_at || ''))
    shiftMetrics.value = shift
      ? {
          shiftId: shift.id,
          startOdometer: shift.start_odometer,
          startedAtEpochMs: Number.isFinite(startedAtEpochMs) ? startedAtEpochMs : null,
        }
      : null
    personalTripMetrics.value = null
    businessTripMetrics.value = null
    dayEndSummary.value = null
  } else if (nextState === 'PERSONAL_TRIP') {
    const draft = await kfePresentationApi.read.getActiveTripDraft()
    const startTimeEpochMs = Date.parse(String(draft?.started_at || ''))
    personalTripMetrics.value = draft
      ? {
          startOdometer: draft.start_odometer_km,
          startTimeEpochMs: Number.isFinite(startTimeEpochMs) ? startTimeEpochMs : null,
        }
      : null
    shiftMetrics.value = null
    businessTripMetrics.value = null
    dayEndSummary.value = null
  } else if (nextState === 'BUSINESS_TRIP') {
    const draft = await kfePresentationApi.read.getActiveTripDraft()
    const startTimeEpochMs = Date.parse(String(draft?.started_at || ''))
    businessTripMetrics.value = draft
      ? {
          startOdometer: draft.start_odometer_km,
          startTimeEpochMs: Number.isFinite(startTimeEpochMs) ? startTimeEpochMs : null,
        }
      : null
    shiftMetrics.value = null
    personalTripMetrics.value = null
    dayEndSummary.value = null
  } else if (nextState === 'SHIFT_WAITING' || nextState === 'DAY_ENDED') {
    dayEndSummary.value = await kfePresentationApi.read.getWorkSummary()
    shiftMetrics.value = null
    personalTripMetrics.value = null
    businessTripMetrics.value = null
  } else {
    shiftMetrics.value = null
    personalTripMetrics.value = null
    businessTripMetrics.value = null
    dayEndSummary.value = null
  }
}

async function loadWorkState() {
  try {
    await refreshWorkState()
  } catch {
    currentWorkState.value = null
    shiftMetrics.value = null
    personalTripMetrics.value = null
    businessTripMetrics.value = null
    dayEndSummary.value = null
  }
}

async function handleStartShift() {
  try {
    const latest = await kfePresentationApi.read.latestWorkOdometer()
    const odometer = Number(latest?.odometer)
    if (!Number.isFinite(odometer) || odometer < 0) {
      throw new Error('Authoritative start odometer is unavailable')
    }

    await kfePresentationApi.commands.startShift({
      startOdometer: odometer,
    })
    await refreshWorkState()
  } catch (error) {
    console.error('Failed to start shift:', error)
  }
}

async function handleStartBusinessTrip() {
  try {
    const latest = await kfePresentationApi.read.latestWorkOdometer()
    const odometer = Number(latest?.odometer)
    if (!Number.isFinite(odometer) || odometer < 0) {
      throw new Error('Authoritative start odometer is unavailable')
    }

    await kfePresentationApi.commands.startTrip({
      trip_type: 'BUSINESS',
      start_odometer_km: odometer,
    })
    await refreshWorkState()
  } catch (error) {
    console.error('Failed to start business trip:', error)
  }
}

async function handleStartPersonalTrip() {
  try {
    const latest = await kfePresentationApi.read.latestWorkOdometer()
    const odometer = Number(latest?.odometer)
    if (!Number.isFinite(odometer) || odometer < 0) {
      throw new Error('Authoritative start odometer is unavailable')
    }

    await kfePresentationApi.commands.startTrip({
      trip_type: 'PERSONAL',
      start_odometer_km: odometer,
    })
    await refreshWorkState()
  } catch (error) {
    console.error('Failed to start personal trip:', error)
  }
}

async function handleEndShift() {
  try {
    const [shift, latest] = await Promise.all([
      kfePresentationApi.read.getActiveShift(),
      kfePresentationApi.read.latestWorkOdometer(),
    ])
    const endOdometer = Number(latest?.odometer)
    if (!shift?.id || !Number.isFinite(endOdometer) || endOdometer < 0) {
      throw new Error('Active shift or authoritative end odometer is unavailable')
    }

    await kfePresentationApi.commands.endShift({
      id: shift.id,
      endOdometer,
    })
    await refreshWorkState()
  } catch (error) {
    console.error('Failed to end shift:', error)
  }
}

async function handleEndBusinessTrip() {
  try {
    const [draft, latest] = await Promise.all([
      kfePresentationApi.read.getActiveTripDraft(),
      kfePresentationApi.read.latestWorkOdometer(),
    ])
    const endOdometer = Number(latest?.odometer)
    if (!draft?.trip_id || !Number.isFinite(endOdometer) || endOdometer < 0) {
      throw new Error('Active business trip or authoritative end odometer is unavailable')
    }

    await kfePresentationApi.commands.endTrip({
      trip_type: 'BUSINESS',
      trip_id: draft.trip_id,
      end_odometer_km: endOdometer,
    })
    await refreshWorkState()
  } catch (error) {
    console.error('Failed to end business trip:', error)
  }
}

async function handleEndPersonalTrip() {
  try {
    const [draft, latest] = await Promise.all([
      kfePresentationApi.read.getActiveTripDraft(),
      kfePresentationApi.read.latestWorkOdometer(),
    ])
    const endOdometer = Number(latest?.odometer)
    if (!draft?.trip_id || !Number.isFinite(endOdometer) || endOdometer < 0) {
      throw new Error('Active personal trip or authoritative end odometer is unavailable')
    }

    await kfePresentationApi.commands.endTrip({
      trip_type: 'PERSONAL',
      trip_id: draft.trip_id,
      end_odometer_km: endOdometer,
    })
    await refreshWorkState()
  } catch (error) {
    console.error('Failed to end personal trip:', error)
  }
}

async function handleEndDay() {
  try {
    await kfePresentationApi.commands.endDay()
    await refreshWorkState()
  } catch (error) {
    console.error('Failed to end day:', error)
  }
}

function handleOnline() { online.value = true }
function handleOffline() { online.value = false }

onMounted(() => {
  syncRoute()
  window.addEventListener('hashchange', syncRoute)
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  void loadPerformance()
  void loadWorkState()
})

onUnmounted(() => {
  window.removeEventListener('hashchange', syncRoute)
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<template>
  <section
    class="kfe-workspace"
    :class="{ 'work-stage': currentWorkState === 'SHIFT_WAITING' || currentWorkState === 'SHIFT' || currentWorkState === 'PERSONAL_TRIP' || currentWorkState === 'BUSINESS_TRIP' || currentWorkState === 'DAY_ENDED' }"
    aria-live="polite"
  >
    <ShiftWaitingCard
      v-if="currentWorkState === 'SHIFT_WAITING' && !dayEndSummary"
      @start-shift="handleStartShift"
      @start-business-trip="handleStartBusinessTrip"
      @start-personal-trip="handleStartPersonalTrip"
    />

    <DayEndCard
      v-else-if="currentWorkState === 'SHIFT_WAITING' || currentWorkState === 'DAY_ENDED'"
      :summary="dayEndSummary"
      :day-ended="currentWorkState === 'DAY_ENDED'"
      @end-day="handleEndDay"
    />

    <ShiftCard
      v-else-if="currentWorkState === 'SHIFT'"
      :shift-metrics="shiftMetrics"
      @end-shift="handleEndShift"
    />

    <PersonalTripCard
      v-else-if="currentWorkState === 'PERSONAL_TRIP'"
      :trip-metrics="personalTripMetrics"
      @end-personal-trip="handleEndPersonalTrip"
    />

    <BusinessTripCard
      v-else-if="currentWorkState === 'BUSINESS_TRIP'"
      :trip-metrics="businessTripMetrics"
      @end-business-trip="handleEndBusinessTrip"
    />

    <template v-else>
      <PerformanceModuleView
        v-if="activeModule === 'Performance'"
        :online="online"
        :performance="performanceModel"
      />
      <AdminModuleView
        v-else-if="activeModule === 'Admin'"
        :application="kfePresentationApi"
        :online="online"
      />
    </template>
  </section>
</template>

<style scoped>
.work-stage {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 12px;
}

@media (max-width: 480px) {
  .work-stage { padding: 10px; }
}
</style>
