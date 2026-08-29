<script setup>
import { computed, onMounted, ref } from 'vue';
import './work-session.css';
import { application, viewModels } from '../../js/app.js';
import { createUiCommand } from '../../js/application/ui-contract.js';

const state = ref('LOADING');
const error = ref(null);
const session = ref(null);
const startOdometer = ref('');
const endOdometer = ref('');
const breakMinutes = ref('0');
const busy = ref(false);

const isOpen = computed(() => session.value?.status === 'OPEN');
const workKm = computed(() => {
  if (!session.value || isOpen.value) return null;
  try {
    return application.calculateWorkSession(session.value).value?.workKm ?? null;
  } catch {
    return null;
  }
});
const nextAction = computed(() => {
  if (!session.value) return 'Start today’s work session';
  if (isOpen.value) return 'Record the end odometer when work is complete';
  return 'Work session completed';
});

function formatTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

async function load() {
  state.value = 'LOADING';
  error.value = null;
  try {
    const rows = await application.listWork();
    const current = [...rows]
      .filter((row) => !row.is_deleted)
      .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)))[0] || null;
    session.value = current ? viewModels.workSession(current).session : null;
    state.value = current ? 'READY' : 'EMPTY';
  } catch (e) {
    error.value = viewModels.error(e);
    state.value = 'ERROR';
  }
}

async function start() {
  if (busy.value) return;
  busy.value = true;
  error.value = null;
  try {
    const command = createUiCommand('START_SHIFT', {
      started_at: new Date().toISOString(),
      start_odometer: Number(startOdometer.value),
      break_minutes: Number(breakMinutes.value || 0),
    });
    const created = await application.startWork(command.payload);
    session.value = viewModels.workSession(created).session;
    state.value = 'READY';
  } catch (e) {
    error.value = viewModels.error(e);
    state.value = 'ERROR';
  } finally {
    busy.value = false;
  }
}

async function complete() {
  if (busy.value || !session.value) return;
  busy.value = true;
  error.value = null;
  try {
    const command = createUiCommand('END_SHIFT', {
      ended_at: new Date().toISOString(),
      end_odometer: Number(endOdometer.value),
    });
    const updated = await application.completeWork(session.value.id, command.payload);
    session.value = viewModels.workSession(updated).session;
    state.value = 'READY';
  } catch (e) {
    error.value = viewModels.error(e);
    state.value = 'ERROR';
  } finally {
    busy.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section class="kfe-work-session" aria-labelledby="work-session-title">
    <header class="kfe-work-hero">
      <div>
        <p class="kfe-eyebrow">Operational cockpit</p>
        <h1 id="work-session-title">Work</h1>
        <p>{{ formatDate(new Date().toISOString()) }} · {{ nextAction }}</p>
      </div>
      <span class="kfe-work-status" :class="{ 'is-open': isOpen }">{{ session ? session.status : 'NOT STARTED' }}</span>
    </header>

    <p v-if="state === 'LOADING'" class="kfe-state-message" role="status">Loading today’s work session…</p>
    <div v-else-if="state === 'ERROR'" class="kfe-state-message kfe-state-error" role="alert">
      <strong>Couldn’t load the work session.</strong>
      <span>{{ error?.error || 'Please try again.' }}</span>
      <button type="button" @click="load">Retry</button>
    </div>

    <div v-else-if="!session" class="kfe-work-start">
      <div class="kfe-section-heading">
        <h2>Start work</h2>
        <p>Capture the opening odometer and planned break time.</p>
      </div>
      <div class="kfe-form-grid">
        <label class="kfe-field">
          <span>Start odometer</span>
          <input v-model="startOdometer" inputmode="decimal" type="number" min="0" step="1" autocomplete="off" :disabled="busy" required />
        </label>
        <label class="kfe-field">
          <span>Break minutes</span>
          <input v-model="breakMinutes" inputmode="numeric" type="number" min="0" step="1" autocomplete="off" :disabled="busy" />
        </label>
      </div>
      <button class="kfe-primary-action" type="button" :disabled="busy || !startOdometer" @click="start">
        {{ busy ? 'Starting…' : 'Start work' }}
      </button>
      <p v-if="error" class="kfe-inline-error" role="alert">{{ error.error }}</p>
    </div>

    <div v-else class="kfe-work-active">
      <div class="kfe-work-summary" aria-label="Work session summary">
        <div><span>Status</span><strong>{{ session.status }}</strong></div>
        <div><span>Started</span><strong>{{ formatTime(session.start_at) }}</strong></div>
        <div><span>Start odometer</span><strong>{{ session.start_odometer }}</strong></div>
        <div><span>Break</span><strong>{{ session.break_minutes ?? 0 }} min</strong></div>
        <div v-if="session.end_at"><span>Ended</span><strong>{{ formatTime(session.end_at) }}</strong></div>
        <div v-if="session.end_odometer != null"><span>End odometer</span><strong>{{ session.end_odometer }}</strong></div>
        <div v-if="workKm != null"><span>Business KM</span><strong>{{ workKm }} km</strong></div>
      </div>

      <div v-if="isOpen" class="kfe-work-next">
        <div class="kfe-section-heading">
          <h2>Finish work</h2>
          <p>Enter the closing odometer. The application layer validates the work-session transition.</p>
        </div>
        <label class="kfe-field">
          <span>End odometer</span>
          <input v-model="endOdometer" inputmode="numeric" type="number" min="0" step="1" autocomplete="off" :disabled="busy" required />
        </label>
        <button class="kfe-primary-action" type="button" :disabled="busy || !endOdometer" @click="complete">
          {{ busy ? 'Saving…' : 'End work' }}
        </button>
      </div>

      <p v-if="error" class="kfe-inline-error" role="alert">{{ error.error }}</p>
    </div>
  </section>
</template>
