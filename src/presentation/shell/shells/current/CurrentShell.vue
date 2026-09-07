<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import App from '../../../../App.vue'
import { kfePresentationApi } from '../../../application/presentation-api.js'

const NAV = Object.freeze([
  { id: 'Performance', label: 'Performance' },
  { id: 'Admin', label: 'Admin' },
])

const route = ref(location.hash.slice(1) || 'Performance')
const menuOpen = ref(false)
const busy = ref(false)
const error = ref('')
const fileInput = ref(null)

const activeNav = computed(() => NAV.some((item) => item.id === route.value) ? route.value : 'Performance')

function syncRoute() {
  route.value = location.hash.slice(1) || 'Performance'
}

function navigate(path) {
  menuOpen.value = false
  const next = String(path || 'Performance')
  if (location.hash.slice(1) === next) {
    syncRoute()
    return
  }
  location.hash = next
}

function toggleSettings() {
  error.value = ''
  menuOpen.value = !menuOpen.value
}

async function backup() {
  busy.value = true
  error.value = ''
  try {
    const payload = await kfePresentationApi.exportBackup()
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `kfe-backup-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    menuOpen.value = false
  } catch (e) {
    error.value = `Backup failed: ${String(e?.message || e)}`
  } finally {
    busy.value = false
  }
}

function requestRestore() {
  if (!busy.value) fileInput.value?.click()
}

async function restore(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  busy.value = true
  error.value = ''
  try {
    const payload = JSON.parse(await file.text())
    if (!payload || typeof payload !== 'object') throw new Error('This is not a valid KFE backup.')
    if (!confirm('Restore this backup? Existing local ERP data will be replaced.')) return
    await kfePresentationApi.restoreBackup(payload)
    location.reload()
  } catch (e) {
    error.value = `Restore failed: ${String(e?.message || e)}`
  } finally {
    busy.value = false
  }
}

async function resetData() {
  if (!confirm('RESET ALL KFE DATA? This permanently removes local ERP records from this device.')) return
  if (!confirm('Final confirmation: erase all local ERP data?')) return
  busy.value = true
  error.value = ''
  try {
    await kfePresentationApi.resetAllData()
    location.reload()
  } catch (e) {
    error.value = `Reset failed: ${String(e?.message || e)}`
    busy.value = false
  }
}

onMounted(() => window.addEventListener('hashchange', syncRoute))
onUnmounted(() => window.removeEventListener('hashchange', syncRoute))
</script>

<template>
  <div class="driver-shell">
    <header class="driver-header" aria-label="KFE header">
      <button
        class="settings-button"
        type="button"
        aria-label="Settings"
        :aria-expanded="menuOpen"
        aria-controls="settings-menu"
        @click="toggleSettings"
      >
        <span aria-hidden="true">☰</span>
      </button>
      <div v-if="menuOpen" id="settings-menu" class="settings-menu" role="menu">
        <button type="button" role="menuitem" :disabled="busy" @click="backup">Backup</button>
        <button type="button" role="menuitem" :disabled="busy" @click="requestRestore">Restore</button>
        <button type="button" role="menuitem" :disabled="busy" @click="resetData">Data reset</button>
      </div>
      <input ref="fileInput" hidden type="file" accept="application/json,.json" @change="restore">
    </header>

    <main class="driver-content">
      <div class="content-surface">
        <p v-if="error" class="shell-error" role="alert">{{ error }}</p>
        <App />
      </div>
    </main>

    <nav class="quick-dock" aria-label="Primary navigation">
      <button
        v-for="item in NAV"
        :key="item.id"
        type="button"
        :class="{ active: activeNav === item.id }"
        :aria-current="activeNav === item.id ? 'page' : undefined"
        @click="navigate(item.id)"
      >
        {{ item.label }}
      </button>
    </nav>
  </div>
</template>

<style scoped>
:global(*), :global(*::before), :global(*::after) { box-sizing: border-box; }
:global(html), :global(body), :global(#app), :global(#vue-runtime) { min-height: 100%; margin: 0; }
:global(body) { overflow: hidden; background: #fff; color: #111; }
.driver-shell { min-height: 100dvh; padding-top: calc(48px + env(safe-area-inset-top)); padding-bottom: calc(64px + env(safe-area-inset-bottom)); overflow: hidden; background: #fff; color: #111; }
.driver-header { position: fixed; inset: 0 0 auto; z-index: 12000; min-height: calc(48px + env(safe-area-inset-top)); padding: calc(4px + env(safe-area-inset-top)) 8px 4px; display: flex; justify-content: flex-end; align-items: center; border-bottom: 1px solid #ddd; background: #fff; }
.settings-button { width: 40px; height: 40px; border: 0; padding: 0; background: transparent; color: #111; font: inherit; font-size: 1.2rem; }
.settings-button:focus-visible, .settings-menu button:focus-visible, .quick-dock button:focus-visible { outline: 2px solid currentColor; outline-offset: -2px; }
.settings-menu { position: absolute; top: calc(48px + env(safe-area-inset-top)); right: 8px; width: 150px; display: grid; padding: 4px; border: 1px solid #ddd; background: #fff; }
.settings-menu button { min-height: 42px; border: 0; border-bottom: 1px solid #eee; background: #fff; color: #111; text-align: left; padding: 0 10px; font: inherit; font-size: .85rem; }
.settings-menu button:last-child { border-bottom: 0; }
.settings-menu button:disabled { opacity: .5; }
.driver-content { height: calc(100dvh - 48px - 64px); overflow: hidden; }
.content-surface { width: 100%; height: 100%; min-height: 0; overflow: hidden; }
.shell-error { position: fixed; top: calc(48px + env(safe-area-inset-top)); left: 8px; right: 8px; z-index: 11999; margin: 0; padding: 8px; border: 1px solid #ddd; background: #fff; font-size: .75rem; }
:deep(.kfe-topbar), :deep(.kfe-bottom-nav) { display: none !important; }
:deep(.kfe-shell) { min-height: 0 !important; height: 100% !important; overflow: hidden; }
:deep(.kfe-viewport) { min-height: 0 !important; height: 100% !important; overflow-y: auto !important; overflow-x: hidden !important; }
:deep(.kfe-workspace) { padding-bottom: 0 !important; }
.quick-dock { position: fixed; inset: auto 0 0; z-index: 12000; min-height: calc(64px + env(safe-area-inset-bottom)); padding: 6px 8px calc(6px + env(safe-area-inset-bottom)); display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; border-top: 1px solid #ddd; background: #fff; }
.quick-dock button { min-height: 48px; border: 0; background: transparent; color: #555; font: inherit; font-size: .78rem; }
.quick-dock button.active { color: #111; font-weight: 700; }
</style>
