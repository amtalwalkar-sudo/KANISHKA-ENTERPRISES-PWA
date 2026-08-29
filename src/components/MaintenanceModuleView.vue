<script setup>
import { ref } from 'vue';
import KfeFormShell from './KfeFormShell.vue';

const emit = defineEmits(['save-request']);
const showForm = ref(false);
const saving = ref(false);
const categories = ['Service', 'Tyres', 'Brakes', 'Battery', 'Repair', 'Other'];
const initial = { date: new Date().toISOString().slice(0, 10), category: '', description: '', amount: '', odometer: '', reference: '' };

function save(payload) {
  // Presentation boundary only. The parent/application layer owns persistence and success state.
  emit('save-request', { module: 'Maintenance', value: payload });
}
</script>

<template>
  <section class="kfe-module-view" aria-labelledby="maintenance-title">
    <div class="kfe-module-heading"><p class="kfe-eyebrow">Vehicle Operations</p><h1 id="maintenance-title">Maintenance</h1><p class="kfe-destination-subtitle">Record vehicle work, cost and odometer context.</p></div>
    <div v-if="!showForm">
      <article class="kfe-action-card"><div><span class="kfe-card-label">Maintenance</span><strong>Record vehicle work</strong><p>Capture the authoritative maintenance record. Cost allocation is handled by the business layer.</p></div><button class="kfe-primary-action" type="button" @click="showForm = true">Add maintenance</button></article>
      <section class="kfe-module-section"><h2>History</h2><button class="kfe-list-action" type="button">Maintenance history <span aria-hidden="true">›</span></button></section>
      <section class="kfe-module-section"><h2>Catalogue</h2><button class="kfe-list-action" type="button">Maintenance categories <span aria-hidden="true">›</span></button></section>
    </div>
    <KfeFormShell v-else draft-key="maintenance-entry" title="Add maintenance" subtitle="Required information first; supporting details remain optional." :initial-value="initial" :saving="saving" @save="save">
      <template #default="{ value }">
        <div class="kfe-form-field"><label class="kfe-form-label" for="maintenance-category"><span>Category</span><span class="kfe-required">Required</span></label><select id="maintenance-category" v-model="value.category" class="kfe-form-input" required><option value="" disabled>Select category</option><option v-for="category in categories" :key="category" :value="category">{{ category }}</option></select></div>
        <div class="kfe-form-field"><label class="kfe-form-label" for="maintenance-description"><span>Work / description</span><span class="kfe-required">Required</span></label><input id="maintenance-description" v-model="value.description" class="kfe-form-input" type="text" placeholder="What was done?" required /></div>
        <div class="kfe-form-grid"><div class="kfe-form-field"><label class="kfe-form-label" for="maintenance-amount"><span>Amount</span><span class="kfe-required">Required</span></label><input id="maintenance-amount" v-model="value.amount" class="kfe-form-input" inputmode="decimal" type="number" min="0" step="0.01" placeholder="₹ 0" required /></div><div class="kfe-form-field"><label class="kfe-form-label" for="maintenance-odometer"><span>Odometer</span><span class="kfe-required">Required</span></label><input id="maintenance-odometer" v-model="value.odometer" class="kfe-form-input" inputmode="numeric" type="number" min="0" step="1" placeholder="km" required /></div></div>
        <div class="kfe-form-field"><label class="kfe-form-label" for="maintenance-date"><span>Date</span><span class="kfe-required">Required</span></label><input id="maintenance-date" v-model="value.date" class="kfe-form-input" type="date" required /></div>
        <details class="kfe-optional-details"><summary>Optional supporting information</summary><div class="kfe-form-field"><label class="kfe-form-label" for="maintenance-reference"><span>Receipt / reference</span><span class="kfe-optional">Optional</span></label><input id="maintenance-reference" v-model="value.reference" class="kfe-form-input" type="text" placeholder="Optional reference" /></div></details>
      </template>
    </KfeFormShell>
  </section>
</template>
