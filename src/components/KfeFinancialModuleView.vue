<script setup>
import { computed, ref } from 'vue';

const props = defineProps({ module: { type: String, required: true } });
const emit = defineEmits(['back', 'open']);

const profitabilityViews = ['Actual', 'Projected', 'Target', 'Break-even'];
const selectedView = ref('Actual');
const selectedDetail = ref('');

const modules = {
  Dashboard: {
    eyebrow: 'Business',
    title: 'Dashboard',
    subtitle: 'Actual business performance — what actually happened.',
    headline: 'Authoritative actuals',
    supporting: ['Actual revenue', 'Actual costs', 'Business profitability', 'Operating metrics'],
  },
  Profitability: {
    eyebrow: 'Business',
    title: 'Profitability',
    subtitle: 'Future and decision-oriented financial interpretation.',
    headline: 'Authoritative result',
    supporting: ['Headline value', 'Contributing costs', 'Relevant revenue', 'Supporting records'],
  },
  Loans: {
    eyebrow: 'Money',
    title: 'Loans',
    subtitle: 'Current obligations, payments and financial history.',
    headline: 'Current loan status',
    supporting: ['EMI', 'Outstanding balance', 'Vehicle association', 'Payment history'],
  },
};

const definition = computed(() => modules[props.module] ?? modules.Profitability);
const isProfitability = computed(() => props.module === 'Profitability');
const isLoan = computed(() => props.module === 'Loans');
const detailTitle = computed(() => selectedDetail.value || (isProfitability.value ? selectedView.value : ''));

function openDetail(item) {
  selectedDetail.value = item;
  emit('open', item);
}

function closeDetail() {
  selectedDetail.value = '';
}
</script>

<template>
  <section class="kfe-financial-view" :data-module="module" aria-labelledby="financial-title">
    <button class="kfe-secondary-action" type="button" @click="emit('back')">‹ More</button>
    <p class="kfe-eyebrow">{{ definition.eyebrow }}</p>
    <h1 id="financial-title">{{ definition.title }}</h1>
    <p class="kfe-destination-subtitle">{{ definition.subtitle }}</p>

    <template v-if="!selectedDetail">
      <article class="kfe-financial-headline">
        <span class="kfe-card-label">{{ isProfitability ? selectedView : definition.title }}</span>
        <strong>{{ definition.headline }}</strong>
        <p>Authoritative application result</p>
      </article>

      <div v-if="isProfitability" class="kfe-segmented" aria-label="Profitability view">
        <button
          v-for="view in profitabilityViews"
          :key="view"
          type="button"
          :class="{ 'is-active': selectedView === view }"
          @click="selectedView = view"
        >
          {{ view }}
        </button>
      </div>

      <section v-if="isProfitability" class="kfe-financial-section">
        <h2>{{ selectedView }}</h2>
        <button class="kfe-list-action" type="button" @click="openDetail(selectedView)">
          <span>Open full-screen breakdown</span><span aria-hidden="true">›</span>
        </button>
      </section>

      <section class="kfe-financial-section">
        <h2>{{ isLoan ? 'Loan overview' : 'Key supporting values' }}</h2>
        <div class="kfe-financial-metrics">
          <article v-for="item in definition.supporting" :key="item" class="kfe-financial-metric">
            <span>{{ item }}</span>
            <strong>Authoritative result</strong>
          </article>
        </div>
      </section>

      <section v-if="isLoan" class="kfe-financial-section">
        <h2>Financial detail</h2>
        <div class="kfe-module-list">
          <button type="button" @click="openDetail('Payment history')"><span>Payment history</span><span aria-hidden="true">›</span></button>
          <button type="button" @click="openDetail('Amortization schedule')"><span>Amortization schedule</span><span aria-hidden="true">›</span></button>
          <button type="button" @click="openDetail('Prepayment calculator')"><span>Prepayment calculator</span><span aria-hidden="true">›</span></button>
        </div>
      </section>

      <section v-if="module === 'Dashboard'" class="kfe-financial-section">
        <h2>Actual performance</h2>
        <div class="kfe-module-list">
          <button v-for="item in definition.supporting" :key="item" type="button" @click="openDetail(item)">
            <span>{{ item }}</span><span aria-hidden="true">›</span>
          </button>
        </div>
      </section>
    </template>

    <article v-else class="kfe-financial-detail">
      <button class="kfe-secondary-action" type="button" @click="closeDetail">‹ {{ definition.title }}</button>
      <p class="kfe-eyebrow">{{ isProfitability ? 'FULL-SCREEN BREAKDOWN' : 'DETAIL' }}</p>
      <h2>{{ detailTitle }}</h2>
      <p>Authoritative values will be supplied by the application query/read model. This presentation layer does not calculate financial results.</p>
      <div class="kfe-financial-breakdown">
        <div><span>Headline</span><strong>Authoritative result</strong></div>
        <div><span>Supporting values</span><strong>Application read model</strong></div>
        <div><span>Supporting records</span><strong>Available on drill-down</strong></div>
      </div>
    </article>
  </section>
</template>
