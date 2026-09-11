<script setup>
import { onMounted } from 'vue'
import { useWorkCycleStore } from './stores/workCycle'

const store = useWorkCycleStore()

onMounted(async () => {
  // Ensure background sync doesn't crash navigation
  try {
    await store.loadLastOdometer()
  } catch (e) {
    console.error('App init error:', e)
  }
})
</script>

<template>
  <div class="app-shell">
    <!-- TOP GLOBAL HEADER -->
    <header class="top-bar">
      <span class="app-title">Kanishka Driver App</span>
      <span class="status-pill" :class="{ online: store.isOnline }">
        {{ store.isOnline ? 'ON SHIFT' : 'OFFLINE' }}
      </span>
    </header>

    <!-- ROUTER VIEW / PAGE CONTENT (ISOLATED) -->
    <main class="content-area">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </main>

    <!-- FIXED BOTTOM NAVIGATION SHELL -->
    <nav class="bottom-nav">
      <router-link to="/" class="nav-item">
        <span class="icon">🛺</span>
        <span class="label">Work</span>
      </router-link>
      <router-link to="/performance" class="nav-item">
        <span class="icon">📈</span>
        <span class="label">Performance</span>
      </router-link>
    </nav>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background-color: #f8fafc;
  overflow: hidden;
}
.top-bar {
  height: 48px;
  background: #0f172a;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
}
.app-title {
  font-weight: bold;
  font-size: 0.9rem;
}
.status-pill {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 12px;
  background: #475569;
}
.status-pill.online {
  background: #16a34a;
}
.content-area {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.bottom-nav {
  height: 60px;
  background: #ffffff;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-shrink: 0;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #64748b;
  font-size: 0.75rem;
}
.nav-item.router-link-active {
  color: #2563eb;
  font-weight: bold;
}
.icon {
  font-size: 1.2rem;
}
</style>
