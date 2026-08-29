<script setup>
import { ref } from 'vue';
import KfeFormShell from './KfeFormShell.vue';
const emit = defineEmits(['save-request', 'back']);
const editing = ref(false);
const initial = { type: '', cost: '', start: '', end: '' };
function save(value) { emit('save-request', { module: 'Compliance', value }); }
</script>
<template>
  <section class="kfe-module-view" aria-labelledby="compliance-title">
    <button class="kfe-secondary-action" type="button" @click="editing ? editing = false : emit('back')">‹ {{ editing ? 'Compliance' : 'More' }}</button>
    <p class="kfe-eyebrow">Vehicle Operations</p><h1 id="compliance-title">Compliance</h1><p class="kfe-destination-subtitle">Renewals, validity and historical records.</p>
    <template v-if="!editing">
      <article class="kfe-action-card"><div><span class="kfe-card-label">Renewal</span><strong>Record a completed renewal</strong><p>Keep renewal type, cost and validity dates clear.</p></div><button class="kfe-primary-action" type="button" @click="editing = true">Add renewal</button></article>
      <section class="kfe-module-section"><h2>Current validity</h2><article class="kfe-detail-card"><strong>No active validity recorded</strong><p>Authoritative renewal information will appear here when available.</p></article></section>
      <section class="kfe-module-section"><h2>History</h2><button class="kfe-list-action" type="button"><span>Renewal history</span><span aria-hidden="true">›</span></button></section>
    </template>
    <KfeFormShell v-else draft-key="compliance-renewal" title="Add renewal" subtitle="Record a completed renewal." :initial-value="initial" @save="save">
      <template #default="{ value }">
        <div class="kfe-form-field"><label class="kfe-form-label" for="renewal-type"><span>Renewal type</span><span class="kfe-required">Required</span></label><input id="renewal-type" v-model="value.type" class="kfe-form-input" type="text" placeholder="e.g. Insurance" required /></div>
        <div class="kfe-form-field"><label class="kfe-form-label" for="renewal-cost"><span>Cost</span><span class="kfe-required">Required</span></label><input id="renewal-cost" v-model="value.cost" class="kfe-form-input" type="number" inputmode="decimal" min="0" step="0.01" required /></div>
        <div class="kfe-form-grid"><div class="kfe-form-field"><label class="kfe-form-label" for="renewal-start"><span>Validity start</span><span class="kfe-required">Required</span></label><input id="renewal-start" v-model="value.start" class="kfe-form-input" type="date" required /></div><div class="kfe-form-field"><label class="kfe-form-label" for="renewal-end"><span>Validity end</span><span class="kfe-required">Required</span></label><input id="renewal-end" v-model="value.end" class="kfe-form-input" type="date" required /></div></div>
        <p class="kfe-form-boundary-note">Save submits the completed renewal to the application boundary. No separate payment-status business state is created.</p>
      </template>
    </KfeFormShell>
  </section>
</template>
