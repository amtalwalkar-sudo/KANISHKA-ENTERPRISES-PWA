<script setup>
import { computed } from 'vue'

const props = defineProps({
  summary: {
    type: Object,
    default: null,
  },
  dayEnded: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['end-day'])

const formattedDuration = computed(() => {
  const seconds = Number(props.summary?.shiftDurationSeconds)
  if (!Number.isFinite(seconds) || seconds < 0) return '--'
  const total = Math.floor(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  return `${hours}h ${String(minutes).padStart(2, '0')}m`
})

const distanceTracked = computed(() => {
  const value = Number(props.summary?.distanceTrackedKm)
  return Number.isFinite(value) && value >= 0 ? `${value} km` : '--'
})

const businessTripCount = computed(() => {
  const value = Number(props.summary?.businessTripCount)
  return Number.isInteger(value) && value >= 0 ? String(value) : '--'
})

const operationalMetric = computed(() => {
  const value = Number(props.summary?.telemetryEventCount)
  return Number.isInteger(value) && value >= 0 ? String(value) : '--'
})
</script>

<template>
  <article class="day-end-card" aria-labelledby="day-end-title">
    <header class="card-header">
      <span class="status-pill" :class="dayEnded ? 'complete' : 'ready'">
        {{ dayEnded ? 'Day Ended • Complete' : 'Day Open • Ready to End' }}
      </span>
      <h2 id="day-end-title" class="card-title">
        {{ dayEnded ? 'Day End Summary' : 'Finish Work Day' }}
      </h2>
    </header>

    <div class="card-body">
      <div v-if="summary" class="metrics-grid">
        <div class="metric-item">
          <span class="metric-label">Shift Duration</span>
          <span class="metric-value">{{ formattedDuration }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Distance Tracked</span>
          <span class="metric-value">{{ distanceTracked }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Business Trips</span>
          <span class="metric-value">{{ businessTripCount }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Operational Events</span>
          <span class="metric-value">{{ operationalMetric }}</span>
        </div>
      </div>
      <p v-else class="status-notice">Day End summary is currently unavailable.</p>
    </div>

    <div v-if="!dayEnded" class="card-actions">
      <button type="button" class="btn btn-warning btn-large" @click="$emit('end-day')">
        End Day
      </button>
    </div>
  </article>
</template>

<style scoped>
.day-end-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 18px;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid var(--kfe-ui-border);
  border-radius: 20px;
  background: var(--kfe-ui-surface);
  color: var(--kfe-ui-text);
  box-shadow: var(--kfe-ui-shadow);
}

.card-header,
.card-body,
.card-actions,
.metrics-grid {
  min-height: 0;
}

.card-header { display: flex; flex-direction: column; gap: 8px; }
.card-body { flex: 1; display: flex; align-items: center; }
.card-actions { display: grid; gap: 10px; }
.metrics-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; width: 100%; }

.status-pill {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--kfe-accent-soft);
  color: var(--kfe-accent);
  font-size: .7rem;
  font-weight: 900;
}

.status-pill.complete { background: var(--kfe-ui-surface-muted, var(--kfe-ui-bg)); }

.card-title { margin: 0; font-size: clamp(1.35rem, 5vw, 1.75rem); line-height: 1.15; letter-spacing: -.02em; }

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--kfe-ui-border);
  border-radius: 14px;
  background: var(--kfe-ui-surface-muted, var(--kfe-ui-surface));
}

.metric-label { font-size: .8rem; opacity: .72; }
.metric-value { font-size: 1.05rem; font-weight: 700; }
.status-notice { margin: 0; }

.btn { min-height: 56px; border-radius: 12px; padding: 10px 14px; font-weight: 850; }
.btn-warning { border: 1px solid var(--kfe-warning, #b54708); background: var(--kfe-warning, #b54708); color: #fff; }

@media (max-width: 480px) {
  .day-end-card { padding: 12px; gap: 12px; }
  .metrics-grid { grid-template-columns: 1fr; }
}
</style>
