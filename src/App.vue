<script setup>
import { ref, onErrorCaptured, onMounted } from 'vue'
import { useWorkCycleStore } from './stores/workCycle'
import { initializeCanonicalStorage } from './utils/indexedDB'

const store = useWorkCycleStore()
const renderError = ref(null)
const storageReady = ref(false)
const storageError = ref(null)

onErrorCaptured((err) => {
  console.error('Captured Runtime Boundary Error:', err)
  renderError.value = err.message || 'An unexpected rendering error occurred.'
  return false
})

const recoverApp = () => {
  renderError.value = null
  storageError.value = null
  storageReady.value = false
  window.location.reload()
}

onMounted(async () => {
  try {
    await initializeCanonicalStorage()
    await store.loadLastOdometer()
    storageReady.value = true
  } catch (e) {
    console.error('App storage initialization failed:', e)
    storageError.value = e?.message || 'Canonical storage initialization failed.'
  }
})
</script>

<template>
  <div class="viewport-wrapper">
    <header class="top-bar">
      <span class="app-title">Kanishka Driver App</span>
      <span class="status-pill" :class="{ online: store.isOnline }">
        {{ store.isOnline ? 'ON SHIFT' : 'OFFLINE' }}
      </span>
    </header>

    <main class="content-scroll-area">
      <div v-if="renderError" class="error-container">
        <h3>Something went wrong</h3>
        <p>{{ renderError }}</p>
        <button @click="recoverApp" class="retry-btn">🔄 Reload Application</button>
      </div>

      <div v-else-if="storageError" class="error-container">
        <h3>Storage initialization failed</h3>
        <p>{{ storageError }}</p>
        <p>The application has not entered operational mode so fleet records cannot be written against an unverified storage layer.</p>
        <button @click="recoverApp" class="retry-btn">🔄 Retry Initialization</button>
      </div>

      <div v-else-if="!storageReady" class="loading-container">
        <p>Initializing secure local storage…</p>
      </div>

      <router-view v-else v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>

    <nav class="bottom-nav">
      <router-link to="/" class="nav-item">
        <span class="icon">🛺</span>
        <span>Work</span>
      </router-link>
      <router-link to="/performance" class="nav-item">
        <span class="icon">📈</span>
        <span>Performance</span>
      </router-link>
      <router-link to="/admin" class="nav-item">
        <span class="icon">⚙️</span>
        <span>Admin</span>
      </router-link>
    </nav>
  </div>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
  font-family: system-ui, -apple-system, sans-serif;
}
</style>

<style scoped>
.viewport-wrapper {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex; flex-direction: column;
  height: 100vh; width: 100vw;
  background-color: #f8fafc;
  overflow: hidden;
}

.top-bar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 48px;
  background: #0f172a;
  color: white;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px;
  z-index: 9999;
}

.app-title { font-weight: bold; font-size: 0.9rem; }

.status-pill {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 12px;
  background: #475569;
}

.status-pill.online { background: #16a34a; }

.content-scroll-area {
  position: absolute;
  top: 48px; bottom: 60px;
  left: 0; right: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.bottom-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 60px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  display: flex; justify-content: space-around; align-items: center;
  z-index: 9999;
}

.nav-item {
  display: flex; flex-direction: column; align-items: center;
  text-decoration: none; color: #64748b; font-size: 0.75rem;
}

.nav-item.router-link-active {
  color: #2563eb;
  font-weight: bold;
}

.icon { font-size: 1.2rem; }

.error-container, .loading-container {
  padding: 20px;
  text-align: center;
}

.error-container { color: #dc2626; }

.retry-btn {
  padding: 10px 16px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
}
</style>
