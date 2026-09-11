<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<template>
  <nav class="bottom-nav">
    <router-link to="/" class="nav-item" :class="{ active: route.path === '/' }">
      <span class="icon">🛺</span>
      <span class="label">Work</span>
    </router-link>
    <router-link to="/performance" class="nav-item" :class="{ active: route.path === '/performance' }">
      <span class="icon">📈</span>
      <span class="label">Performance</span>
    </router-link>
    <router-link to="/admin" class="nav-item" :class="{ active: route.path === '/admin' }">
      <span class="icon">⚙️</span>
      <span class="label">Admin</span>
    </router-link>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #0f172a;
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 1px solid #1e293b;
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #94a3b8;
  font-size: 0.75rem;
  width: 100%;
  height: 100%;
}

.nav-item.active {
  color: #38bdf8;
  font-weight: bold;
}

.icon {
  font-size: 1.25rem;
  margin-bottom: 2px;
}
</style>
