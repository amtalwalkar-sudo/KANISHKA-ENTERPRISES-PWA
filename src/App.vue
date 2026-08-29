<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import './styles/shell.css';
import WorkSessionView from './components/WorkSessionView.vue';
import KfeDestinationView from './components/KfeDestinationView.vue';
import KfeStatePanel from './components/KfeStatePanel.vue';
import KfeModuleView from './components/KfeModuleView.vue';
import VehicleModuleView from './components/VehicleModuleView.vue';
import MaintenanceModuleView from './components/MaintenanceModuleView.vue';
import { createUiRouter } from '../js/ui/router.js';
import { createUiState, UI_STATES } from '../js/ui/state.js';
import { detectUiCapabilities } from '../js/ui/capabilities.js';
import { createInteractionGuard } from '../js/ui/interaction.js';
import { createUiLifecycle } from '../js/ui/lifecycle.js';

const PRIMARY_DESTINATIONS = ['Work', 'Status', 'Timeline', 'More'];
const MORE_GROUPS = [
  { title: 'Vehicle', items: ['Vehicle', 'Driver'] },
  { title: 'Money', items: ['Fuel', 'Expenses', 'Revenue', 'Loans'] },
  { title: 'Vehicle Operations', items: ['Maintenance', 'Compliance'] },
  { title: 'Business', items: ['Dashboard', 'Profitability'] },
  { title: 'System', items: ['Settings'] },
];
const TIMELINE_HORIZONS = ['Today', 'Week', 'Month', 'Year'];
const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine);
const activeModule = ref('Work');
const uiState = ref(UI_STATES.IDLE);
const capabilities = ref(detectUiCapabilities());
const storageState = ref('Ready');
const syncState = ref(online.value ? 'Online' : 'Offline');
const timelineHorizon = ref('Today');
const router = createUiRouter({ initialPath: activeModule.value, onChange: (path) => { activeModule.value = path; } });
const state = createUiState();
const interaction = createInteractionGuard();
const lifecycle = createUiLifecycle({ onOnline: () => { online.value = true; syncState.value = 'Online'; }, onOffline: () => { online.value = false; syncState.value = 'Offline'; } });
const currentDestination = computed(() => PRIMARY_DESTINATIONS.includes(activeModule.value) ? activeModule.value : 'More');
const sharedState = computed(() => online.value ? 'normal' : 'offline');
function refresh() { online.value = typeof navigator === 'undefined' ? true : navigator.onLine; syncState.value = online.value ? 'Online' : 'Offline'; capabilities.value = detectUiCapabilities(); }
async function navigate(path) { const result = await interaction.run(async () => router.navigate(path)); if (!result.accepted) return; state.set(UI_STATES.READY); uiState.value = state.state; interaction.reset(); }
function openMoreItem(item) { navigate(item); }
function selectTimelineHorizon(horizon) { timelineHorizon.value = horizon; }
function openModuleAction(action) { void action; }
function returnToMore() { navigate('More'); }
onMounted(() => { router.start(); lifecycle.start(); refresh(); state.set(UI_STATES.READY); uiState.value = state.state; });
onUnmounted(() => { router.stop(); lifecycle.stop(); });
window.KFE_VUE_RUNTIME = { online, activeModule, uiState, capabilities };
</script>

<template>
  <div class="kfe-shell" data-framework="vue">
    <header class="kfe-topbar" aria-label="KFE application header"><div class="kfe-brand"><strong>KFE 2.0</strong><span>Kanishka Fleet ERP</span></div><div class="kfe-status" aria-label="Application status"><span class="kfe-status-dot" aria-hidden="true"></span><span>{{ syncState }} · {{ storageState }}</span></div></header>
    <main class="kfe-viewport" aria-label="Main application viewport"><section class="kfe-workspace" aria-live="polite">
      <WorkSessionView v-if="activeModule === 'Work'" />
      <KfeDestinationView v-else-if="activeModule === 'Status'" title="Status" subtitle="Driver-centric current-day quick reference."><div class="kfe-placeholder-grid"><article class="kfe-placeholder-card"><span>Today's Target</span><strong>Authoritative result</strong></article><article class="kfe-placeholder-card"><span>Online time</span><strong>Current-day state</strong></article><article class="kfe-placeholder-card"><span>Trip meter</span><strong>Current-day state</strong></article><article class="kfe-placeholder-card"><span>Cost / km</span><strong>Calculation output</strong></article></div><KfeStatePanel v-if="sharedState === 'offline'" state="offline" title="Offline — operational" message="Valid local business operations remain available on this device." /></KfeDestinationView>
      <KfeDestinationView v-else-if="activeModule === 'Timeline'" title="Timeline" subtitle="Authoritative events projected chronologically across Today, Week, Month and Year."><div class="kfe-segmented" aria-label="Timeline horizon"><button v-for="horizon in TIMELINE_HORIZONS" :key="horizon" type="button" :class="{ 'is-active': timelineHorizon === horizon }" @click="selectTimelineHorizon(horizon)">{{ horizon }}</button></div><div class="kfe-placeholder"><h2>{{ timelineHorizon }} event history</h2><p>Projection view is connected to the shared timeline architecture. Business chronology remains authoritative.</p></div><KfeStatePanel state="empty" title="No events to show" message="Authoritative events will appear here when available." /></KfeDestinationView>
      <KfeDestinationView v-else-if="activeModule === 'More'" title="More" subtitle="ERP management modules, grouped by information hierarchy."><div class="kfe-more-groups"><section v-for="group in MORE_GROUPS" :key="group.title" class="kfe-module-group"><h2>{{ group.title }}</h2><div class="kfe-module-list"><button v-for="item in group.items" :key="item" type="button" @click="openMoreItem(item)"><span>{{ item }}</span><span aria-hidden="true">›</span></button></div></section></div></KfeDestinationView>
      <VehicleModuleView v-else-if="activeModule === 'Vehicle'" />
      <MaintenanceModuleView v-else-if="activeModule === 'Maintenance'" />
      <KfeModuleView v-else :module="activeModule" @open="openModuleAction" @back="returnToMore" />
    </section></main>
    <nav class="kfe-bottom-nav" aria-label="Primary navigation"><button v-for="destination in PRIMARY_DESTINATIONS" :key="destination" class="kfe-nav-item" type="button" :aria-current="currentDestination === destination ? 'page' : undefined" @click="navigate(destination)">{{ destination }}</button></nav>
  </div>
</template>
