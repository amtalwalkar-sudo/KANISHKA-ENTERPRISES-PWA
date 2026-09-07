<script setup>
import { computed, ref, watch } from 'vue'
import KfeSwipeBar from './KfeSwipeBar.vue'

const props = defineProps({
  form: { type: String, default: null },
  screenState: { type: String, required: true },
  activeTrip: { type: Object, default: null },
  busy: { type: Boolean, default: false },
  dayAllocationValid: { type: Boolean, default: false },
  personalAllocationValid: { type: Boolean, default: true },
  personalEndValid: { type: Boolean, default: false },
  shiftEndValid: { type: Boolean, default: false },
  businessEndValid: { type: Boolean, default: false },
})

const emit = defineEmits(['swipe','state-authority'])
const authorityState = ref(props.screenState)
const personalReturnState = ref('SHIFT_WAITING')
const isPersonalTrip = computed(() => props.activeTrip?.scope === 'PERSONAL' || props.activeTrip?.type === 'PERSONAL')

function publish(state) {
  authorityState.value = state
  emit('state-authority', state)
  window.dispatchEvent(new CustomEvent('kfe:swipe-state', { detail: { state, form: props.form || null } }))
}

function onSwipe(action) {
  if (action === 'START_PERSONAL_TRIP') {
    personalReturnState.value = authorityState.value === 'PERSONAL_TRIP' ? 'SHIFT_WAITING' : authorityState.value
    publish('PERSONAL_TRIP')
  } else if (action === 'END_PERSONAL_TRIP') {
    publish(personalReturnState.value)
  } else if (action === 'START_TRIP') {
    publish('BUSINESS_TRIP')
  } else if (action === 'END_TRIP') {
    publish('BUSINESS_TRIP')
  } else if (action === 'START_SHIFT') {
    publish('SHIFT_WAITING')
  } else if (action === 'END_SHIFT') {
    publish('DAY_READY')
  } else if (action === 'END_DAY') {
    publish('DAY_ENDED')
  } else if (action === 'START_DAY_CONFIRM') {
    publish('DAY_READY')
  } else if (action === 'START_PERSONAL_TRIP_CONFIRM') {
    publish('PERSONAL_TRIP')
  }
  emit('swipe', action)
}

watch(() => props.screenState, state => {
  if (['DAY_START','DAY_READY','SHIFT_WAITING','BUSINESS_TRIP','PERSONAL_TRIP','DAY_ENDED'].includes(state)) authorityState.value = state
}, { immediate: true })
</script>

<template>
  <div class="bottom-action" aria-label="Work action" data-state-authority="workflow">
    <KfeSwipeBar v-if="!form && authorityState === 'DAY_START'" left-label="START PERSONAL TRIP" right-label="START DAY" left-action="START_PERSONAL_TRIP" right-action="START_DAY" :disabled="busy" @swipe="onSwipe" />
    <KfeSwipeBar v-else-if="!form && authorityState === 'DAY_READY'" left-label="START PERSONAL TRIP" right-label="START SHIFT" left-action="START_PERSONAL_TRIP" right-action="START_SHIFT" :disabled="busy" @swipe="onSwipe" />
    <KfeSwipeBar v-else-if="!form && authorityState === 'SHIFT_WAITING'" left-label="START PERSONAL TRIP" right-label="START BUSINESS TRIP" left-action="START_PERSONAL_TRIP" right-action="START_TRIP" :disabled="busy" @swipe="onSwipe" />
    <KfeSwipeBar v-else-if="!form && authorityState === 'BUSINESS_TRIP'" right-label="END BUSINESS TRIP" right-action="END_TRIP" :disabled="busy" @swipe="onSwipe" />
    <KfeSwipeBar v-else-if="!form && authorityState === 'PERSONAL_TRIP'" right-label="END PERSONAL TRIP" right-action="END_PERSONAL_TRIP" :disabled="busy" @swipe="onSwipe" />
    <KfeSwipeBar v-else-if="!form && authorityState === 'DAY_ENDED'" right-label="START DAY" right-action="START_DAY" :disabled="busy" @swipe="onSwipe" />
    <KfeSwipeBar v-else-if="form === 'DAY_START'" right-label="CONFIRM START DAY" right-action="START_DAY_CONFIRM" :disabled="busy || !dayAllocationValid" @swipe="onSwipe" />
    <KfeSwipeBar v-else-if="form === 'PERSONAL_START'" right-label="START PERSONAL TRIP" right-action="START_PERSONAL_TRIP_CONFIRM" :disabled="busy || !personalAllocationValid" @swipe="onSwipe" />
    <KfeSwipeBar v-else-if="form === 'PERSONAL_END'" right-label="END PERSONAL TRIP" right-action="END_PERSONAL_TRIP" :disabled="busy || !personalEndValid" @swipe="onSwipe" />
    <KfeSwipeBar v-else-if="form === 'BUSINESS_END'" right-label="END BUSINESS TRIP" right-action="END_TRIP" :disabled="busy || !businessEndValid" @swipe="onSwipe" />
    <KfeSwipeBar v-else-if="form === 'SHIFT_END'" right-label="END SHIFT" right-action="END_SHIFT" :disabled="busy || !shiftEndValid" @swipe="onSwipe" />
  </div>
</template>
