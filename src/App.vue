<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import './styles/shell.css';
import WorkSessionView from './components/WorkSessionView.vue';
import KfeDestinationView from './components/KfeDestinationView.vue';
import KfeStatePanel from './components/KfeStatePanel.vue';
import KfeModuleView from './components/KfeModuleView.vue';
import KfeFinancialModuleView from './components/KfeFinancialModuleView.vue';
import KfeTimelineView from './components/KfeTimelineView.vue';
import VehicleModuleView from './components/VehicleModuleView.vue';
import DriverModuleView from './components/DriverModuleView.vue';
import MaintenanceModuleView from './components/MaintenanceModuleView.vue';
import ComplianceModuleView from './components/ComplianceModuleView.vue';
import LoanModuleView from './components/LoanModuleView.vue';
import StatusModuleView from './components/StatusModuleView.vue';
import MoneyModuleView from './components/MoneyModuleView.vue';
import { application } from '../js/app.js';
import { createUiRouter } from '../js/ui/router.js';
import { createUiState, UI_STATES } from '../js/ui/state.js';
import { detectUiCapabilities } from '../js/ui/capabilities.js';
import { createInteractionGuard } from '../js/ui/interaction.js';
import { createUiLifecycle } from '../js/ui/lifecycle.js';
import { enforceDecimalInput } from '../js/ui/decimal-input.js';
import { prefersReducedMotion, watchReducedMotion } from '../js/ui/accessibility.js';
import { createHorizontalSwipeEngine } from '../js/ui/swipe.js';

const PRIMARY_DESTINATIONS = ['Work', 'Status', 'Timeline', 'More'];
const MORE_GROUPS = [
  { title: 'Vehicle', items: ['Vehicle', 'Driver'] },
  { title: 'Money', items: ['Fuel', 'Expenses', 'Revenue', 'Loans'] },
  { title: 'Vehicle Operations', items: ['Maintenance', 'Compliance'] },
  { title: 'Business', items: ['Dashboard', 'Profitability'] },
  { title: 'System', items: ['Settings'] },
];
const TIMELINE_HORIZONS = ['Today', 'Week', 'Month', 'Year'];
const FINANCIAL_MODULES = ['Dashboard', 'Profitability'];
const MONEY_MODULES = ['Fuel', 'Expenses', 'Revenue'];
const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine);
const activeModule = ref('Work');
const uiState = ref(UI_STATES.IDLE);
const capabilities = ref(detectUiCapabilities());
const storageState = ref('Ready');
const syncState = ref(online.value ? 'Online' : 'Offline');
const reducedMotion = ref(prefersReducedMotion());
const timelineHorizon = ref('Today');
const timelineEvents = ref([]);
const statusModel = ref(null);
const viewport = ref(null);
const router = createUiRouter({ initialPath: activeModule.value, onChange: (path) => { activeModule.value = path; } });
const state = createUiState();
const interaction = createInteractionGuard();
const lifecycle = createUiLifecycle({ onOnline: () => { online.value = true; syncState.value = 'Online'; }, onOffline: () => { online.value = false; syncState.value = 'Offline'; } });
let stopReducedMotionWatch = () => {};
let stopSwipe = () => {};
const currentDestination = computed(() => PRIMARY_DESTINATIONS.includes(activeModule.value) ? activeModule.value : 'More');
function refresh() { online.value = typeof navigator === 'undefined' ? true : navigator.onLine; syncState.value = online.value ? 'Online' : 'Offline'; capabilities.value = detectUiCapabilities(); }
async function loadStatus(){try{statusModel.value=await application.getStatus();}catch(error){statusModel.value={error:String(error?.message||error)};}}
async function loadTimeline(){try{const model=await application.getTimeline();timelineEvents.value=model.events||[];}catch(error){timelineEvents.value=[];}}
async function navigate(path) { const result = await interaction.run(async () => router.navigate(path)); if (!result.accepted) return; state.set(UI_STATES.READY); uiState.value = state.state; interaction.reset(); if(path==='Status') await loadStatus(); if(path==='Timeline') await loadTimeline(); }
function openMoreItem(item) { navigate(item); }
function selectTimelineHorizon(horizon) { timelineHorizon.value = horizon; }
function openModuleAction(action) { void action; }
function returnToMore() { navigate('More'); }
function handleSaveRequest(payload) { openModuleAction(payload); }
function handleCalculationRequest(payload) { openModuleAction(payload); }
function enforceDecimalInputs(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  const isNumeric = target.type === 'number' || target.inputMode === 'decimal';
  if (!isNumeric) return;
  const scale = Number.parseInt(target.dataset.kfeDecimalScale || '2', 10);
  const value = enforceDecimalInput(target, { scale: Number.isFinite(scale) ? scale : 2, allowNegative: target.dataset.kfeAllowNegative === 'true' });
  if (target.value !== value) target.value = value;
}
function handleBack() { router.handleBack(); }
function handleSwipe(direction) {
  const index = PRIMARY_DESTINATIONS.indexOf(currentDestination.value);
  if (index < 0) return;
  const delta = direction === 'LEFT' ? 1 : -1;
  const next = PRIMARY_DESTINATIONS[(index + delta + PRIMARY_DESTINATIONS.length) % PRIMARY_DESTINATIONS.length];
  void navigate(next);
}
onMounted(() => {
  router.start();
  lifecycle.start();
  stopReducedMotionWatch = watchReducedMotion((value) => { reducedMotion.value = value; });
  if (viewport.value) stopSwipe = createHorizontalSwipeEngine({ element: viewport.value, onSwipe: handleSwipe });
  refresh();
  void loadStatus();
  void loadTimeline();
  state.set(UI_STATES.READY);
  uiState.value = state.state;
});
onUnmounted(() => { router.stop(); lifecycle.stop(); stopReducedMotionWatch(); stopSwipe(); });
window.KFE_VUE_RUNTIME = { online, activeModule, uiState, capabilities, reducedMotion, handleBack };
</script>

