<script setup>
import { ref } from 'vue'

const props = defineProps({
  leftLabel: { type: String, default: '' },
  rightLabel: { type: String, default: '' },
  leftAction: { type: String, default: '' },
  rightAction: { type: String, default: '' },
  leftDisabled: { type: Boolean, default: false },
  rightDisabled: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['swipe'])
const startX = ref(0)
const startY = ref(0)
const capturing = ref(false)

function down(event) {
  if (props.disabled) return
  startX.value = event.clientX
  startY.value = event.clientY
  capturing.value = true
  event.currentTarget.setPointerCapture?.(event.pointerId)
}

function up(event) {
  if (!capturing.value) return
  capturing.value = false
  const dx = event.clientX - startX.value
  const dy = event.clientY - startY.value
  event.currentTarget.releasePointerCapture?.(event.pointerId)
  const threshold = Math.max(72, event.currentTarget.clientWidth * 0.22)
  if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.15) return

  const left = dx < 0
  const action = left ? props.leftAction : props.rightAction
  const blocked = props.disabled || (left ? props.leftDisabled : props.rightDisabled)
  if (action && !blocked) emit('swipe', action)
}

function keyboard(event) {
  if (event.key !== 'Enter' && event.key !== ' ') return
  event.preventDefault()
  if (props.disabled) return
  if (props.rightAction && !props.rightDisabled) emit('swipe', props.rightAction)
  else if (props.leftAction && !props.leftDisabled) emit('swipe', props.leftAction)
}

function accessibleClick(event) {
  if (event.detail !== 0 || props.disabled) return
  if (props.rightAction && !props.rightDisabled) emit('swipe', props.rightAction)
  else if (props.leftAction && !props.leftDisabled) emit('swipe', props.leftAction)
}
</script>

<template>
  <div
    class="kfe-swipe-bar"
    :class="{ 'is-disabled': disabled, 'is-dual': Boolean(leftLabel && rightLabel) }"
    role="button"
    tabindex="0"
    :aria-disabled="disabled"
    :aria-label="[leftLabel, rightLabel].filter(Boolean).join(' or ')"
    @pointerdown="down"
    @pointerup="up"
    @pointercancel="capturing = false"
    @keydown="keyboard"
    @click="accessibleClick"
  >
    <span v-if="leftLabel" class="kfe-swipe-left" :class="{ 'is-action-disabled': leftDisabled }"><b>←</b>{{ leftLabel }}</span>
    <span v-if="rightLabel" class="kfe-swipe-right" :class="{ 'is-action-disabled': rightDisabled }">{{ rightLabel }}<b>→</b></span>
  </div>
</template>
