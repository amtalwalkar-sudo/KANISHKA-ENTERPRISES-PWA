<script setup>
import { ref } from 'vue';
import KfeFormShell from './KfeFormShell.vue';

const emit = defineEmits(['save-request', 'back']);
const editing = ref(false);
const driver = ref({ name: '' });

function save(payload) {
  emit('save-request', { module: 'Driver', value: payload });
}
</script>

<template>
  <section class="kfe-module-view" aria-labelledby="driver-title">
    <div class="kfe-module-heading"><p class="kfe-eyebrow">Vehicle</p><h1 id="driver-title">Driver</h1><p class="kfe-destination-subtitle">Driver attached to the current vehicle.</p></div>
    <article v-if="!editing" class="kfe-detail-card">
      <div class="kfe-detail-card__top"><div><span class="kfe-card-label">Current driver</span><strong>{{ driver.name || 'Not recorded' }}</strong></div><span class="kfe-state-badge">Vehicle attached</span></div>
      <p class="kfe-boundary-note">Driver analytics are not part of the current KFE scope.</p>
      <button class="kfe-primary-action" type="button" @click="editing = true">Edit driver</button>
    </article>
    <KfeFormShell v-else draft-key="driver-attachment" title="Driver" subtitle="Attach the current driver to the vehicle." :initial-value="driver" @save="save">
      <template #default="{ value }">
        <div class="kfe-form-field"><label class="kfe-form-label" for="driver-name"><span>Driver name</span><span class="kfe-required">Required</span></label><input id="driver-name" v-model="value.name" class="kfe-form-input" type="text" autocomplete="name" required /></div>
      </template>
    </KfeFormShell>
    <button class="kfe-secondary-action" type="button" @click="emit('back')">Back to Vehicle</button>
  </section>
</template>
