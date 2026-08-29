<script setup>
import KfeStatePanel from './KfeStatePanel.vue';

const props = defineProps({ online: { type: Boolean, default: true } });
</script>

<template>
  <section class="kfe-destination-view kfe-status-view" aria-labelledby="status-title">
    <div class="kfe-module-heading"><p class="kfe-eyebrow">Today</p><h1 id="status-title">Status</h1><p class="kfe-destination-subtitle">Driver-centric current-day quick reference.</p></div>
    <article class="kfe-target-card"><div><span class="kfe-card-label">Today's target</span><strong>Authoritative result</strong></div><div><span class="kfe-card-label">Achieved</span><strong>Authoritative result</strong></div><div class="kfe-progress-placeholder" aria-label="Target progress"><span></span></div><div><span class="kfe-card-label">Remaining</span><strong>Authoritative result</strong></div></article>
    <div class="kfe-placeholder-grid"><article class="kfe-placeholder-card"><span>Online time</span><strong>Current-day state</strong></article><article class="kfe-placeholder-card"><span>Trip meter</span><strong>Current-day state</strong></article><article class="kfe-placeholder-card"><span>Today's Cost / km</span><strong>Calculation output</strong></article><article class="kfe-placeholder-card"><span>Today's Revenue / km</span><strong>Calculation output</strong></article></div>
    <KfeStatePanel v-if="!props.online" state="offline" title="Offline — operational" message="Valid local business operations remain available on this device." />
  </section>
</template>
