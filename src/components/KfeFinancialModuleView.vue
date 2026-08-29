<script setup>
import { computed, ref } from 'vue';

const props = defineProps({ module: { type: String, required: true } });
const emit = defineEmits(['back', 'open']);
const profitabilityViews = ['Actual', 'Projected', 'Target', 'Break-even'];
const selectedView = ref('Actual');
const selectedDetail = ref('');
const modules = {
  Dashboard: { eyebrow: 'Business', title: 'Dashboard', subtitle: 'Actual business performance — what actually happened.', headline: 'Actual business performance', supporting: ['Actual revenue', 'Actual costs', 'Business profit', 'Operating metrics'] },
  Profitability: { eyebrow: 'Business', title: 'Profitability', subtitle: 'Future and decision-oriented financial interpretation.', headline: 'Profitability view', supporting: ['Headline value', 'Contributing costs', 'Relevant revenue', 'Supporting records'] },
};
const definition = computed(() => modules[props.module] ?? modules.Dashboard);
const isProfitability = computed(() => props.module === 'Profitability');
const detailTitle = computed(() => selectedDetail.value || selectedView.value);
function openDetail(item) { selectedDetail.value = item; emit('open', item); }
function closeDetail() { selectedDetail.value = ''; }
</script>

<template>
  <section class="kfe-financial-view" :data-module="module" aria-labelledby="financial-title">
    <button class="kfe-secondary-action" type="button" @click="selectedDetail ? closeDetail() : emit('back')">‹ {{ selectedDetail ? definition.title : 'More' }}</button>
    <template v-if="!selectedDetail">
      <p class="kfe-eyebrow">{{ definition.eyebrow }}</p><h1 id="financial-title">{{ definition.title }}</h1><p class="kfe-destination-subtitle">{{ definition.subtitle }}</p>
      <article class="kfe-financial-headline"><span class="kfe-card-label">{{ isProfitability ? selectedView : 'Actuals' }}</span><strong>{{ definition.headline }}</strong><p>Authoritative application result</p></article>
      <div v-if="isProfitability" class="kfe-segmented" aria-label="Profitability view"><button v-for="view in profitabilityViews" :key="view" type="button" :class="{ 'is-active': selectedView === view }" @click="selectedView = view">{{ view }}</button></div>
      <section v-if="isProfitability" class="kfe-financial-section"><h2>{{ selectedView }}</h2><button class="kfe-list-action" type="button" @click="openDetail(selectedView)"><span>Open full-screen breakdown</span><span aria-hidden="true">›</span></button></section>
      <section class="kfe-financial-section"><h2>{{ isProfitability ? 'Supporting values' : 'Actual performance' }}</h2><div class="kfe-financial-metrics"><button v-for="item in definition.supporting" :key="item" class="kfe-financial-metric" type="button" @click="openDetail(item)"><span>{{ item }}</span><strong>Authoritative result</strong></button></div></section>
    </template>
    <article v-else class="kfe-financial-detail"><p class="kfe-eyebrow">{{ isProfitability ? 'FULL-SCREEN BREAKDOWN' : 'ACTUAL DETAIL' }}</p><h2>{{ detailTitle }}</h2><p>Authoritative values are supplied by the application query/read model. This presentation layer does not calculate financial results.</p><div class="kfe-financial-breakdown"><div><span>Headline</span><strong>Authoritative result</strong></div><div><span>Contributing components</span><strong>Application read model</strong></div><div><span>Supporting records</span><strong>Available on drill-down</strong></div></div></article>
  </section>
</template>
