<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import App from '../../../../App.vue'

const NAV = Object.freeze([
  { id: 'Work', label: 'Work' },
  { id: 'Performance', label: 'Performance' },
  { id: 'Timeline', label: 'Timeline' },
  { id: 'Admin', label: 'Admin' },
])

const route = ref(location.hash.slice(1) || 'Work')
const menuOpen = ref(false)

const activeNav = computed(() =>
  NAV.some((item) => item.id === route.value) ? route.value : 'Work',
)

function syncRoute() {
  route.value = location.hash.slice(1) || 'Work'
  if (route.value !== 'Settings') menuOpen.value = false
}

function navigate(path) {
  const next = String(path || 'Work')
  if (location.hash.slice(1) === next) {
    syncRoute()
    return
  }
  location.hash = next
}

function toggleSettings() {
  menuOpen.value = !menuOpen.value
}

function openSettings() {
  menuOpen.value = false
  navigate('Settings')
}

onMounted(() => {
  window.addEventListener('hashchange', syncRoute)
})

onUnmounted(() => {
  window.removeEventListener('hashchange', syncRoute)
})
</script>

<template>
  <div class="driver-shell">
    <header class="driver-header" aria-label="KFE header">
      <span aria-hidden="true"></span>
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
        <button type="button" role="menuitem" @click="openSettings">Backup</button>
        <button type="button" role="menuitem" @click="openSettings">Restore</button>
        <button type="button" role="menuitem" @click="openSettings">Data reset</button>
      </div>
    </header>

    <main class="driver-content">
      <div class="content-surface">
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
:global(*),
:global(*::before),
:global(*::after) {
  box-sizing: border-box;
}

:global(html),
:global(body),
:global(#app),
:global(#vue-runtime) {
  min-height: 100%;
  margin: 0;
}

:global(body) {
  overflow: hidden;
  background: #fff;
  color: #111;
}

.driver-shell {
  min-height: 100dvh;
  padding-top: calc(48px + env(safe-area-inset-top));
  padding-bottom: calc(64px + env(safe-area-inset-bottom));
  overflow: hidden;
  background: #fff;
  color: #111;
}

.driver-header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 12000;
  min-height: calc(48px + env(safe-area-inset-top));
  padding: calc(4px + env(safe-area-inset-top)) 8px 4px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  border-bottom: 1px solid #ddd;
  background: #fff;
}

.settings-button {
  width: 40px;
  height: 40px;
  border: 0;
  padding: 0;
  background: transparent;
  color: #111;
  font: inherit;
  font-size: 1.2rem;
}

.settings-button:focus-visible,
.settings-menu button:focus-visible,
.quick-dock button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: -2px;
}

.settings-menu {
  position: absolute;
  top: calc(48px + env(safe-area-inset-top));
  right: 8px;
  width: 150px;
  display: grid;
  padding: 4px;
  border: 1px solid #ddd;
  background: #fff;
}

.settings-menu button {
  min-height: 42px;
  border: 0;
  border-bottom: 1px solid #eee;
  background: #fff;
  color: #111;
  text-align: left;
  padding: 0 10px;
  font: inherit;
  font-size: .85rem;
}

.settings-menu button:last-child {
  border-bottom: 0;
}

.driver-content {
  height: calc(100dvh - 48px - 64px);
  overflow: hidden;
}

.content-surface {
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

:deep(.kfe-topbar),
:deep(.kfe-bottom-nav) {
  display: none !important;
}

:deep(.kfe-shell) {
  min-height: 0 !important;
  height: 100% !important;
  overflow: hidden;
}

:deep(.kfe-viewport) {
  min-height: 0 !important;
  height: 100% !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
}

:deep(.kfe-workspace) {
  padding-bottom: 0 !important;
}

.quick-dock {
  position: fixed;
  inset: auto 0 0;
  z-index: 12000;
  min-height: calc(64px + env(safe-area-inset-bottom));
  padding: 6px 8px calc(6px + env(safe-area-inset-bottom));
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  border-top: 1px solid #ddd;
  background: #fff;
}

.quick-dock button {
  min-height: 48px;
  border: 0;
  background: transparent;
  color: #555;
  font: inherit;
  font-size: .78rem;
}

.quick-dock button.active {
  color: #111;
  font-weight: 700;
}
</style>
