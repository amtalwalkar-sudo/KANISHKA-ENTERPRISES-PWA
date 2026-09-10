<script setup>
defineProps({
  title: { type: String, default: 'Kanishka Enterprises' },
  subtitle: { type: String, default: '' }
})

const emit = defineEmits(['back', 'refresh'])
</script>

<template>
  <div class="app-layout">
    <header class="app-header">
      <div class="header-left">
        <button v-if="$attrs.onBack" type="button" class="btn-icon" @click="emit('back')">←</button>
        <div>
          <h1 class="app-title">{{ title }}</h1>
          <p v-if="subtitle" class="app-subtitle">{{ subtitle }}</p>
        </div>
      </div>
      <div class="header-actions">
        <slot name="actions">
          <button v-if="$attrs.onRefresh" type="button" class="btn-icon" @click="emit('refresh')">↻</button>
        </slot>
      </div>
    </header>

    <main class="app-main">
      <slot />
    </main>

    <footer v-if="$slots.footer" class="app-footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--bg-app, #f8fafc);
  color: var(--text-main, #0f172a);
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1rem;
  background: var(--bg-surface, #ffffff);
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  position: sticky;
  top: 0;
  z-index: 10;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.app-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}
.app-subtitle {
  margin: 0;
  font-size: 0.65rem;
  color: var(--text-muted, #64748b);
}
.btn-icon {
  background: transparent;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
}
.app-main {
  flex: 1;
  padding: 1rem;
}
.app-footer {
  padding: 0.8rem 1rem;
  background: var(--bg-surface, #ffffff);
  border-top: 1px solid var(--border-color, #e2e8f0);
}
</style>
