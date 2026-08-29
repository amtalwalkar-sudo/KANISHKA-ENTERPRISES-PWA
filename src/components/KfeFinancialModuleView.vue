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
const transparencyItems = computed(() => isProfitability.value
  ? [
      ['Revenue', 'Authoritative application result', 'Revenue included in the profitability calculation.'],
      ['Fuel cost', 'Authoritative application result', 'Fuel cost included in the business cost calculation.'],
      ['Maintenance provision', 'Authoritative application result', 'Maintenance allocation supplied by the financial read model.'],
      ['Fixed overhead', 'Authoritative application result', 'Active fixed business obligations included in the period.'],
      ['Loan principal', 'Authoritative application result', 'Principal component supplied by the loan calculation.'],
      ['Loan interest', 'Authoritative application result', 'Interest component supplied by the loan calculation.'],
      ['Other business costs', 'Authoritative application result', 'Other eligible business expenses included in the result.'],
      ['Calculation provenance', 'Versioned application result', 'Inputs and calculation metadata remain outside the presentation layer.'],
    ]
  : [
      ['Revenue', 'Authoritative application result', 'Actual business revenue supplied by the application read model.'],
      ['Costs', 'Authoritative application result', 'Eligible actual business costs supplied by the application read model.'],
      ['Profit', 'Authoritative application result', 'Result produced by the domain/application financial calculation.'],
      ['Operating metrics', 'Authoritative application result', 'Supporting operational values supplied by the application query.'],
    ]);
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
      <section class="kfe-financial-section" aria-labelledby="transparency-title"><h2 id="transparency-title">How this result is built</h2><p class="kfe-financial-note">These are the calculation components supplied by the application/domain result. The UI displays them but does not recalculate them.</p><div class="kfe-financial-breakdown"><div v-for="item in transparencyItems" :key="item[0]"><span>{{ item[0] }}</span><strong>{{ item[1] }}</strong><p>{{ item[2] }}</p></div></div></section>
    </template>
    <article v-else class="kfe-financial-detail"><p class="kfe-eyebrow">{{ isProfitability ? 'FULL-SCREEN BREAKDOWN' : 'ACTUAL DETAIL' }}</p><h2>{{ detailTitle }}</h2><p>Authoritative values are supplied by the application query/read model. This presentation layer does not calculate financial results.</p><div class="kfe-financial-breakdown"><div v-for="item in transparencyItems" :key="item[0]"><span>{{ item[0] }}</span><strong>{{ item[1] }}</strong><p>{{ item[2] }}</p></div></div></article>
  </section>
</template>
