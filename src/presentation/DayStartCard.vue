<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  latestOdometer: {
    type: Number,
    default: null,
  },
})

const emit = defineEmits(['start-day'])
const odometer = ref(props.latestOdometer == null ? '' : String(props.latestOdometer))
const hasAuthoritativeReading = computed(() => Number.isFinite(props.latestOdometer) && props.latestOdometer >= 0)

function submit() {
  const value = Number(odometer.value)
  if (!Number.isFinite(value) || value < 0) return
  emit('start-day', hasAuthoritativeReading.value ? props.latestOdometer : value)
}
</script>

<template>
  <div class="day-start-card">
    <div class="card-header">
      <span class="status-pill">Day • Ready</span>
      <h2 class="card-title">Start Day</h2>
      <p class="card-copy">Begin today's operational workflow before starting a shift or trip.</p>
    </div>

    <div class="card-body">
      <label class="odometer-field">
        <span>Start Odometer</span>
        <input v-model="odometer" type="number" inputmode="numeric" min="0" step="1" :readonly="hasAuthoritativeReading" autocomplete="off" aria-label="Start odometer" />
      </label>
      <p v-if="hasAuthoritativeReading" class="status-notice">Using the latest recorded odometer reading.</p>
      <p v-else class="status-notice">Enter the vehicle's current odometer reading to begin.</p>
    </div>

    <div class="card-actions">
      <button type="button" class="btn btn-primary btn-large" @click="submit">Start Day</button>
    </div>
  </div>
</template>

<style scoped>
.day-start-card { display:flex; flex-direction:column; justify-content:space-between; gap:18px; width:100%; height:100%; max-height:100%; min-height:0; padding:16px; box-sizing:border-box; overflow:hidden; border:1px solid var(--kfe-ui-border); border-radius:20px; background:var(--kfe-ui-surface); color:var(--kfe-ui-text); box-shadow:var(--kfe-ui-shadow); }
.card-header { display:flex; flex-direction:column; gap:8px; }
.card-copy { margin:0; opacity:.76; }
.card-body { flex:1; display:flex; flex-direction:column; justify-content:center; gap:10px; }
.odometer-field { display:flex; flex-direction:column; gap:8px; font-weight:600; }
.odometer-field input { width:100%; box-sizing:border-box; padding:14px; border:1px solid var(--kfe-ui-border); border-radius:14px; background:var(--kfe-ui-surface-muted,var(--kfe-ui-surface)); color:inherit; font-size:1.1rem; }
.odometer-field input:read-only { opacity:.8; }
.status-notice { margin:0; font-size:.9rem; opacity:.72; }
.card-actions { min-height:0; }
.btn-large { width:100%; min-height:52px; }
</style>
