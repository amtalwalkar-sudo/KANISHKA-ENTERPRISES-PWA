<script setup>
import { computed } from 'vue'

const props = defineProps({
  tripMetrics: {
    type: Object,
    default: null,
  },
})

defineEmits(['end-personal-trip'])

const formattedStartTime = computed(() => {
  const epochMs = props.tripMetrics?.startTimeEpochMs
  if (!Number.isFinite(epochMs)) return '--'
  const date = new Date(epochMs)
  if (!Number.isFinite(date.getTime())) return '--'
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
})
</script>

<template>
  <article class="personal-trip-card" aria-labelledby="personal-trip-title">
    <header class="card-header">
      <span class="status-pill personal">Personal Trip • Active</span>
      <h2 id="personal-trip-title" class="card-title">Tracking Personal Mileage</h2>
    </header>

    <div class="card-body">
      <div v-if="tripMetrics" class="metrics-grid">
        <div class="metric-item">
          <span class="metric-label">Start Odometer</span>
          <span class="metric-value">{{ tripMetrics.startOdometer ?? '--' }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Start Time</span>
          <span class="metric-value">{{ formattedStartTime }}</span>
        </div>
      </div>
      <p v-else class="status-notice">
        Personal trip is actively running.
      </p>
    </div>

    <div class="card-actions">
      <button
        type="button"
        class="btn btn-danger btn-large"
        @click="$emit('end-personal-trip')"
      >
        End Personal Trip
      </button>
    </div>
  </article>
</template>

<style scoped>
.personal-trip-card {
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
  display: grid;
}

.card-header { gap: 8px; }
.card-body { gap: 10px; }
.card-actions { gap: 10px; }
.metrics-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }

.status-pill {
  justify-self: start;
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

.card-title {
  margin: 0;
  font-size: clamp(1.35rem, 5vw, 1.75rem);
  line-height: 1.15;
  letter-spacing: -.02em;
}

.metric-item {
  display: grid;
  gap: 5px;
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--kfe-ui-border);
  border-radius: 14px;
  background: var(--kfe-ui-bg);
}

.metric-label {
  color: var(--kfe-muted-text);
  font-size: .68rem;
  font-weight: 800;
}

.metric-value {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: .98rem;
  font-weight: 900;
}

.status-notice {
  margin: 0;
  color: var(--kfe-muted-text);
  font-size: .86rem;
  line-height: 1.45;
}

.btn {
  min-height: 48px;
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 850;
}

.btn-danger {
  min-height: 56px;
  border: 1px solid var(--kfe-danger, #d92d20);
  background: var(--kfe-danger, #d92d20);
  color: #fff;
}

.btn:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--kfe-danger, #d92d20) 70%, transparent);
  outline-offset: 2px;
}

@media (max-width: 360px) {
  .personal-trip-card { padding: 12px; gap: 12px; }
  .metrics-grid { grid-template-columns: 1fr; }
}
</style>
