<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import './styles/shell.css';
import WorkSessionView from './components/WorkSessionView.vue';
import KfeDestinationView from './components/KfeDestinationView.vue';
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

const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine);
const activeModule = ref('Work');
const uiState = ref(UI_STATES.IDLE);
const capabilities = ref(detectUiCapabilities());
const storageState = ref('Ready');
const syncState = ref(online.value ? 'Online' : 'Offline');
const moreOpen = ref(false);

const router = createUiRouter({
  initialPath: activeModule.value,
  onChange: (path) => {
    activeModule.value = path;
    moreOpen.value = path === 'More';
  },
});
const state = createUiState();
const interaction = createInteractionGuard();
const lifecycle = createUiLifecycle({
  onOnline: () => { online.value = true; syncState.value = 'Online'; },
  onOffline: () => { online.value = false; syncState.value = 'Offline'; },
});

const currentDestination = computed(() => PRIMARY_DESTINATIONS.includes(activeModule.value) ? activeModule.value : 'More');

function refresh() {
  online.value = typeof navigator === 'undefined' ? true : navigator.onLine;
  syncState.value = online.value ? 'Online' : 'Offline';
  capabilities.value = detectUiCapabilities();
}

async function navigate(path) {
  const result = await interaction.run(async () => router.navigate(path));
  if (!result.accepted) return;
  state.set(UI_STATES.READY);
  uiState.value = state.state;
  interaction.reset();
}

function openMoreItem(item) {
  navigate(item);
}

onMounted(() => {
  router.start();
  lifecycle.start();
  refresh();
  state.set(UI_STATES.READY);
  uiState.value = state.state;
});

onUnmounted(() => {
  router.stop();
  lifecycle.stop();
});

window.KFE_VUE_RUNTIME = { online, activeModule, uiState, capabilities };
</script>

<template>
  <div class="kfe-shell" data-framework="vue">
    <header class="kfe-topbar" aria-label="KFE application header">
      <div class="kfe-brand">
        <strong>KFE 2.0</strong>
        <span>Kanishka Fleet ERP</span>
      </div>
      <div class="kfe-status" aria-label="Application status">
        <span class="kfe-status-dot" aria-hidden="true"></span>
        <span>{{ syncState }} · {{ storageState }}</span>
      </div>
    </header>

    <main class="kfe-viewport" aria-label="Main application viewport">
      <section class="kfe-workspace" aria-live="polite">
        <WorkSessionView v-if="activeModule === 'Work'" />

        <KfeDestinationView
          v-else-if="activeModule === 'Status'"
          title="Status"
          subtitle="Driver-centric current-day quick reference."
        >
          <div class="kfe-placeholder-grid">
            <article class="kfe-placeholder-card"><span>Today's Target</span><strong>Authoritative result</strong></article>
            <article class="kfe-placeholder-card"><span>Online time</span><strong>Current-day state</strong></article>
            <article class="kfe-placeholder-card"><span>Trip meter</span><strong>Current-day state</strong></article>
            <article class="kfe-placeholder-card"><span>Cost / km</span><strong>Calculation output</strong></article>
          </div>
        </KfeDestinationView>

        <KfeDestinationView
          v-else-if="activeModule === 'Timeline'"
          title="Timeline"
          subtitle="Authoritative events projected chronologically across Today, Week, Month and Year."
        >
          <div class="kfe-segmented" aria-label="Timeline horizon">
            <button type="button" class="is-active">Today</button>
            <button type="button">Week</button>
            <button type="button">Month</button>
            <button type="button">Year</button>
          </div>
          <div class="kfe-placeholder"><h2>Event history</h2><p>Timeline projection foundation is ready for authoritative event integration.</p></div>
        </KfeDestinationView>

        <KfeDestinationView
          v-else-if="activeModule === 'More'"
          title="More"
          subtitle="ERP management modules, grouped by information hierarchy."
        >
          <div class="kfe-more-groups">
            <section v-for="group in MORE_GROUPS" :key="group.title" class="kfe-module-group">
              <h2>{{ group.title }}</h2>
              <div class="kfe-module-list">
                <button v-for="item in group.items" :key="item" type="button" @click="openMoreItem(item)">
                  <span>{{ item }}</span><span aria-hidden="true">›</span>
                </button>
              </div>
            </section>
          </div>
        </KfeDestinationView>

        <KfeDestinationView
          v-else
          :title="activeModule"
          subtitle="Module shell connected to the Phase 6 navigation architecture."
        />
      </section>
    </main>

    <nav class="kfe-bottom-nav" aria-label="Primary navigation">
      <button
        v-for="destination in PRIMARY_DESTINATIONS"
        :key="destination"
        class="kfe-nav-item"
        type="button"
        :aria-current="currentDestination === destination ? 'page' : undefined"
        @click="navigate(destination)"
      >
        {{ destination }}
      </button>
    </nav>
  </div>
</template>
