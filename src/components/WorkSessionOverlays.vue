<script setup>
const props = defineProps({
  endDayConfirm: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
})
defineEmits(['confirm-end-day','cancel-end-day'])
</script>

<template>
  <div v-if="props.endDayConfirm" class="work-form-overlay" role="dialog" aria-modal="true" aria-labelledby="end-day-confirm-title">
    <div class="work-form-card">
      <p class="kfe-eyebrow">END DAY</p>
      <h2 id="end-day-confirm-title">Confirm day closure</h2>
      <p>All active work must be closed before ending the day.</p>
      <button class="primary-action touch-button-48" type="button" :disabled="props.busy" @click="$emit('confirm-end-day')">Confirm</button>
      <button class="secondary-action touch-button-48" type="button" :disabled="props.busy" @click="$emit('cancel-end-day')">Back</button>
    </div>
  </div>
</template>
