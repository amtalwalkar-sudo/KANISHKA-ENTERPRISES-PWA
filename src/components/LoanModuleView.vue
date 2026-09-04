<script setup>
import { computed, ref, watch } from 'vue';
import KfeFormShell from './KfeFormShell.vue';
import KfeFormField from './KfeFormField.vue';
import KfeStatePanel from './KfeStatePanel.vue';

const props = defineProps({ calculation: { type: Object, default: null } });
const emit = defineEmits(['back', 'save-request', 'calculation-request', 'open']);
const detail = ref('');
const activeForm = ref('');
const initialPrepayment = { outstanding_principal: '', amount: '', date: '' };
const localCalculation = ref(null);

const details = {
  'Payment history': { title: 'Payment history', message: 'Historical payments remain tied to the authoritative loan records, including after loan completion or vehicle retirement.' },
  'Amortization schedule': { title: 'Amortization schedule', message: 'Principal and interest components are supplied by the application/domain calculation layer.' },
  'Prepayment calculator': { title: 'Prepayment calculator', message: 'Enter the early-payment inputs below. The authoritative effect is calculated outside presentation.' },
};
const detailDefinition = computed(() => details[detail.value] ?? null);
const calculation = computed(() => localCalculation.value || props.calculation);
watch(() => props.calculation, value => { localCalculation.value = value; });
function openDetail(name) { detail.value = name; activeForm.value = ''; emit('open', { module: 'Loans', detail: name }); }
function closeDetail() { detail.value = ''; }
function openPrepayment() { activeForm.value = 'Prepayment calculator'; detail.value = ''; localCalculation.value = null; }
function save(value) { localCalculation.value = null; emit('calculation-request', { module: 'Loans', action: 'PREPAYMENT_CALCULATE', value: { outstanding_principal: value.outstanding_principal, amount: value.amount, date: value.date } }); }
</script>

<template>
  <section class="kfe-module-view" aria-labelledby="loan-title">
    <div v-if="!detail && !activeForm">
      <button class="kfe-secondary-action kfe-back-action" type="button" @click="emit('back')">‹ More</button>
      <p class="kfe-eyebrow">Money</p>
      <h1 id="loan-title">Loans</h1>
      <p class="kfe-destination-subtitle">Understand current obligations without exposing unnecessary accounting complexity.</p>
      <article class="kfe-detail-card">
        <div class="kfe-detail-card__top"><div><span class="kfe-card-label">Loan status</span><strong>Authoritative loan status</strong></div><span class="kfe-state-badge">Current</span></div>
        <dl class="kfe-detail-list"><div><dt>EMI</dt><dd>Authoritative result</dd></div><div><dt>Outstanding balance</dt><dd>Authoritative result</dd></div><div><dt>Vehicle association</dt><dd>Authoritative vehicle</dd></div></dl>
      </article>
      <section class="kfe-module-section"><h2>Payment</h2><button class="kfe-list-action" type="button" @click="openDetail('Payment history')"><span>Payment history</span><span aria-hidden="true">›</span></button></section>
      <section class="kfe-module-section"><h2>Financial tools</h2><div class="kfe-module-list"><button type="button" @click="openDetail('Amortization schedule')"><span>Amortization schedule</span><span aria-hidden="true">›</span></button><button type="button" @click="openPrepayment"><span>Prepayment calculator</span><span aria-hidden="true">›</span></button></div><p class="kfe-form-boundary-note">Prepayment charges: <strong>Zero</strong>. Calculation remains authoritative outside presentation.</p></section>
    </div>
    <KfeFormShell v-else-if="activeForm === 'Prepayment calculator'" draft-key="loan-prepayment" title="Prepayment calculator" subtitle="Zero prepayment charges. Enter the inputs; authoritative results come from the application/domain layer." :initial-value="initialPrepayment" @save="save">
      <template #default="{ value }">
        <KfeFormField id="loan-outstanding-principal" label="Outstanding principal" v-model="value.outstanding_principal" type="number" required placeholder="0.00" />
        <KfeFormField id="loan-prepayment-amount" label="Prepayment amount" v-model="value.amount" type="number" required placeholder="0.00" />
        <KfeFormField id="loan-prepayment-date" label="Effective date" v-model="value.date" type="date" required />
        <KfeStatePanel v-if="!calculation" state="normal" title="Calculation boundary" message="This screen collects inputs only. The application/domain layer calculates the effective prepayment and remaining principal." />
        <KfeStatePanel v-else-if="calculation.error" state="error" title="Calculation failed" :message="calculation.error" />
        <div v-else class="kfe-financial-breakdown" aria-live="polite"><div><span>Requested prepayment</span><strong>₹{{ (calculation.requestedPrepaymentPaise / 100).toFixed(2) }}</strong></div><div><span>Effective prepayment</span><strong>₹{{ (calculation.effectivePrepaymentPaise / 100).toFixed(2) }}</strong></div><div><span>Remaining principal</span><strong>₹{{ (calculation.remainingPrincipalPaise / 100).toFixed(2) }}</strong></div><div><span>Status</span><strong>{{ calculation.status }}</strong></div></div>
      </template>
    </KfeFormShell>
    <article v-else class="kfe-financial-detail"><button class="kfe-secondary-action" type="button" @click="closeDetail">‹ Loans</button><p class="kfe-eyebrow">DETAIL</p><h2>{{ detailDefinition.title }}</h2><p>{{ detailDefinition.message }}</p><div v-if="detail === 'Amortization schedule'" class="kfe-financial-breakdown"><div><span>Payment date</span><strong>Application read model</strong></div><div><span>Principal component</span><strong>Application result</strong></div><div><span>Interest component</span><strong>Application result</strong></div><div><span>Remaining balance</span><strong>Application result</strong></div></div><div v-else class="kfe-financial-breakdown"><div><span>Records</span><strong>Authoritative payment history</strong></div><div><span>Vehicle</span><strong>Authoritative association</strong></div></div></article>
  </section>
</template>
