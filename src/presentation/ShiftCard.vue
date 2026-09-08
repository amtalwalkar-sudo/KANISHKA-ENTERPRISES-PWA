<script setup>
import { computed } from 'vue'

const props = defineProps({
  shiftMetrics: {
    type: Object,
    default: null,
  },
})

defineEmits(['end-shift'])

const formattedStartTime = computed(() => {
  if (!Number.isFinite(props.shiftMetrics?.startedAtEpochMs)) return '--'
  return new Date(props.shiftMetrics.startedAtEpochMs).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
})
</script>

<template>
  <div class="shift-card">
    <div class="card-header">
      <span class="status-pill active-shift">Shift • Active</span>
      <h2 class="card-title">On Duty</h2>
    </div>

    <div class="card-body">
      <div v-if="shiftMetrics" class="metrics-grid">
        <div class="metric-item">
          <span class="metric-label">Start Odometer</span>
          <span class="metric-value">{{ shiftMetrics.startOdometer ?? '--' }}</span>
        </div>
        <div class="metric-item">
          <span class="metric-label">Shift Start Time</span>
          <span class="metric-value">{{ formattedStartTime }}</span>
        </div>
      </div>
      <p v-else class="status-notice">
        Shift is actively running.
      </p>
    </div>

    <div class="card-actions">
      <button
        type="button"
        class="btn btn-danger btn-large"
        @click="$emit('end-shift')"
      >
        End Shift
      </button>
    </div>
  </div>
</template>

<style scoped>
.shift-card {
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
.card-actions {
  min-height: 0;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-body {
  flex: 1;
  display: flex;
  align-items: center;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
}

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

.metric-label {
  font-size: 0.8rem;
  opacity: 0.72;
}

.metric-value {
  font-size: 1.05rem;
  font-weight: 700;
}

.status-notice {
  margin: 0;
}

@media (max-width: 480px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}
</style>
