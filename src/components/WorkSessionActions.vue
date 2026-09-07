<script setup>
import { ref, watch } from 'vue'
import KfeSwipeBar from './KfeSwipeBar.vue'
import StartShiftForm from './StartShiftForm.vue'

const props = defineProps({
  form: { type: String, default: null },
  screenState: { type: String, required: true },
  busy: { type: Boolean, default: false },
  latestOdometer: { type: [Number, String], default: null },
  stagedShiftOdometer: { type: [Number, String], default: null },
  dayAllocationValid: { type: Boolean, default: false },
  personalAllocationValid: { type: Boolean, default: true },
  personalEndValid: { type: Boolean, default: false },
  shiftEndValid: { type: Boolean, default: false },
  shiftRevenueValid: { type: Boolean, default: false },
  businessEndValid: { type: Boolean, default: false },
})

const emit = defineEmits(['swipe', 'state-authority'])
const authorityState = ref(props.screenState)
const startShiftOpen = ref(false)
const personalReturnState = ref('DAY_READY')
const pendingShiftOdometer = ref(props.stagedShiftOdometer == null ? null : Number(props.stagedShiftOdometer))

function publishAuthority(state = authorityState.value) {
  authorityState.value = state
  emit('state-authority', state)
  window.dispatchEvent(new CustomEvent('kfe:swipe-state', { detail: { state, form: props.form || null } }))
}

function onSwipe(action) {
  if (action === 'START_SHIFT') {
    if (startShiftOpen.value) return
    if (authorityState.value === 'SHIFT_WAITING') {
      emit('swipe', { action: 'START_SHIFT', odometer: pendingShiftOdometer.value })
    } else {
      startShiftOpen.value = true
      publishAuthority('STARTING_SHIFT')
    }
    return
  }
  if (action === 'START_PERSONAL_TRIP') {
    personalReturnState.value = authorityState.value
    publishAuthority('PERSONAL_TRIP')
    emit('swipe', action)
    return
  }
  if (action === 'END_PERSONAL_TRIP') {
    publishAuthority('PERSONAL_TRIP')
    emit('swipe', action)
    return
  }
  if (action === 'END_TRIP') {
    publishAuthority('BUSINESS_END')
    emit('swipe', action)
    return
  }
  const transitions = {
    START_DAY: 'DAY_START',
    START_DAY_CONFIRM: 'DAY_READY',
    START_PERSONAL_TRIP_CONFIRM: 'PERSONAL_TRIP',
    CLOSE_PERSONAL_TRIP: personalReturnState.value,
    CLOSE_BUSINESS_TRIP: 'SHIFT_WAITING',
    END_SHIFT: 'DAY_READY',
    START_TRIP: 'BUSINESS_TRIP',
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

function submitStartShift(odometer) {
  startShiftOpen.value = false
  pendingShiftOdometer.value = Number.isFinite(Number(odometer)) ? Number(odometer) : null
  publishAuthority('SHIFT_WAITING')
}

watch(() => props.stagedShiftOdometer, value => {
  if (value != null && Number.isFinite(Number(value))) pendingShiftOdometer.value = Number(value)
})

watch(() => props.screenState, state => {
  if (state === 'SHIFT_WAITING' || state === 'BUSINESS_TRIP' || state === 'PERSONAL_TRIP' || state === 'DAY_START' || state === 'DAY_ENDED') {
    authorityState.value = state
  } else if (!startShiftOpen.value && authorityState.value !== 'SHIFT_WAITING') {
    authorityState.value = state
  }
  if (state === 'SHIFT_WAITING' && props.stagedShiftOdometer == null) {
    startShiftOpen.value = false
  }
}, { immediate: true })
</script>

<template>
  <div class="bottom-action" aria-label="Work action" data-state-authority="swipe-bar">
    <span v-if="!form && authorityState === 'DAY_START'" data-kfe-action="start-trip"><KfeSwipeBar left-label="START PERSONAL TRIP" right-label="START DAY" left-action="START_PERSONAL_TRIP" right-action="START_DAY" :disabled="busy" @swipe="onSwipe" /></span>
    <KfeSwipeBar v-else-if="!form && authorityState === 'DAY_ENDED'" right-label="START DAY" right-action="START_DAY" :disabled="busy" @swipe="onSwipe" />
    <span v-else-if="!form && authorityState === 'DAY_READY'" data-kfe-action="start-trip"><KfeSwipeBar left-label="START PERSONAL TRIP" right-label="START SHIFT" left-action="START_PERSONAL_TRIP" right-action="START_SHIFT" :disabled="busy" @swipe="onSwipe" /></span>
    <span v-else-if="!form && authorityState === 'SHIFT_WAITING'" data-kfe-action="start-trip"><KfeSwipeBar left-label="START PERSONAL TRIP" right-label="START SHIFT" left-action="START_PERSONAL_TRIP" right-action="START_SHIFT" :disabled="busy" @swipe="onSwipe" /></span>
    <span v-else-if="!form && authorityState === 'BUSINESS_TRIP'" data-kfe-action="end-trip"><KfeSwipeBar right-label="END BUSINESS TRIP" right-action="END_TRIP" :disabled="busy" @swipe="onSwipe" /></span>
    <span v-else-if="!form && authorityState === 'PERSONAL_TRIP'" data-kfe-action="end-trip"><KfeSwipeBar right-label="END PERSONAL TRIP" right-action="END_PERSONAL_TRIP" :disabled="busy" @swipe="onSwipe" /></span>
    <KfeSwipeBar v-else-if="form === 'DAY_START'" right-label="CONFIRM START DAY" right-action="START_DAY_CONFIRM" :disabled="busy || !dayAllocationValid" @swipe="onSwipe" />
    <KfeSwipeBar v-else-if="form === 'PERSONAL_START'" right-label="START PERSONAL TRIP" right-action="START_PERSONAL_TRIP_CONFIRM" :disabled="busy || !personalAllocationValid" @swipe="onSwipe" />
    <KfeSwipeBar v-else-if="form === 'PERSONAL_END'" right-label="END TRIP" right-action="CLOSE_PERSONAL_TRIP" :disabled="busy || !personalEndValid" @swipe="onSwipe" />
    <KfeSwipeBar v-else-if="form === 'BUSINESS_END'" left-label="END TRIP" left-action="CLOSE_BUSINESS_TRIP" :disabled="busy || !businessEndValid" @swipe="onSwipe" />
    <KfeSwipeBar v-else-if="form === 'SHIFT_END'" left-label="CLOSE SHIFT" left-action="CLOSE_SHIFT" :disabled="busy || !shiftEndValid || !shiftRevenueValid" @swipe="onSwipe" />
  </div>
  <StartShiftForm v-if="startShiftOpen" :previous-odometer="props.latestOdometer" :busy="props.busy" @close="closeStartShift" @submitted="submitStartShift" />
</template>
