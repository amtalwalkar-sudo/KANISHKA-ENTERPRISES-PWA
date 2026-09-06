<script setup>
import { computed } from 'vue'
import KfeStatePanel from './KfeStatePanel.vue'

const props = defineProps({
  online: { type: Boolean, default: true },
  performance: { type: Object, default: null },
})

const money = value => value == null ? '—' : `₹${(Number(value) / 100).toFixed(2)}`
const number = (value, suffix = '') => value == null ? '—' : `${Number(value).toFixed(suffix ? 1 : 0)}${suffix}`
const valueState = value => value == null ? 'unavailable' : 'actual'

const core = computed(() => [
  { label: 'Revenue', value: money(props.performance?.revenuePaise), state: valueState(props.performance?.revenuePaise) },
  { label: 'Fuel / Maintenance / Other', value: money(props.performance?.runningCostPaise), state: valueState(props.performance?.runningCostPaise) },
  { label: 'Operating Result', value: money(props.performance?.balancePaise), state: valueState(props.performance?.balancePaise) },
])

const vehicleCards = computed(() => [
  { label: 'Business KM', value: number(props.performance?.businessKm, ' km'), note: 'Business use only.' },
  { label: 'Revenue / KM', value: money(props.performance?.revenuePerKmPaise), note: 'Authoritative business revenue and KM.' },
  { label: 'Running Cost / KM', value: money(props.performance?.runningCostPerKmPaise), note: 'Authoritative allocated running costs.' },
  { label: 'Work Time', value: props.performance?.workSeconds == null ? '—' : number(props.performance.workSeconds / 3600, ' h'), note: 'Recorded work time.' },
])

const brief = computed(() => props.performance?.brief ?? 'Today’s position will become understandable as authoritative activity is recorded.')
const why = computed(() => props.performance?.why ?? 'No interpretation is manufactured from missing data.')
</script>

<template>
  <section class="kfe-performance" aria-labelledby="performance-title">
    <header class="kfe-performance-heading">
      <div><p class="kfe-eyebrow">READ-ONLY POSITION</p><h1 id="performance-title">Performance</h1><p>Vehicle usage and financial flow, without duplicate calculations or action controls.</p></div>
      <span v-if="performance?.asOf" class="kfe-performance-freshness">Updated {{ new Date(performance.asOf).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) }}</span>
    </header>

    <KfeStatePanel v-if="performance?.error" state="error" title="Performance unavailable" :message="performance.error" />
    <template v-else>
      <article class="kfe-performance-brief"><span class="kfe-card-label">TODAY’S POSITION</span><strong>{{ brief }}</strong><p>{{ why }}</p></article>

      <section class="kfe-cycle" aria-label="Performance cycle">
        <span class="is-active">Daily</span><span>Weekly</span><span>Monthly</span>
      </section>

      <section class="kfe-section"><div class="kfe-section-title"><div><span class="kfe-card-label">VEHICLE</span><h2>Usage</h2></div><span class="kfe-read-only">Read only</span></div><div class="kfe-vehicle-grid"><article v-for="item in vehicleCards" :key="item.label" class="kfe-performance-card"><span>{{ item.label }}</span><strong>{{ item.value }}</strong><small>{{ item.note }}</small></article></div></section>

      <section class="kfe-section"><div class="kfe-section-title"><div><span class="kfe-card-label">FINANCIAL FLOW</span><h2>Operating position</h2></div></div><div class="kfe-flow"><article v-for="(item,index) in core" :key="item.label" class="kfe-flow-card"><span>{{ item.label }}</span><strong>{{ item.value }}</strong><small>{{ item.state === 'actual' ? 'Authoritative' : 'Unavailable' }}</small></article></div></section>

      <article class="kfe-performance-why"><span class="kfe-card-label">WHY</span><strong>{{ why }}</strong><p>Performance consumes authoritative application read models. Missing inputs remain unavailable rather than being converted to zero.</p></article>
    </template>
    <KfeStatePanel v-if="!props.online" state="offline" title="Offline — operational" message="Performance continues from valid local authoritative data." />
  </section>
</template>

<style scoped>
.kfe-performance{padding:4px 0 32px;display:grid;gap:16px}.kfe-performance-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}.kfe-performance-heading h1{margin:0;font-size:clamp(1.7rem,6vw,2.25rem);letter-spacing:-.03em}.kfe-performance-heading p:not(.kfe-eyebrow){margin:5px 0 0;color:var(--kfe-muted-text);line-height:1.4}.kfe-performance-freshness{flex:none;color:var(--kfe-muted-text);font-size:.7rem;padding-top:5px}.kfe-performance-brief{padding:18px;border:1px solid var(--kfe-ui-border);border-radius:20px;background:var(--kfe-ui-surface);box-shadow:var(--kfe-ui-shadow);display:grid;gap:7px}.kfe-performance-brief strong{font-size:1.15rem;line-height:1.35}.kfe-performance-brief p{margin:0;color:var(--kfe-muted-text);line-height:1.45;font-size:.82rem}.kfe-cycle{display:grid;grid-template-columns:repeat(3,1fr);padding:4px;background:var(--kfe-ui-surface-2);border:1px solid var(--kfe-ui-border);border-radius:14px;gap:4px}.kfe-cycle span{text-align:center;padding:9px;border-radius:10px;font-size:.75rem;font-weight:900;color:var(--kfe-muted-text)}.kfe-cycle .is-active{background:var(--kfe-accent-soft);color:var(--kfe-accent)}.kfe-section{display:grid;gap:9px}.kfe-section-title{display:flex;justify-content:space-between;align-items:end}.kfe-section-title h2{margin:2px 0 0;font-size:1.05rem}.kfe-read-only{font-size:.65rem;font-weight:900;color:var(--kfe-muted-text);padding:5px 8px;border:1px solid var(--kfe-ui-border);border-radius:999px}.kfe-vehicle-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.kfe-performance-card{padding:15px;border:1px solid var(--kfe-ui-border);border-radius:16px;background:var(--kfe-ui-surface);display:grid;gap:5px}.kfe-performance-card span,.kfe-flow-card span{font-size:.72rem;color:var(--kfe-muted-text);font-weight:800}.kfe-performance-card strong,.kfe-flow-card strong{font-size:1.12rem}.kfe-performance-card small,.kfe-flow-card small{font-size:.66rem;color:var(--kfe-muted-text);line-height:1.35}.kfe-flow{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.kfe-flow-card{padding:15px;border:1px solid var(--kfe-ui-border);border-radius:16px;background:var(--kfe-ui-surface);display:grid;gap:5px}.kfe-flow-card:nth-child(2){background:var(--kfe-ui-surface-2)}.kfe-flow-card:nth-child(3){border-color:var(--kfe-accent)}.kfe-performance-why{padding:16px;border:1px solid var(--kfe-ui-border);border-radius:16px;background:var(--kfe-ui-surface-2);display:grid;gap:7px}.kfe-performance-why strong{font-size:.95rem;line-height:1.4}.kfe-performance-why p{margin:0;color:var(--kfe-muted-text);font-size:.75rem;line-height:1.45}@media(max-width:560px){.kfe-performance-heading{display:block}.kfe-performance-freshness{display:block;margin-top:7px}.kfe-vehicle-grid{grid-template-columns:1fr 1fr}.kfe-flow{grid-template-columns:1fr}.kfe-flow-card{min-height:82px}}@media(max-width:360px){.kfe-vehicle-grid{grid-template-columns:1fr}}
</style>
