<script setup>
import KfeStatePanel from './KfeStatePanel.vue';

const props = defineProps({
  online: { type: Boolean, default: true },
  status: { type: Object, default: null },
});
const money = (value) => value == null ? '—' : `₹${(Number(value) / 100).toFixed(2)}`;
const km = (value) => value == null ? '—' : `${Number(value).toFixed(1)} km`;
</script>

<template>
  <section class="kfe-destination-view kfe-status-view" aria-labelledby="status-title">
    <div class="kfe-module-heading"><p class="kfe-eyebrow">Today</p><h1 id="status-title">Status</h1><p class="kfe-destination-subtitle">Driver-centric current-day quick reference.</p></div>
    <KfeStatePanel v-if="props.status?.error" state="error" title="Status unavailable" :message="props.status.error" />
    <template v-else>
      <article class="kfe-target-card">
        <div><span class="kfe-card-label">Today's revenue</span><strong>{{ money(props.status?.revenuePaise) }}</strong></div>
        <div><span class="kfe-card-label">Today's expenses</span><strong>{{ money(props.status?.expensesPaise) }}</strong></div>
        <div class="kfe-progress-placeholder" aria-label="Status data confidence"><span></span></div>
        <div><span class="kfe-card-label">Tomorrow target</span><strong>{{ money(props.status?.tomorrowTarget) }}</strong></div>
      </article>
      <div class="kfe-placeholder-grid">
        <article class="kfe-placeholder-card"><span>Business KM</span><strong>{{ km(props.status?.businessKm) }}</strong></article>
        <article class="kfe-placeholder-card"><span>Today's fuel</span><strong>{{ money(props.status?.fuelPaise) }}</strong></article>
        <article class="kfe-placeholder-card"><span>Fuel Cost / km</span><strong>{{ money(props.status?.fuelCostPerKm) }}</strong></article>
        <article class="kfe-placeholder-card"><span>Tomorrow KM</span><strong>{{ km(props.status?.tomorrowKm) }}</strong></article>
      </div>
    </template>
    <KfeStatePanel v-if="!props.online" state="offline" title="Offline — operational" message="Valid local business operations remain available on this device." />
  </section>
</template>
