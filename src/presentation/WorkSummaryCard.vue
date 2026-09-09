<script setup>
import { computed } from 'vue'

const props = defineProps({
  shiftSummary: {
    type: Object,
    default: null,
  },
  dailyReport: {
    type: Object,
    default: null,
  },
})

function finite(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function formatDistance(value) {
  const number = finite(value)
  return number !== null && number >= 0 ? `${number.toFixed(1)} km` : '--'
}

function formatDuration(value) {
  const seconds = finite(value)
  if (seconds === null || seconds < 0) return '--'
  const total = Math.floor(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  return `${hours}h ${String(minutes).padStart(2, '0')}m`
}

function formatMoney(value) {
  const paise = finite(value)
  return paise !== null && paise >= 0 ? `₹${(paise / 100).toFixed(2)}` : '--'
}

function formatDate(value) {
  if (typeof value !== 'string' || !value) return '--'
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed.toLocaleDateString() : value.slice(0, 10) || '--'
}

const shiftStatus = computed(() => String(props.shiftSummary?.status || 'UNAVAILABLE'))
const previousEnd = computed(() => finite(props.dailyReport?.previousEndOdometer))
const continuityStatus = computed(() => {
  if (previousEnd.value === null || previousEnd.value === 0) return 'Baseline Start'
  return String(props.dailyReport?.continuityStatus || props.shiftSummary?.continuityStatus || 'GAP')
})
</script>

<template>
  <article class="work-summary-card" aria-labelledby="work-summary-title">
    <header class="card-header">
      <span class="status-pill" :class="shiftStatus === 'COMPLETED' ? 'complete' : 'ready'">
        {{ shiftStatus === 'COMPLETED' ? 'Shift • Completed' : 'Operations • Summary' }}
      </span>
      <h2 id="work-summary-title" class="card-title">Work Summary</h2>
      <p class="card-date">{{ formatDate(dailyReport?.businessDate || shiftSummary?.businessDate) }}</p>
    </header>

    <div class="card-body">
      <section class="summary-section" aria-labelledby="shift-summary-heading">
        <h3 id="shift-summary-heading" class="section-title">Completed Shift</h3>
        <div class="metrics-grid">
          <div class="metric-item"><span class="metric-label">Active Duty</span><span class="metric-value">{{ formatDuration(shiftSummary?.activeDutySeconds) }}</span></div>
          <div class="metric-item"><span class="metric-label">Business Distance</span><span class="metric-value">{{ formatDistance(shiftSummary?.businessDistanceKm) }}</span></div>
          <div class="metric-item"><span class="metric-label">Revenue</span><span class="metric-value">{{ formatMoney(shiftSummary?.revenuePaise) }}</span></div>
          <div class="metric-item"><span class="metric-label">Expenses</span><span class="metric-value">{{ formatMoney(shiftSummary?.expensePaise) }}</span></div>
        </div>
      </section>

      <section class="summary-section" aria-labelledby="daily-summary-heading">
        <h3 id="daily-summary-heading" class="section-title">Daily Operations</h3>
        <div class="metrics-grid">
          <div class="metric-item"><span class="metric-label">Business Distance</span><span class="metric-value">{{ formatDistance(dailyReport?.businessDistanceKm) }}</span></div>
          <div class="metric-item"><span class="metric-label">Personal Distance</span><span class="metric-value">{{ formatDistance(dailyReport?.personalDistanceKm) }}</span></div>
          <div class="metric-item"><span class="metric-label">Duty Duration</span><span class="metric-value">{{ formatDuration(dailyReport?.activeDutySeconds) }}</span></div>
          <div class="metric-item"><span class="metric-label">Revenue</span><span class="metric-value">{{ formatMoney(dailyReport?.revenuePaise) }}</span></div>
          <div class="metric-item"><span class="metric-label">Total Expenses</span><span class="metric-value">{{ formatMoney(dailyReport?.totalExpensePaise) }}</span></div>
          <div class="metric-item"><span class="metric-label">Odometer Continuity</span><span class="metric-value">{{ continuityStatus }}</span></div>
        </div>
      </section>

      <section class="odometer-section" aria-labelledby="odometer-heading">
        <h3 id="odometer-heading" class="section-title">Odometer Chain</h3>
        <div class="odometer-grid">
          <div class="metric-item"><span class="metric-label">Previous End</span><span class="metric-value">{{ formatDistance(dailyReport?.previousEndOdometer) }}</span></div>
          <div class="metric-item"><span class="metric-label">Current Start</span><span class="metric-value">{{ formatDistance(dailyReport?.currentStartOdometer) }}</span></div>
          <div class="metric-item"><span class="metric-label">Delta</span><span class="metric-value">{{ formatDistance(dailyReport?.deltaKm) }}</span></div>
        </div>
      </section>
    </div>
  </article>
</template>

<style scoped>
.work-summary-card{display:flex;flex-direction:column;gap:14px;width:100%;height:100%;max-height:100%;min-height:0;padding:14px;box-sizing:border-box;overflow:hidden;border:1px solid var(--kfe-ui-border);border-radius:20px;background:var(--kfe-ui-surface);color:var(--kfe-ui-text);box-shadow:var(--kfe-ui-shadow)}
.card-header,.card-body,.summary-section,.metrics-grid,.odometer-section,.odometer-grid{min-height:0}.card-header{display:grid;gap:5px}.card-body{flex:1;display:grid;align-content:start;gap:10px;overflow:hidden}.summary-section,.odometer-section{display:grid;gap:7px}.metrics-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.odometer-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.status-pill{justify-self:start;display:inline-flex;align-items:center;min-height:28px;padding:5px 9px;border-radius:999px;background:var(--kfe-accent-soft);color:var(--kfe-accent);font-size:.68rem;font-weight:900}.status-pill.complete{background:color-mix(in srgb,var(--kfe-success) 12%,var(--kfe-ui-surface));color:var(--kfe-success)}.card-title{margin:0;font-size:clamp(1.3rem,5vw,1.7rem);line-height:1.1}.card-date{margin:0;color:var(--kfe-muted-text);font-size:.78rem}.section-title{margin:0;font-size:.72rem;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:var(--kfe-muted-text)}.metric-item{display:grid;gap:3px;min-width:0;padding:9px;border:1px solid var(--kfe-ui-border);border-radius:12px;background:var(--kfe-ui-bg)}.metric-label{font-size:.66rem;opacity:.72}.metric-value{min-width:0;overflow-wrap:anywhere;font-size:.9rem;font-weight:850}@media(max-width:380px){.work-summary-card{padding:11px;gap:10px}.metrics-grid{grid-template-columns:1fr 1fr;gap:6px}.odometer-grid{grid-template-columns:1fr}.metric-item{padding:7px}.metric-value{font-size:.84rem}}
</style>
