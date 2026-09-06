<script setup>
const props = defineProps({
  ocrReviewOpen: { type: Boolean, default: false },
  endDayConfirm: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
  unreviewedOcrRides: { type: Array, default: () => [] },
  unreviewedOcrRideCount: { type: Number, default: 0 },
})

defineEmits(['close-ocr-review', 'confirm-end-day', 'cancel-end-day'])
</script>

<template>
  <div v-if="props.ocrReviewOpen" class="work-form-overlay ocr-review-overlay" role="dialog" aria-modal="true" aria-labelledby="ocr-review-title">
    <div class="work-form-card ocr-review-card">
      <p class="kfe-eyebrow">OCR RIDE REVIEW</p>
      <h2 id="ocr-review-title">Unreviewed rides</h2>
      <p class="muted">{{ props.unreviewedOcrRideCount }} ride{{ props.unreviewedOcrRideCount === 1 ? '' : 's' }} need review.</p>
      <div class="ocr-review-list">
        <article v-for="(ride, index) in props.unreviewedOcrRides" :key="ride?.id || index" class="ocr-review-item">
          <div>
            <strong>{{ ride?.id || `Ride ${index + 1}` }}</strong>
            <span v-if="ride?.amount != null">₹{{ ride.amount }}</span>
          </div>
          <p v-if="ride?.date || ride?.time">{{ [ride?.date, ride?.time].filter(Boolean).join(' · ') }}</p>
          <p v-if="ride?.pickup || ride?.dropoff">{{ [ride?.pickup, ride?.dropoff].filter(Boolean).join(' → ') }}</p>
        </article>
      </div>
      <button class="secondary-action touch-button-48" type="button" @click="$emit('close-ocr-review')">
        Back to Close Shift
      </button>
    </div>
  </div>

  <div v-if="props.endDayConfirm" class="work-form-overlay" role="dialog" aria-modal="true">
    <div class="work-form-card">
      <p class="kfe-eyebrow">END DAY</p>
      <h2>Confirm day closure</h2>
      <p>All active work must be closed before ending the day.</p>
      <button class="primary-action touch-button-48" type="button" :disabled="props.busy" @click="$emit('confirm-end-day')">Confirm</button>
      <button class="secondary-action touch-button-48" type="button" :disabled="props.busy" @click="$emit('cancel-end-day')">Cancel</button>
    </div>
  </div>
</template>
