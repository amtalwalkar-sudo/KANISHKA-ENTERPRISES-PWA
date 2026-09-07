<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import './styles/ui-tokens.css'
import './styles/shell.css'
import './styles/forms.css'
import './styles/kfe2-shell.css'
import { kfePresentationApi } from './presentation/application/presentation-api.js'
import { createUiRouter } from '../js/ui/router.js'
import { createUiState } from '../js/ui/state.js'
import { detectUiCapabilities } from '../js/ui/capabilities.js'
import PerformanceModuleView from './components/PerformanceModuleView.vue'
import AdminModuleView from './components/AdminModuleView.vue'
import KfeSettingsView from './components/KfeSettingsView.vue'

const PRIMARY = ['Work', 'Performance', 'Timeline', 'Admin']
const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
const activeModule = ref('Work')
const performanceModel = ref(null)

const uiRouter = createUiRouter({
  initialPath: 'Work',
  onChange: (path) => {
    if (PRIMARY.includes(path) || path === 'Settings') activeModule.value = path
  },
})
const uiStateModel = createUiState()
const uiCapabilities = detectUiCapabilities()

const current = computed(() => (PRIMARY.includes(activeModule.value) ? activeModule.value : ''))

async function loadPerformance() {
  try {
    performanceModel.value = await kfePresentationApi?.read?.getPerformance?.() || null
  } catch (error) {
    performanceModel.value = { error: String(error?.message || error) }
  }
}

function navigate(path) {
  const next = PRIMARY.includes(path) ? path : 'Work'
  activeModule.value = next
  uiStateModel.set('READY')
  if (uiRouter.route !== next) uiRouter.navigate(next)
  if (next === 'Performance') void loadPerformance()
}

function handleOnline() {
  online.value = true
}

function handleOffline() {
  online.value = false
}

onMounted(() => {
  online.value = uiCapabilities.online
  uiStateModel.set('READY')
  uiRouter.start()
  void loadPerformance()
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})

onUnmounted(() => {
  uiRouter.stop()
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
        <KfeSettingsView
          v-else-if="activeModule === 'Settings'"
          :application="kfePresentationApi"
        />
      </section>
    </main>

    <nav class="kfe-bottom-nav" aria-label="Primary navigation">
      <button
        v-for="item in PRIMARY"
        :key="item"
        type="button"
        :aria-current="current === item ? 'page' : undefined"
        @click="navigate(item)"
      >
        {{ item }}
      </button>
    </nav>
  </div>
</template>

<style scoped>
.kfe-shell {
  min-height: 100%;
}

.kfe-viewport {
  min-height: 100%;
}

.kfe-workspace {
  width: 100%;
  min-height: 100%;
  padding-bottom: 80px;
}

.empty-module {
  width: 100%;
  min-height: 100%;
}
</style>
