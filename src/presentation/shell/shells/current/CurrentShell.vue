<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import App from '../../../../App.vue';
import WorkBreakControl from '../../../../components/WorkBreakControl.vue';

const NAV = Object.freeze([
  { id: 'Work', label: 'Work', icon: '⌂' },
  { id: 'Performance', label: 'Performance', icon: '◈' },
  { id: 'Timeline', label: 'Timeline', icon: '◷' },
  { id: 'Admin', label: 'Admin', icon: '▦' },
]);

const route = ref(location.hash.slice(1) || 'Work');
const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine);
const darkMode = ref(true);
const menuOpen = ref(false);
const showWorkBreak = ref(route.value === 'Work' || route.value === '');
const reducedMotion = ref(false);
const ambientLightAvailable = ref(false);

const activeNav = computed(() => NAV.some(item => item.id === route.value) ? route.value : 'Work');
const connectionLabel = computed(() => online.value ? 'ONLINE' : 'OFFLINE');

function syncRoute() {
  route.value = location.hash.slice(1) || 'Work';
  showWorkBreak.value = route.value === 'Work' || route.value === '';
  menuOpen.value = false;
}

function navigate(path) {
  const next = String(path || 'Work');
  if (location.hash.slice(1) === next) {
    syncRoute();
    return;
  }
  location.hash = next;
}

function goBack() {
  if (history.length > 1) history.back();
  else navigate('Work');
}

function vibrate(pattern = 10) {
  try {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  } catch {}
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
  vibrate(8);
}

function setTheme(nextDark) {
  darkMode.value = nextDark;
  document.documentElement.dataset.kfeTheme = nextDark ? 'dark' : 'light';
  try { localStorage.setItem('kfe:ui-theme', nextDark ? 'dark' : 'light'); } catch {}
}

function detectAmbientLight() {
  ambientLightAvailable.value = 'AmbientLightSensor' in globalThis;
  if (!ambientLightAvailable.value) return;
  try {
    const sensor = new AmbientLightSensor({ frequency: 1 });
    sensor.addEventListener('reading', () => {
      // Only use broad bands; never make rapid brightness changes while driving.
      if (sensor.illuminance < 25) setTheme(true);
      else if (sensor.illuminance > 500) setTheme(false);
    });
    sensor.start();
  } catch {
    ambientLightAvailable.value = false;
  }
}

function restoreTheme() {
  try {
    const saved = localStorage.getItem('kfe:ui-theme');
    if (saved === 'light') { setTheme(false); return; }
    if (saved === 'dark') { setTheme(true); return; }
  } catch {}

  const media = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
  setTheme(media ? media.matches : true);
}

function handleOnline() { online.value = true; }
function handleOffline() { online.value = false; }
function handleKeydown(event) {
  if (event.key === 'Escape') menuOpen.value = false;
}

onMounted(() => {
  window.addEventListener('hashchange', syncRoute);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  window.addEventListener('keydown', handleKeydown);
  reducedMotion.value = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  restoreTheme();
  detectAmbientLight();
});

