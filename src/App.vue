<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import './styles/ui-tokens.css'
import './styles/shell.css'
import './styles/forms.css'
import './styles/kfe2-shell.css'
import { kfePresentationApi } from './presentation/application/presentation-api.js'
import PerformanceModuleView from './components/PerformanceModuleView.vue'
import KfeTimelineView from './components/KfeTimelineView.vue'
import AdminModuleView from './components/AdminModuleView.vue'

const activeModule = ref('Work')
const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
const performanceModel = ref(null)
const timelineModel = ref(null)

function syncRoute() {
  const next = location.hash.slice(1)
  activeModule.value = ['Work', 'Performance', 'Timeline', 'Admin'].includes(next) ? next : 'Work'
  if (activeModule.value === 'Timeline') void loadTimeline()
}

async function loadPerformance() {
  try {
    performanceModel.value = await kfePresentationApi.read.getPerformance()
  } catch (error) {
    performanceModel.value = { error: String(error?.message || error) }
  }
}

async function loadTimeline() {
  try {
    timelineModel.value = await kfePresentationApi.read.getTimeline('Day')
  } catch (error) {
    timelineModel.value = { events: [], error: String(error?.message || error) }
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
})

onUnmounted(() => {
  window.removeEventListener('hashchange', syncRoute)
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<template>
  <div class="kfe-shell" data-framework="vue">
    <main class="kfe-viewport">
      <section class="kfe-workspace" aria-live="polite">
        <div v-if="activeModule === 'Work'" class="empty-module" aria-label="Work presentation not wired">
          Work presentation is temporarily disconnected. The Work lifecycle remains available for a future presentation rewire.
        </div>
        <PerformanceModuleView
          v-else-if="activeModule === 'Performance'"
          :online="online"
          :performance="performanceModel"
        />
        <KfeTimelineView
          v-else-if="activeModule === 'Timeline'"
          horizon="Day"
          :events="timelineModel?.events || []"
        />
        <AdminModuleView
          v-else-if="activeModule === 'Admin'"
          :application="kfePresentationApi"
          :online="online"
        />
      </section>
    </main>
  </div>
</template>

<style scoped>
.kfe-shell { min-height: 100%; height: 100%; }
.kfe-viewport { min-height: 100%; height: 100%; }
.kfe-workspace { width: 100%; min-height: 100%; height: 100%; }
</style>
