<script setup>
import { computed, ref } from 'vue';
import KfeFormShell from './KfeFormShell.vue';
import KfeFormField from './KfeFormField.vue';

const showForm = ref(false);
const saving = ref(false);
const saved = ref(false);
const categories = ['Service', 'Tyres', 'Brakes', 'Battery', 'Repair', 'Other'];

const initial = { date: new Date().toISOString().slice(0, 10), category: '', description: '', amount: '', odometer: '', reference: '' };
const valid = computed(() => true);

async function save(payload) {
  saving.value = true;
  await Promise.resolve();
  saving.value = false;
  saved.value = true;
  showForm.value = false;
  void payload;
}
</script>

<template>
  <section class="kfe-module-view" aria-labelledby="maintenance-title">
    <div class="kfe-module-heading">
      <p class="kfe-eyebrow">Vehicle Operations</p>
      <h1 id="maintenance-title">Maintenance</h1>
      <p class="kfe-destination-subtitle">Record vehicle work, cost and odometer context.</p>
    </div>

    <KfeStatePanel v-if="false" />

    <div v-if="!showForm">
      <article class="kfe-action-card">
        <div><span class="kfe-card-label">Maintenance</span><strong>Record vehicle work</strong><p>Capture the authoritative maintenance record. Cost allocation is handled by the business layer.</p></div>
        <button class="kfe-primary-action" type="button" @click="showForm = true">Add maintenance</button>
      </article>
      <p v-if="saved" class="kfe-success-note" role="status">Maintenance record saved.</p>
      <section class="kfe-module-section"><h2>History</h2><button class="kfe-list-action" type="button">Maintenance history <span aria-hidden="true">›</span></button></section>
      <section class="kfe-module-section"><h2>Catalogue</h2><button class="kfe-list-action" type="button">Maintenance categories <span aria-hidden="true">›</span></button></section>
    </div>

    <KfeFormShell v-else draft-key="maintenance-entry" title="Add maintenance" subtitle="Required information first; supporting details remain optional." :initial-value="initial" :saving="saving" :valid="valid" @save="save">
      <template #default="{ value }">
        <KfeFormField label="Category" required>
          <select v-model="value.category" required><option value="" disabled>Select category</option><option v-for="category in categories" :key="category" :value="category">{{ category }}</option></select>
        </KfeFormField>
        <KfeFormField label="Work / description" required><input v-model="value.description" type="text" placeholder="What was done?" required /></KfeFormField>
        <div class="kfe-form-grid">
          <KfeFormField label="Amount" required><input v-model="value.amount" inputmode="decimal" type="number" min="0" step="0.01" placeholder="₹ 0" required /></KfeFormField>
          <KfeFormField label="Odometer" required><input v-model="value.odometer" inputmode="numeric" type="number" min="0" step="1" placeholder="km" required /></KfeFormField>
        </div>
        <KfeFormField label="Date" required><input v-model="value.date" type="date" required /></KfeFormField>
        <details class="kfe-optional-details"><summary>Optional supporting information</summary><KfeFormField label="Receipt / reference"><input v-model="value.reference" type="text" placeholder="Optional reference" /></KfeFormField></details>
      </template>
    </KfeFormShell>
  </section>
</template>
