<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import App from '../../../../App.vue';

const NAV = Object.freeze([
  { id: 'Work', label: 'Work' },
  { id: 'Performance', label: 'Performance' },
  { id: 'Timeline', label: 'Timeline' },
  { id: 'Admin', label: 'Admin' },
]);

const route = ref(location.hash.slice(1) || 'Work');
const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine);
const driverState = ref('DAY_START');

const activeNav = computed(() =>
  NAV.some((item) => item.id === route.value) ? route.value : 'Work',
);

const stateLabel = computed(() => {
  const labels = {
    DAY_START: 'Day Start',
    SHIFT_WAITING: 'Shift Waiting',
    SHIFT: 'Shift Active',
    BUSINESS_TRIP: 'Business Trip',
    PERSONAL_TRIP: 'Personal Trip',
    DAY_ENDED: 'Day Ended',
  };
  return labels[String(driverState.value || 'DAY_START').toUpperCase()] || 'Day Start';
});

function syncRoute() {
  route.value = location.hash.slice(1) || 'Work';
}

function navigate(path) {
  const next = String(path || 'Work');
  if (location.hash.slice(1) === next) {
    syncRoute();
    return;
  }
  location.hash = next;
}

function handleOnline() {
  online.value = true;
}

function handleOffline() {
  online.value = false;
}

function handleDriverState(event) {
  driverState.value = event?.detail?.state || 'DAY_START';
}

onMounted(() => {
  window.addEventListener('hashchange', syncRoute);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  window.addEventListener('kfe:driver-state', handleDriverState);
});

onUnmounted(() => {
  window.removeEventListener('hashchange', syncRoute);
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  window.removeEventListener('kfe:driver-state', handleDriverState);
});
</script>

<template>
  <div class="driver-shell">
    <header class="driver-header" aria-label="KFE navigation">
      <strong class="header-title">Kanishka Enterprises</strong>
      <span class="header-state" :data-state="driverState">{{ stateLabel }}</span>
      <span class="header-connection" :data-online="online">{{ online ? 'Online' : 'Offline' }}</span>
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
}

.driver-shell {
  min-height: 100dvh;
  padding-top: calc(56px + env(safe-area-inset-top));
  padding-bottom: calc(64px + env(safe-area-inset-bottom));
  overflow: hidden;
}

.driver-header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 12000;
  min-height: calc(56px + env(safe-area-inset-top));
  padding: calc(8px + env(safe-area-inset-top)) 12px 8px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #ccc;
  background: #fff;
  color: #111;
}

.header-title,
.header-state,
.header-connection {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-title {
  font-size: .95rem;
}

.header-state,
.header-connection {
  font-size: .75rem;
}

.driver-content {
  height: calc(100dvh - 56px - 64px);
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
  padding-bottom: 16px !important;
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
  border-top: 1px solid #ccc;
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

.quick-dock button:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: -2px;
}
</style>
