<script setup>
import { ref } from 'vue';
import KfeFormShell from './KfeFormShell.vue';
import KfeStatePanel from './KfeStatePanel.vue';

const emit = defineEmits(['save-request']);
const editing = ref(false);
const initial = { type: '', cost: '', start: '', end: '' };

function save(value) {
  // Presentation boundary only. Persistence and validation belong to the application/domain layer.
  emit('save-request', { module: 'Compliance', value });
}
</script>

<template>
  <section class="kfe-module-view" aria-labelledby="compliance-title">
    <div v-if="!editing" class="kfe-module-heading">
      <button class="kfe-secondary-action kfe-back-action" type="button" @click="emit('save-request', { type: 'back' })">‹ More</button>
      <p class="kfe-eyebrow">Vehicle Operations</p>
      <h1 id="compliance-title">Compliance</h1>
      <p class="kfe-destination-subtitle">Renewals, validity and historical records.</p>
    </div>

    <template v-if="!editing">
      <article class="kfe-action-card">
        <div><span class="kfe-card-label">Renewal</span><strong>Record a completed renewal</strong><p>Keep validity dates and renewal cost clear. Payment-status workflow is intentionally not introduced.</p></div>
        <button class="kfe-primary-action" type="button" @click="editing = true">Add renewal</button>
      </article>
      <section class="kfe-module-section">
        <h2>Current validity</h2>
        <KfeStatePanel state="empty" title="No active validity recorded" message="Authoritative renewal information will appear here when available." />
      </section>
      <section class="kfe-module-section">
        <h2>History</h2>
        <button class="kfe-list-action" type="button"><span>Renewal history</span><span aria-hidden="true">›</span></button>
      </section>
    </template>

    <KfeFormShell v-else draft-key="compliance-renewal" title="Add renewal" subtitle="Record a completed renewal." :initial-value="initial" @save="save">
      <template #default="{ value }">
        <div class="kfe-form-field"><label class="kfe-form-label" for="renewal-type"><span>Renewal type</span><span class="kfe-required">Required</span></label><input id="renewal-type" v-model="value.type" class="kfe-form-input" type="text" placeholder="e.g. Insurance" required /></div>
        <div class="kfe-form-field"><label class="kfe-form-label" for="renewal-cost"><span>Cost</span><span class="kfe-required">Required</span></label><input id="renewal-cost" v-model="value.cost" class="kfe-form-input" type="number" inputmode="decimal" min="0" step="0.01" placeholder="₹ 0" required /></div>
        <div class="kfe-form-grid"><div class="kfe-form-field"><label class="kfe-form-label" for="renewal-start"><span>Validity start</span><span class="kfe-required">Required</span></label><input id="renewal-start" v-model="value.start" class="kfe-form-input" type="date" required /></div><div class="kfe-form-field"><label class="kfe-form-label" for="renewal-end"><span>Validity end</span><span class="kfe-required">Required</span></label><input id="renewal-end" v-model="value.end" class="kfe-form-input" type="date" required /></div></div>
        <p class="kfe-form-boundary-note">Save submits the completed renewal to the application boundary. No separate “renewed but unpaid” state is created.</p>
      </template>
    </KfeFormShell>
  </section>
</template>
