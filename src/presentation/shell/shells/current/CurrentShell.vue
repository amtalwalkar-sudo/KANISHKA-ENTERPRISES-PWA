<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import App from '../../../../App.vue';
import { kfePresentationApi } from '../../../application/presentation-api.js'

const NAV = Object.freeze([
  { id: 'Performance', label: 'Performance' },
  { id: 'Work', label: 'Work' },
  { id: 'Admin', label: 'Admin' },
])

const route = ref(location.hash.slice(1) || 'Performance')
const menuOpen = ref(false)
const busy = ref(false)
const error = ref('')
const fileInput = ref(null)

const activeNav = computed(() => NAV.some((item) => item.id === route.value) ? route.value : 'Performance')

function syncRoute() { route.value = location.hash.slice(1) || 'Performance' }
function navigate(path) {
  menuOpen.value = false
  const next = String(path || 'Performance')
  if (location.hash.slice(1) === next) { syncRoute(); return }
  location.hash = next
}
function toggleSettings() { error.value = ''; menuOpen.value = !menuOpen.value }
async function backup() {
  busy.value = true; error.value = ''
  try {
    const payload = await kfePresentationApi.exportBackup()
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a'); anchor.href = url
    anchor.download = `kfe-backup-${new Date().toISOString().slice(0, 10)}.json`; anchor.click()
    URL.revokeObjectURL(url); menuOpen.value = false
  } catch (e) { error.value = `Backup failed: ${String(e?.message || e)}` }
  finally { busy.value = false }
}
function requestRestore() { if (!busy.value) fileInput.value?.click() }
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
onMounted(() => window.addEventListener('hashchange', syncRoute))
onUnmounted(() => window.removeEventListener('hashchange', syncRoute))
</script>

<template>
  <div class="app-shell driver-shell" data-framework="vue">
    <header class="tier-header driver-header" aria-label="KFE header">
      <span class="app-title">KFE 2.0</span>
      <div id="target-tab" aria-label="Target placeholder">Target: Active</div>
      <button class="settings-button" type="button" aria-label="Settings" :aria-expanded="menuOpen" aria-controls="settings-menu" @click="toggleSettings"><span aria-hidden="true">☰</span></button>
      <div v-if="menuOpen" id="settings-menu" class="settings-menu" role="menu">
        <button type="button" role="menuitem" :disabled="busy" @click="backup">Backup</button>
        <button type="button" role="menuitem" :disabled="busy" @click="requestRestore">Restore</button>
        <button type="button" role="menuitem" :disabled="busy" @click="resetData">Data reset</button>
      </div>
      <input ref="fileInput" hidden type="file" accept="application/json,.json" @change="restore">
    </header>
    <div class="tier-action-bar" aria-label="Quick actions">
      <button id="fuel-btn" type="button" aria-label="Fuel entry placeholder">Fuel</button>
    </div>
    <main id="work-viewport" class="driver-content" aria-label="KFE work viewport">
      <App />
    </main>
    <nav class="tier-bottom-nav quick-dock" aria-label="Primary navigation">
      <button v-for="item in NAV" :key="item.id" type="button" :class="{ active: activeNav === item.id }" :aria-current="activeNav === item.id ? 'page' : undefined" @click="navigate(item.id)">{{ item.label }}</button>
    </nav>
  </div>
</template>

<style scoped>
:global(*), :global(*::before), :global(*::after) { box-sizing: border-box; }
:global(html), :global(body), :global(#app), :global(#vue-runtime) { width: 100%; min-height: 100%; margin: 0; }
:global(body) { overflow: hidden; background: var(--kfe-ui-bg); color: var(--kfe-ui-text); }
.app-shell { min-width: 0; }
.settings-button { width: 40px; height: 40px; min-width: 40px; min-height: 40px; border: 0; padding: 0; background: transparent; color: var(--kfe-ui-text); font: inherit; font-size: 1.2rem; flex-shrink: 0; }
.settings-button:focus-visible, .settings-menu button:focus-visible { outline: 2px solid currentColor; outline-offset: -2px; }
.settings-menu { position: absolute; top: calc(var(--safe-area-top) + var(--tier-header-height) - 1px); right: 8px; z-index: 12000; width: 150px; display: grid; padding: 4px; border: 1px solid var(--kfe-ui-border); border-radius: 12px; background: var(--kfe-ui-surface); color: var(--kfe-ui-text); box-shadow: var(--kfe-ui-shadow); }
.settings-menu button { min-height: 42px; border: 0; border-bottom: 1px solid var(--kfe-ui-border); background: transparent; color: inherit; text-align: left; padding: 0 10px; font: inherit; font-size: .85rem; }
.settings-menu button:last-child { border-bottom: 0; }
.settings-menu button:disabled { opacity: .5; }
:deep(.kfe-shell) { min-height: 0 !important; height: 100% !important; overflow: hidden; }
:deep(.kfe-viewport) { min-height: 0 !important; height: 100% !important; overflow-y: auto !important; overflow-x: hidden; }
:deep(.kfe-workspace) { min-height: 0 !important; }
</style>
