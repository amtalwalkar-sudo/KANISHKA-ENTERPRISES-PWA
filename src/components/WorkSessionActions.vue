<script setup>
import { ref, watch } from 'vue'
import KfeSwipeBar from './KfeSwipeBar.vue'
import StartShiftForm from './StartShiftForm.vue'

const props = defineProps({
  form: { type: String, default: null },
  screenState: { type: String, required: true },
  busy: { type: Boolean, default: false },
  latestOdometer: { type: [Number, String], default: null },
  dayAllocationValid: { type: Boolean, default: false },
  personalAllocationValid: { type: Boolean, default: false },
  personalEndValid: { type: Boolean, default: false },
  shiftEndValid: { type: Boolean, default: false },
  shiftRevenueValid: { type: Boolean, default: false },
})

const emit = defineEmits(['swipe', 'state-authority'])
const authorityState = ref(props.screenState)
const startShiftOpen = ref(false)

function publishAuthority(state = authorityState.value) {
  authorityState.value = state
  emit('state-authority', state)
  window.dispatchEvent(new CustomEvent('kfe:swipe-state', {
    detail: { state, form: props.form || null },
  }))
}

const transitions = Object.freeze({
  START_DAY: 'DAY_START',
  START_DAY_CONFIRM: 'DAY_READY',
  START_PERSONAL_TRIP: 'PERSONAL_TRIP',
  START_PERSONAL_TRIP_CONFIRM: 'PERSONAL_TRIP',
  CLOSE_PERSONAL_TRIP: 'DAY_READY',
  END_PERSONAL_TRIP: 'DAY_READY',
  START_SHIFT: 'STARTING_SHIFT',
  START_TRIP: 'BUSINESS_TRIP',
  END_TRIP: 'SHIFT_WAITING',
  END_SHIFT: 'DAY_READY',
})

function onSwipe(action) {
  if (action === 'START_SHIFT') {
    startShiftOpen.value = true
    publishAuthority('STARTING_SHIFT')
    return
  }
  const next = transitions[action]
  if (next) publishAuthority(next)
  emit('swipe', action)
}
function closeStartShift() {
  if (props.busy) return
  startShiftOpen.value = false
  publishAuthority(props.screenState)
}
function submitStartShift() {
  startShiftOpen.value = false
  publishAuthority('SHIFT_WAITING')
  emit('swipe', 'START_SHIFT_CONFIRMED')
}

watch(() => props.screenState, state => {
  publishAuthority(state)
  if (state === 'SHIFT_WAITING') startShiftOpen.value = false
}, { immediate: true })
</script>

<template>
  <div class="bottom-action" aria-label="Work action" data-state-authority="swipe-bar">
    <KfeSwipeBar v-if="!form && screenState === 'DAY_START'" left-label=" START PERSONAL TRIP" right-label="START DAY " left-action="START_PERSONAL_TRIP" right-action="START_DAY" :disabled="busy" @swipe="onSwipe" />
    <KfeSwipeBar v-else-if="!form && screenState === 'DAY_ENDED'" right-label="START DAY " right-action="START_DAY" :disabled="busy" @swipe="onSwipe" />
    <KfeSwipeBar v-else-if="!form && screenState === 'DAY_READY'" left-label=" START PERSONAL TRIP" right-label="START BUSINESS SHIFT " left-action="START_PERSONAL_TRIP" right-action="START_SHIFT" :disabled="busy || startShiftOpen" @swipe="onSwipe" />
    <KfeSwipeBar v-else-if="!form && screenState === 'SHIFT_WAITING'" left-label=" END SHIFT" right-label="START BUSINESS TRIP " left-action="END_SHIFT" right-action="START_TRIP" :disabled="busy" @swipe="onSwipe" />
    <KfeSwipeBar v-else-if="!form && screenState === 'BUSINESS_TRIP'" right-label="END BUSINESS TRIP " right-action="END_TRIP" :disabled="busy" @swipe="onSwipe" />
    <KfeSwipeBar v-else-if="!form && screenState === 'PERSONAL_TRIP'" right-label="END PERSONAL TRIP " right-action="END_PERSONAL_TRIP" :disabled="busy" @swipe="onSwipe" />
    <KfeSwipeBar v-else-if="form === 'DAY_START'" right-label="CONFIRM START DAY " right-action="START_DAY_CONFIRM" :disabled="busy || !dayAllocationValid" @swipe="onSwipe" />
    <KfeSwipeBar v-else-if="form === 'PERSONAL_START'" right-label="START PERSONAL TRIP " right-action="START_PERSONAL_TRIP_CONFIRM" :disabled="busy || !personalAllocationValid" @swipe="onSwipe" />
    <KfeSwipeBar v-else-if="form === 'PERSONAL_END'" right-label="CLOSE PERSONAL TRIP " right-action="CLOSE_PERSONAL_TRIP" :disabled="busy || !personalEndValid" @swipe="onSwipe" />
    <KfeSwipeBar v-else-if="form === 'SHIFT_END'" left-label=" CLOSE SHIFT" left-action="CLOSE_SHIFT" :disabled="busy || !shiftEndValid || !shiftRevenueValid" @swipe="onSwipe" />
  </div>
  <StartShiftForm v-if="startShiftOpen" :previous-odometer="props.latestOdometer" :busy="props.busy" @close="closeStartShift" @submitted="submitStartShift" />
</template>
