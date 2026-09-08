<script setup>
defineEmits(['start-shift', 'start-business-trip', 'start-personal-trip'])
</script>

<template>
  <article class="shift-waiting-card" aria-labelledby="shift-waiting-title">
    <header class="card-header">
      <span class="status-pill waiting">Day Open • Waiting</span>
      <h2 id="shift-waiting-title" class="card-title">Start Work Activity</h2>
    </header>

    <div class="card-body">
      <p class="instruction-text">
        Select an activity to begin tracking your time and mileage.
      </p>
    </div>

    <div class="card-actions">
      <button
        type="button"
        class="btn btn-primary btn-large"
        @click="$emit('start-shift')"
      >
        Start Shift
      </button>

      <div class="secondary-actions">
        <button
          type="button"
          class="btn btn-secondary"
          @click="$emit('start-business-trip')"
        >
          Business Trip
        </button>

        <button
          type="button"
          class="btn btn-secondary"
          @click="$emit('start-personal-trip')"
        >
          Personal Trip
        </button>
      </div>
    </div>
  </article>
</template>

<style scoped>
.shift-waiting-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 18px;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
  border: 1px solid var(--kfe-ui-border);
  border-radius: 20px;
  background: var(--kfe-ui-surface);
  color: var(--kfe-ui-text);
  box-shadow: var(--kfe-ui-shadow);
}

.card-header,
.card-body,
.card-actions,
.secondary-actions {
  display: grid;
}

.card-header { gap: 8px; }
.card-body { gap: 6px; }
.card-actions { gap: 10px; }
.secondary-actions { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }

.status-pill {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--kfe-accent-soft);
  color: var(--kfe-accent);
  font-size: .7rem;
  font-weight: 900;
}

.card-title {
  margin: 0;
  font-size: clamp(1.35rem, 5vw, 1.75rem);
  line-height: 1.15;
  letter-spacing: -.02em;
}

.instruction-text {
  margin: 0;
  color: var(--kfe-muted-text);
  font-size: .86rem;
  line-height: 1.45;
}

.btn {
  min-height: 48px;
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 850;
}

.btn-primary {
  min-height: 56px;
  background: var(--kfe-accent);
  color: #fff;
}

.btn-secondary {
  border: 1px solid var(--kfe-ui-border);
  background: var(--kfe-ui-bg);
  color: var(--kfe-ui-text);
}

.btn:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--kfe-accent) 70%, transparent);
  outline-offset: 2px;
}

@media (max-width: 360px) {
  .shift-waiting-card { padding: 12px; gap: 12px; }
  .secondary-actions { grid-template-columns: 1fr; }
}
</style>
