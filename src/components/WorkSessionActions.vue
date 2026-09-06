<script setup>
defineProps({
  form: { type: String, default: null },
  screenState: { type: String, required: true },
  busy: { type: Boolean, default: false },
  dayAllocationValid: { type: Boolean, default: false },
  personalAllocationValid: { type: Boolean, default: false },
  personalEndValid: { type: Boolean, default: false },
  shiftEndValid: { type: Boolean, default: false },
  shiftRevenueValid: { type: Boolean, default: false },
})

defineEmits(['swipe'])
</script>

<template>
  <div class="bottom-action" aria-label="Work action">
    <KfeSwipeBar
      v-if="!form && screenState === 'DAY_START'"
      left-label="<< START PERSONAL TRIP"
      right-label="START DAY >>"
      left-action="START_PERSONAL_TRIP"
      right-action="START_DAY"
      :disabled="busy"
      @swipe="$emit('swipe', $event)"
    />
    <KfeSwipeBar
      v-else-if="!form && screenState === 'DAY_ENDED'"
      right-label="START DAY >>"
      right-action="START_DAY"
      :disabled="busy"
      @swipe="$emit('swipe', $event)"
    />
    <KfeSwipeBar
      v-else-if="!form && screenState === 'DAY_READY'"
      left-label="<< START PERSONAL TRIP"
      right-label="START BUSINESS SHIFT >>"
      left-action="START_PERSONAL_TRIP"
      right-action="START_SHIFT"
      :disabled="busy"
      @swipe="$emit('swipe', $event)"
    />
    <KfeSwipeBar
      v-else-if="!form && screenState === 'SHIFT_WAITING'"
      left-label="<< END SHIFT"
      right-label="START BUSINESS TRIP >>"
      left-action="END_SHIFT"
      right-action="START_TRIP"
      :disabled="busy"
      @swipe="$emit('swipe', $event)"
    />
    <KfeSwipeBar
      v-else-if="!form && screenState === 'BUSINESS_TRIP'"
      right-label="END BUSINESS TRIP >>"
      right-action="END_TRIP"
      :disabled="busy"
      @swipe="$emit('swipe', $event)"
    />
    <KfeSwipeBar
      v-else-if="!form && screenState === 'PERSONAL_TRIP'"
      right-label="END PERSONAL TRIP >>"
      right-action="END_PERSONAL_TRIP"
      :disabled="busy"
      @swipe="$emit('swipe', $event)"
    />
    <KfeSwipeBar
      v-else-if="form === 'DAY_START'"
      right-label="CONFIRM START DAY >>"
      right-action="START_DAY_CONFIRM"
      :disabled="busy || !dayAllocationValid"
      @swipe="$emit('swipe', $event)"
    />
    <KfeSwipeBar
      v-else-if="form === 'PERSONAL_START'"
      right-label="START PERSONAL TRIP >>"
      right-action="START_PERSONAL_TRIP_CONFIRM"
      :disabled="busy || !personalAllocationValid"
      @swipe="$emit('swipe', $event)"
    />
    <KfeSwipeBar
      v-else-if="form === 'PERSONAL_END'"
      right-label="CLOSE PERSONAL TRIP >>"
      right-action="CLOSE_PERSONAL_TRIP"
      :disabled="busy || !personalEndValid"
      @swipe="$emit('swipe', $event)"
    />
    <KfeSwipeBar
      v-else-if="form === 'SHIFT_END'"
      left-label="<< CLOSE SHIFT"
      left-action="CLOSE_SHIFT"
      :disabled="busy || !shiftEndValid || !shiftRevenueValid"
      @swipe="$emit('swipe', $event)"
    />
  </div>
</template>

<script>
import KfeSwipeBar from './KfeSwipeBar.vue'
</script>