onUnmounted(() => {
  window.removeEventListener('hashchange', syncRoute);
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div class="driver-shell" :data-online="online" :data-reduced-motion="reducedMotion">
    <header class="driver-header" aria-label="KFE driver shell">
      <button class="brand-button" type="button" aria-label="Go to Work" @click="navigate('Work'); vibrate(12)">
        <span class="brand-mark">K</span>
        <span class="brand-copy">
          <strong>KFE</strong>
          <small>Kanishka Fleet ERP</small>
        </span>
      </button>

      <div class="header-context" aria-live="polite">
        <span class="route-kicker">{{ activeNav === 'Work' ? 'DRIVER COCKPIT' : 'KFE' }}</span>
        <strong>{{ activeNav }}</strong>
      </div>

      <div class="header-actions">
        <span class="connection-pill" :class="{ offline: !online }" :aria-label="connectionLabel">
          <i aria-hidden="true"></i>
          <b>{{ connectionLabel }}</b>
        </span>
        <button class="header-button" type="button" aria-label="Open shell menu" :aria-expanded="menuOpen" @click="toggleMenu">
          <span aria-hidden="true">☰</span>
        </button>
      </div>
    </header>

    <aside v-if="menuOpen" class="shell-menu" aria-label="Shell controls">
      <div class="menu-title">SHELL</div>
      <button type="button" @click="setTheme(true); menuOpen=false; vibrate(8)">
        <span>◐</span><b>Dark mode</b><em v-if="darkMode">ACTIVE</em>
      </button>
      <button type="button" @click="setTheme(false); menuOpen=false; vibrate(8)">
        <span>○</span><b>Light mode</b><em v-if="!darkMode">ACTIVE</em>
      </button>
      <div class="menu-divider"></div>
      <button type="button" @click="goBack(); menuOpen=false; vibrate(10)"><span>‹</span><b>Back</b></button>
      <p v-if="!online" class="offline-note">No connection. The app remains available for local work.</p>
    </aside>

    <main class="driver-content">
      <div class="content-surface">
        <App />
      </div>
    </main>

    <nav class="quick-dock" aria-label="Primary driver navigation">
      <button
        v-for="item in NAV"
        :key="item.id"
        type="button"
        :class="{ active: activeNav === item.id }"
        :aria-current="activeNav === item.id ? 'page' : undefined"
        @click="navigate(item.id); vibrate(8)"
      >
        <span class="dock-icon" aria-hidden="true">{{ item.icon }}</span>
        <strong>{{ item.label }}</strong>
      </button>
    </nav>

    <div class="system-status" aria-live="polite">
      <span><i :class="{ offline: !online }"></i>{{ online ? 'Connected' : 'Offline mode' }}</span>
      <span v-if="ambientLightAvailable">AUTO LIGHT</span>
      <span>READY</span>
    </div>

    <WorkBreakControl v-if="showWorkBreak" />
  </div>
</template>

<style scoped>
:global(*) { box-sizing: border-box; }
:global(html), :global(body), :global(#app), :global(#vue-runtime) { min-height: 100%; margin: 0; }
:global(body) { background: #080a0d; }

.driver-shell {
  --shell-bg: #080a0d;
  --shell-surface: #101419;
  --shell-surface-2: #171c22;
  --shell-border: rgba(255,255,255,.10);
  --shell-text: #f7f9fb;
  --shell-muted: #9aa5b1;
  --shell-accent: #5ee6a8;
  --shell-accent-soft: rgba(94,230,168,.13);
  min-height: 100dvh;
  padding-top: env(safe-area-inset-top);
  padding-bottom: calc(96px + env(safe-area-inset-bottom));
  background: var(--shell-bg);
  color: var(--shell-text);
  color-scheme: dark;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 18px;
  line-height: 1.45;
  letter-spacing: .005em;
  overflow-x: hidden;
}

.driver-header {
  position: sticky;
  top: 0;
  z-index: 1200;
  min-height: 76px;
  padding: 10px 14px;
  display: grid;
  grid-template-columns: minmax(0,1fr) auto minmax(0,1fr);
  align-items: center;
  gap: 12px;
  background: rgba(8,10,13,.94);
  border-bottom: 1px solid var(--shell-border);
  backdrop-filter: blur(18px) saturate(140%);
}

.brand-button, .header-button, .quick-dock button, .shell-menu button {
  font: inherit;
  color: inherit;
  -webkit-tap-highlight-color: transparent;
}

.brand-button {
  min-height: 56px;
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  padding: 0;
}

.brand-mark {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 15px;
  background: var(--shell-accent-soft);
  color: var(--shell-accent);
  border: 1px solid rgba(94,230,168,.28);
  font-size: 1.35rem;
  font-weight: 950;
}

.brand-copy { display: grid; min-width: 0; }
.brand-copy strong { font-size: 1.1rem; line-height: 1; letter-spacing: .08em; }
.brand-copy small { margin-top: 5px; color: var(--shell-muted); font-size: .68rem; white-space: nowrap; }

.header-context { display: grid; justify-items: center; line-height: 1.1; min-width: 110px; }
.route-kicker { color: var(--shell-muted); font-size: .62rem; font-weight: 850; letter-spacing: .14em; }
.header-context strong { margin-top: 5px; font-size: 1rem; }

.header-actions { display: flex; justify-content: flex-end; align-items: center; gap: 8px; }
.connection-pill {
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid rgba(94,230,168,.24);
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--shell-accent);
  background: var(--shell-accent-soft);
  font-size: .68rem;
  font-weight: 900;
  letter-spacing: .05em;
}
.connection-pill i, .system-status i {
  width: 9px; height: 9px; border-radius: 50%; background: currentColor; display: block;
  box-shadow: 0 0 0 4px rgba(94,230,168,.10);
}
.connection-pill.offline { color: #ffbf69; border-color: rgba(255,191,105,.25); background: rgba(255,191,105,.10); }
.connection-pill.offline i, .system-status i.offline { box-shadow: 0 0 0 4px rgba(255,191,105,.10); }
.header-button { width: 56px; height: 56px; border: 1px solid var(--shell-border); border-radius: 16px; background: var(--shell-surface); display: grid; place-items: center; font-size: 1.3rem; }

.shell-menu {
  position: fixed;
  z-index: 1400;
  top: calc(82px + env(safe-area-inset-top));
  right: 12px;
  width: min(310px, calc(100vw - 24px));
  padding: 12px;
  border: 1px solid var(--shell-border);
  border-radius: 22px;
  background: rgba(16,20,25,.98);
  box-shadow: 0 22px 60px rgba(0,0,0,.42);
  backdrop-filter: blur(20px);
}
.menu-title { padding: 8px 10px 6px; color: var(--shell-muted); font-size: .65rem; font-weight: 900; letter-spacing: .14em; }
.shell-menu button { width: 100%; min-height: 56px; padding: 0 12px; display: grid; grid-template-columns: 28px 1fr auto; align-items: center; gap: 8px; border: 0; border-radius: 14px; background: transparent; text-align: left; }
.shell-menu button:hover, .shell-menu button:focus-visible { background: var(--shell-surface-2); outline: none; }
.shell-menu button span { font-size: 1.25rem; text-align: center; }
.shell-menu button b { font-size: .9rem; }
.shell-menu button em { color: var(--shell-accent); font-size: .62rem; font-style: normal; font-weight: 950; }
.menu-divider { height: 1px; margin: 8px 4px; background: var(--shell-border); }
.offline-note { margin: 10px 8px 4px; color: var(--shell-muted); font-size: .72rem; }

.driver-content { min-height: calc(100dvh - 76px); }
.content-surface { width: 100%; min-height: 100%; }

/* App.vue already owns the business screens. The new shell owns the chrome. */
:deep(.kfe-topbar), :deep(.kfe-bottom-nav) { display: none !important; }
:deep(.kfe-shell) { min-height: auto !important; background: transparent !important; color: inherit !important; }
:deep(.kfe-viewport) { min-height: auto !important; }
:deep(.kfe-workspace) { padding-bottom: 0 !important; }

.quick-dock {
  position: fixed;
  z-index: 1250;
  left: 10px;
  right: 10px;
  bottom: calc(10px + env(safe-area-inset-bottom));
  min-height: 78px;
  padding: 7px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  border: 1px solid var(--shell-border);
  border-radius: 24px;
  background: rgba(16,20,25,.96);
  box-shadow: 0 18px 50px rgba(0,0,0,.38);
  backdrop-filter: blur(18px) saturate(130%);
}

.quick-dock button {
  min-width: 0;
  min-height: 64px;
  border: 0;
  border-radius: 18px;
  background: transparent;
  color: var(--shell-muted);
  display: grid;
  place-items: center;
  align-content: center;
  gap: 2px;
}
.quick-dock button.active { color: var(--shell-accent); background: var(--shell-accent-soft); }
.dock-icon { font-size: 1.35rem; line-height: 1; }
.quick-dock strong { font-size: .68rem; font-weight: 900; }

.system-status {
  position: fixed;
  z-index: 1100;
  left: 16px;
  bottom: calc(102px + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  gap: 10px;
  pointer-events: none;
  color: var(--shell-muted);
  font-size: .62rem;
  font-weight: 850;
  letter-spacing: .07em;
  text-transform: uppercase;
}
.system-status span { display: inline-flex; align-items: center; gap: 6px; }
.system-status span:last-child { color: var(--shell-accent); }

@media (min-width: 760px) {
  .quick-dock { left: 50%; right: auto; transform: translateX(-50%); width: min(680px, calc(100vw - 28px)); }
  .system-status { left: max(18px, calc(50% - 330px)); }
}

@media (max-width: 560px) {
  .driver-header { grid-template-columns: minmax(0,1fr) auto; }
  .header-context { display: none; }
  .brand-copy small { display: none; }
  .connection-pill b { display: none; }
  .connection-pill { width: 42px; padding: 0; justify-content: center; }
}

@media (prefers-reduced-motion: reduce) {
  .driver-shell *, .driver-shell *::before, .driver-shell *::after { scroll-behavior: auto !important; transition-duration: 0s !important; animation-duration: 0s !important; }
}
</style>
