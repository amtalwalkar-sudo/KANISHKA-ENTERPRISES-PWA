<script setup>
import { computed, markRaw, onErrorCaptured, onMounted, ref } from 'vue'
import { kfePresentationApi } from '@/presentation/application/presentation-api.js'
import WorkModuleView from '@/components/WorkModuleView.vue'
import PerformanceModuleRole from '@/components/PerformanceModuleRole.vue'
import AdminModuleView from '@/components/AdminModuleView.vue'

const NAV = [
  { id: 'Work', label: 'Work', component: markRaw(WorkModuleView) },
  { id: 'Performance', label: 'Performance', component: markRaw(PerformanceModuleRole) },
  { id: 'Admin', label: 'Admin', component: markRaw(AdminModuleView) },
]

// Manage navigation state locally to avoid hash routing conflicts
const currentTab = ref('Work')
const busy = ref(false)
const error = ref('')
const renderError = ref('')
const performanceModel = ref(null)
const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
const fileInput = ref(null)

const activeItem = computed(() => NAV.find((item) => item.id === currentTab.value) || NAV[0])

onErrorCaptured((err) => {
  renderError.value = `Component Error: ${err.message}`
  return false
})

function navigate(id) {
  currentTab.value = id
}

async function loadPerformance() {
  try {
    if (kfePresentationApi?.read?.getPerformance) {
      performanceModel.value = await kfePresentationApi.read.getPerformance()
    }
  } catch (e) {
    performanceModel.value = { error: String(e?.message || e) }
  }
}

function requestRestore() {
  if (!busy.value) fileInput.value?.click()
}

async function backup() {
  busy.value = true; error.value = ''
  try {
    const payload = await kfePresentationApi.exportBackup()
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url; anchor.download = `kfe-backup-${new Date().toISOString().slice(0, 10)}.json`; anchor.click()
    URL.revokeObjectURL(url)
  } catch (e) { error.value = `Backup failed: ${String(e?.message || e)}` }
  finally { busy.value = false }
}

async function restore(event) {
  const file = event.target.files?.[0]; event.target.value = ''; if (!file) return
  busy.value = true; error.value = ''
  try {
    const payload = JSON.parse(await file.text())
    if (!payload || typeof payload !== 'object') throw new Error('This is not a valid KFE backup.')
    if (!confirm('Restore this backup? Existing local ERP data will be replaced.')) return
    await kfePresentationApi.restoreBackup(payload); location.reload()
  } catch (e) { error.value = `Restore failed: ${String(e?.message || e)}` }
  finally { busy.value = false }
}

async function resetData() {
  if (!confirm('RESET ALL KFE DATA? This permanently removes local ERP records from this device.')) return
  if (!confirm('Final confirmation: erase all local ERP data?')) return
  busy.value = true; error.value = ''
  try { await kfePresentationApi.resetAllData(); location.reload() }
  catch (e) { error.value = `Reset failed: ${String(e?.message || e)}`; busy.value = false }
}

onMounted(() => {
  void loadPerformance()
})
</script>

<template>
  <div class="shell-container">
    <header class="global-header">
      <span class="app-title">KFE ERP</span>
      <div class="header-actions">
        <button type="button" :disabled="busy" @click="backup">Backup</button>
        <button type="button" :disabled="busy" @click="requestRestore">Restore</button>
        <button type="button" class="btn-danger-subtle" :disabled="busy" @click="resetData">Reset</button>
      </div>
      <input ref="fileInput" hidden type="file" accept="application/json,.json" @change="restore">
    </header>

    <main class="module-stage">
      <p v-if="error || renderError" class="shell-error" role="alert">
        {{ error || renderError }}
      </p>

      <div class="scroll-container">
        <component
          :is="activeItem.component"
          :performance="performanceModel"
          :application="kfePresentationApi"
          :online="online"
        />
      </div>
    </main>

    <nav class="quick-dock" aria-label="Primary navigation">
      <button
        v-for="item in NAV"
        :key="item.id"
        type="button"
        :class="{ active: activeItem.id === item.id }"
        @click="navigate(item.id)"
      >
        {{ item.label }}
      </button>
    </nav>
  </div>
</template>

<style scoped>
:global(*), :global(*::before), :global(*::after) { box-sizing: border-box; }
:global(html), :global(body), :global(#app) { height: 100%; margin: 0; padding: 0; overflow: hidden; font-family: system-ui, -apple-system, sans-serif; }

.shell-container {
  --bg-app: #f8fafc;
  --bg-surface: #ffffff;
  --bg-active: #eff6ff;
  --border-color: #e2e8f0;
  --text-main: #0f172a;
  --text-muted: #64748b;
  --color-primary: #2563eb;
  --color-danger: #dc2626;
  --header-height: 48px;
  --dock-height: 56px;

  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: 100vw;
  overflow: hidden;
  background: var(--bg-app);
  color: var(--text-main);
}

.global-header {
  height: var(--header-height);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
  z-index: 100;
}

.app-title { font-weight: 700; font-size: 0.9rem; }
.header-actions { display: flex; gap: 6px; }
.header-actions button {
  padding: 5px 9px;
  border: 1px solid var(--border-color);
  background: var(--bg-surface);
  color: var(--text-main);
  border-radius: 5px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}
.header-actions button.btn-danger-subtle {
  color: var(--color-danger);
  border-color: #fca5a5;
  background: #fef2f2;
}

.module-stage {
  flex: 1;
  height: calc(100dvh - var(--header-height) - var(--dock-height));
  width: 100%;
  position: relative;
  overflow: hidden;
}

.scroll-container {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 16px;
  background-color: var(--bg-app);
}

.quick-dock {
  height: var(--dock-height);
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background: var(--bg-surface);
  border-top: 1px solid var(--border-color);
  z-index: 100;
}

.quick-dock button {
  border: none;
  background: transparent;
  font-size: 0.85rem;
  color: var(--text-muted);
  font-weight: 600;
  cursor: pointer;
}

.quick-dock button.active {
  color: var(--color-primary);
  background: var(--bg-active);
  border-top: 2px solid var(--color-primary);
}

.shell-error {
  position: absolute; top: 8px; left: 8px; right: 8px; z-index: 1000;
  padding: 8px 12px; background: #fee2e2; color: #991b1b; border-radius: 6px; font-size: 0.8rem;
}
</style>
