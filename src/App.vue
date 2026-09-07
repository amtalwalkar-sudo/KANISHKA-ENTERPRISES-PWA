<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import './styles/ui-tokens.css'
import './styles/shell.css'
import './styles/forms.css'
import './styles/kfe2-shell.css'
import { kfePresentationApi } from './presentation/application/presentation-api.js'
import PerformanceModuleView from './components/PerformanceModuleView.vue'
import AdminModuleView from './components/AdminModuleView.vue'

const activeModule = ref('Work')
const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
const performanceModel = ref(null)

function syncRoute() {
  const next = location.hash.slice(1)
  activeModule.value = ['Work', 'Performance', 'Timeline', 'Admin'].includes(next) ? next : 'Work'
}

async function loadPerformance() {
  try {
    performanceModel.value = await kfePresentationApi.read.getPerformance()
  } catch (error) {
    performanceModel.value = { error: String(error?.message || error) }
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
        <div v-if="activeModule === 'Work'" class="empty-module" aria-label="Work" />
        <PerformanceModuleView
          v-else-if="activeModule === 'Performance'"
          :online="online"
          :performance="performanceModel"
        />
        <div v-else-if="activeModule === 'Timeline'" class="empty-module" aria-label="Timeline" />
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
.empty-module { width: 100%; min-height: 100%; height: 100%; }
</style>
