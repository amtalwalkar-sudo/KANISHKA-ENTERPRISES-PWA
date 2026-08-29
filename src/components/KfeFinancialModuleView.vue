<script setup>
import { computed, ref } from 'vue';

const props = defineProps({ module: { type: String, required: true } });
const emit = defineEmits(['back', 'open']);
const selected = ref('');

const modules = {
  Dashboard: { eyebrow: 'Business', title: 'Dashboard', subtitle: 'Actual business performance — what actually happened.', items: ['Revenue', 'Costs', 'Business profitability', 'Operating metrics'] },
  Profitability: { eyebrow: 'Business', title: 'Profitability', subtitle: 'Decision-oriented financial interpretation.', items: ['Actual', 'Projected', 'Target', 'Break-even'] },
  Loans: { eyebrow: 'Money', title: 'Loans', subtitle: 'Current obligations, payments and financial history.', items: ['Loan status', 'Payment history', 'Amortization', 'Prepayment calculator'] },
};
const definition = computed(() => modules[props.module] ?? modules.Profitability);
const detail = computed(() => selected.value ? { title: selected.value, message: 'Authoritative values will be supplied by the application query/read model. This screen does not calculate financial results.' } : null);
</script>

<template>
  <section class="kfe-financial-view" :data-module="module">
    <button class="kfe-secondary-action" type="button" @click="emit('back')">‹ More</button>
    <p class="kfe-eyebrow">{{ definition.eyebrow }}</p>
    <h1>{{ definition.title }}</h1>
    <p class="kfe-destination-subtitle">{{ definition.subtitle }}</p>

    <div v-if="!detail" class="kfe-financial-options">
      <button v-for="item in definition.items" :key="item" type="button" @click="selected = item; emit('open', item)">
        <span>{{ item }}</span><span aria-hidden="true">›</span>
      </button>
    </div>

    <article v-else class="kfe-financial-detail">
      <button class="kfe-secondary-action" type="button" @click="selected = ''">‹ {{ definition.title }}</button>
      <p class="kfe-eyebrow">{{ module === 'Profitability' ? 'FULL-SCREEN BREAKDOWN' : 'DETAIL' }}</p>
      <h2>{{ detail.title }}</h2>
      <p>{{ detail.message }}</p>
      <div class="kfe-financial-breakdown">
        <div><span>Headline</span><strong>Authoritative result</strong></div>
        <div><span>Supporting values</span><strong>Application read model</strong></div>
        <div><span>Records</span><strong>Available on drill-down</strong></div>
      </div>
    </article>
  </section>
</template>