<template>
  <div class="kfe-shell" data-framework="vue" @input.capture="enforceDecimalInputs">
    <header class="kfe-topbar" aria-label="KFE application header"><div class="kfe-brand"><strong>KFE 2.0</strong><span>Kanishka Fleet ERP</span></div><div class="kfe-status" aria-label="Application status"><span class="kfe-status-dot" aria-hidden="true"></span><span>{{ syncState }} · {{ storageState }}</span></div></header>
    <main ref="viewport" class="kfe-viewport" aria-label="Main application viewport"><section class="kfe-workspace" aria-live="polite">
      <WorkSessionView v-if="activeModule === 'Work'" />
      <StatusModuleView v-else-if="activeModule === 'Status'" :online="online" :status="statusModel" />
      <KfeDestinationView v-else-if="activeModule === 'Timeline'" title="Timeline" subtitle="Authoritative events projected chronologically across Today, Week, Month and Year."><div class="kfe-segmented" aria-label="Timeline horizon"><button v-for="horizon in TIMELINE_HORIZONS" :key="horizon" type="button" :class="{ 'is-active': timelineHorizon === horizon }" @click="selectTimelineHorizon(horizon)">{{ horizon }}</button></div><KfeTimelineView :horizon="timelineHorizon" :events="timelineEvents" /></KfeDestinationView>
      <KfeDestinationView v-else-if="activeModule === 'More'" title="More" subtitle="ERP management modules, grouped by information hierarchy."><div class="kfe-more-groups"><section v-for="group in MORE_GROUPS" :key="group.title" class="kfe-module-group"><h2>{{ group.title }}</h2><div class="kfe-module-list"><button v-for="item in group.items" :key="item" type="button" @click="openMoreItem(item)"><span>{{ item }}</span><span aria-hidden="true">›</span></button></div></section></div></KfeDestinationView>
      <VehicleModuleView v-else-if="activeModule === 'Vehicle'" @save-request="handleSaveRequest" @back="returnToMore" />
      <DriverModuleView v-else-if="activeModule === 'Driver'" @save-request="handleSaveRequest" @back="returnToMore" />
      <MaintenanceModuleView v-else-if="activeModule === 'Maintenance'" @save-request="handleSaveRequest" />
      <ComplianceModuleView v-else-if="activeModule === 'Compliance'" @save-request="handleSaveRequest" @back="returnToMore" />
      <LoanModuleView v-else-if="activeModule === 'Loans'" @save-request="handleSaveRequest" @calculation-request="handleCalculationRequest" @open="openModuleAction" @back="returnToMore" />
      <MoneyModuleView v-else-if="MONEY_MODULES.includes(activeModule)" :module="activeModule" @save-request="handleSaveRequest" @open="openModuleAction" @back="returnToMore" />
      <KfeFinancialModuleView v-else-if="FINANCIAL_MODULES.includes(activeModule)" :module="activeModule" @open="openModuleAction" @back="returnToMore" />
      <KfeModuleView v-else :module="activeModule" @open="openModuleAction" @back="returnToMore" @save-request="handleSaveRequest" />
    </section></main>
    <nav class="kfe-bottom-nav" aria-label="Primary navigation"><button v-for="destination in PRIMARY_DESTINATIONS" :key="destination" class="kfe-nav-item" type="button" :aria-current="currentDestination === destination ? 'page' : undefined" @click="navigate(destination)">{{ destination }}</button></nav>
  </div>
</template>