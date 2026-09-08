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

const activeModule = ref('Performance')
const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
const performanceModel = ref(null)
const currentWorkState = ref(null)

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

async function loadWorkState() {
  try {
    currentWorkState.value = await kfePresentationApi.read.getWorkScreenState()
  } catch {
    currentWorkState.value = null
  }
}

function handleStartShift() {}
function handleStartBusinessTrip() {}
function handleStartPersonalTrip() {}
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
    :class="{ 'work-stage': currentWorkState === 'SHIFT_WAITING' }"
    aria-live="polite"
  >
    <ShiftWaitingCard
      v-if="currentWorkState === 'SHIFT_WAITING'"
      @start-shift="handleStartShift"
      @start-business-trip="handleStartBusinessTrip"
      @start-personal-trip="handleStartPersonalTrip"
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
