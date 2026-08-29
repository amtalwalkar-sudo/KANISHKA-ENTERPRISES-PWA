<script setup>
import { computed, ref } from 'vue';
import KfeFormShell from './KfeFormShell.vue';
import KfeFormField from './KfeFormField.vue';

const editing = ref(false);
const saved = ref(false);
const vehicle = ref({ acquisitionDate: '', retirementDate: '' });
const active = computed(() => !vehicle.value.retirementDate);

function save(payload) {
  vehicle.value = { ...vehicle.value, ...payload };
  saved.value = true;
  editing.value = false;
}
</script>

<template>
  <section class="kfe-module-view" aria-labelledby="vehicle-title">
    <div class="kfe-module-heading">
      <p class="kfe-eyebrow">Vehicle</p>
      <h1 id="vehicle-title">Vehicle</h1>
      <p class="kfe-destination-subtitle">Central business asset and lifecycle context.</p>
    </div>

    <article v-if="!editing" class="kfe-detail-card">
      <div class="kfe-detail-card__top">
        <div><span class="kfe-card-label">Current vehicle</span><strong>Primary vehicle</strong></div>
        <span class="kfe-state-badge">{{ active ? 'Active' : 'Retired' }}</span>
      </div>
      <dl class="kfe-detail-list">
        <div><dt>Acquisition date</dt><dd>{{ vehicle.acquisitionDate || 'Not recorded' }}</dd></div>
        <div><dt>Retirement date</dt><dd>{{ vehicle.retirementDate || '—' }}</dd></div>
      </dl>
      <button class="kfe-primary-action" type="button" @click="editing = true">Edit lifecycle</button>
    </article>

    <KfeFormShell v-else draft-key="vehicle-lifecycle" title="Vehicle lifecycle" subtitle="Keep acquisition and retirement dates authoritative." :initial-value="vehicle" @save="save">
      <template #default="{ value }">
        <KfeFormField label="Acquisition date" required>
          <input v-model="value.acquisitionDate" type="date" required />
        </KfeFormField>
        <KfeFormField label="Retirement date" hint="Optional while the vehicle is active.">
          <input v-model="value.retirementDate" type="date" />
        </KfeFormField>
      </template>
    </KfeFormShell>

    <p v-if="saved" class="kfe-success-note" role="status">Vehicle lifecycle saved.</p>

    <section class="kfe-module-section">
      <h2>Driver</h2>
      <button class="kfe-list-action" type="button">Current driver <span aria-hidden="true">›</span></button>
    </section>
    <section class="kfe-module-section">
      <h2>History</h2>
      <button class="kfe-list-action" type="button">Relevant timeline events <span aria-hidden="true">›</span></button>
    </section>
  </section>
</template>
