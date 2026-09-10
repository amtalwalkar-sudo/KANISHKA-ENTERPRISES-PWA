<template>
  <div
    ref="trackRef"
    class="swipe-bar"
    :class="{ 'swipe-bar--dragging': isDragging }"
    data-testid="kfe-swipe-bar"
    role="slider"
    :aria-valuemin="0"
    :aria-valuemax="100"
    :aria-valuenow="ariaValueNow"
    :aria-valuetext="label"
  >
    <div
      class="swipe-bar__fill"
      :style="{ width: `${progress}%` }"
    ></div>

    <span class="swipe-bar__label">{{ label }}</span>

    <button
      ref="thumbRef"
      type="button"
      class="swipe-bar__thumb"
      :aria-label="label"
      :style="{ left: `calc(${progress}% - 24px)` }"
      @pointerdown="handlePointerDown"
    >
      →
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue';

const props = defineProps({
  label: {
    type: String,
    default: 'Swipe right to start day'
  },
  threshold: {
    type: Number,
    default: 80
  }
});

const emit = defineEmits(['complete']);

const trackRef = ref(null);
const thumbRef = ref(null);
const progress = ref(0);
const isDragging = ref(false);

let startX = 0;
let trackWidth = 0;
let activePointerId = null;

const ariaValueNow = computed(() => {
  const current = progress.value;
  if (typeof current !== 'number' || Number.isNaN(current)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(current)));
});

const handlePointerDown = (e) => {
  if (isDragging.value) return;

  const trackRect = trackRef.value?.getBoundingClientRect();
  const measuredWidth = trackRect?.width || 0;

  if (measuredWidth <= 0) {
    progress.value = 0;
    return;
  }

  trackWidth = measuredWidth;
  startX = typeof e.clientX === 'number' ? e.clientX : 0;
  activePointerId = e.pointerId;
  isDragging.value = true;

  if (e.target && typeof e.target.setPointerCapture === 'function') {
    try {
      e.target.setPointerCapture(e.pointerId);
    } catch (_) {
      /* Safe catch for synthetic pointer IDs */
    }
  }

  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
  window.addEventListener('pointercancel', handlePointerUp);
};

const handlePointerMove = (e) => {
  if (!isDragging.value) return;
  if (activePointerId !== null && e.pointerId !== activePointerId) return;

  if (trackWidth <= 0) {
    const trackRect = trackRef.value?.getBoundingClientRect();
    trackWidth = trackRect?.width || 0;
  }

  if (trackWidth <= 0 || typeof e.clientX !== 'number') {
    progress.value = 0;
    return;
  }

  const delta = e.clientX - startX;
  const rawProgress = (delta / trackWidth) * 100;

  if (Number.isNaN(rawProgress)) {
    progress.value = 0;
  } else {
    progress.value = Math.max(0, Math.min(100, rawProgress));
  }
};

const handlePointerUp = (e) => {
  if (!isDragging.value) return;
  if (activePointerId !== null && e.pointerId !== activePointerId) return;

  isDragging.value = false;

  if (thumbRef.value && typeof thumbRef.value.releasePointerCapture === 'function') {
    try {
      thumbRef.value.releasePointerCapture(e.pointerId);
    } catch (_) {}
  }

  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerup', handlePointerUp);
  window.removeEventListener('pointercancel', handlePointerUp);

  const safeProgress = Number.isNaN(progress.value) ? 0 : progress.value;

  if (safeProgress >= props.threshold) {
    progress.value = 100;
    emit('complete');
  } else {
    progress.value = 0;
  }

  activePointerId = null;
};

onUnmounted(() => {
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerup', handlePointerUp);
  window.removeEventListener('pointercancel', handlePointerUp);
});
</script>

<style scoped>
.swipe-bar {
  position: relative;
  width: 100%;
  height: 48px;
  background-color: var(--swipe-bg, #e2e8f0);
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  touch-action: none;
}

.swipe-bar__fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background-color: var(--swipe-fill-bg, #10b981);
  transition: width 0.2s ease-out;
  pointer-events: none;
}

.swipe-bar__label {
  position: relative;
  z-index: 1;
  font-weight: 600;
  color: var(--swipe-text-color, #334155);
  pointer-events: none;
  user-select: none;
}

.swipe-bar__thumb {
  position: absolute;
  z-index: 2;
  top: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background-color: var(--swipe-thumb-bg, #ffffff);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: bold;
  touch-action: none;
  transition: left 0.2s ease-out;
}

.swipe-bar--dragging .swipe-bar__fill,
.swipe-bar--dragging .swipe-bar__thumb {
  transition: none;
}

.swipe-bar__thumb:active {
  cursor: grabbing;
}
</style>
