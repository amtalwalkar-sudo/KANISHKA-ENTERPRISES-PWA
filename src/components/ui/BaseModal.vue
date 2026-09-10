<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' }
})

const emit = defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
      <div class="modal-card" role="dialog" aria-modal="true">
        <header class="modal-header">
          <h3 class="modal-title">{{ title }}</h3>
          <button type="button" class="modal-close-btn" @click="emit('close')">✕</button>
        </header>

        <div class="modal-body">
          <slot />
        </div>

        <footer v-if="$slots.actions" class="modal-footer">
          <slot name="actions" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 100;
  backdrop-filter: blur(2px);
}
.modal-card {
  background: var(--bg-surface, #ffffff);
  border-radius: 12px;
  border: 1px solid var(--border-color, #e2e8f0);
  width: 100%;
  max-width: 480px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1rem;
  border-bottom: 1px solid var(--border-color, #f1f5f9);
}
.modal-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
}
.modal-close-btn {
  background: transparent;
  border: none;
  font-size: 0.85rem;
  cursor: pointer;
  color: var(--text-muted, #64748b);
}
.modal-body {
  padding: 1rem;
  overflow-y: auto;
  max-height: 70vh;
}
.modal-footer {
  padding: 0.8rem 1rem;
  border-top: 1px solid var(--border-color, #f1f5f9);
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
