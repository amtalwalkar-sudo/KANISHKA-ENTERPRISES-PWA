<script setup>
import { ref } from 'vue'

const isTripActive = ref(false)

function toggleTrip() { 
  isTripActive.value = !isTripActive.value 
}
</script>

<template>
  <div class="view-root">
    <header class="view-header">
      <h2>Work Operational Stream</h2>
    </header>

    <div class="view-scroll-body">
      <div class="card">
        <h3>Shift Operational Stream</h3>
        <p>Driver lifecycle cards, active manifests, and tasks display here.</p>
      </div>
      <div class="card">
        <h3>Trip Status</h3>
        <div class="data-row">
          <span>Status</span>
          <strong :class="isTripActive ? 'text-green' : 'text-gray'">
            {{ isTripActive ? 'TRIP IN PROGRESS' : 'OFF TRIP' }}
          </strong>
        </div>
      </div>
    </div>

    <footer class="view-footer">
      <button
        type="button"
        class="action-btn"
        :class="isTripActive ? 'btn-danger' : 'btn-primary'"
        @click="toggleTrip"
      >
        {{ isTripActive ? 'END TRIP' : 'START TRIP' }}
      </button>
    </footer>
  </div>
</template>

<style scoped>
.view-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: var(--bg-app, #f8fafc);
  color: var(--text-main, #0f172a);
}

.view-header {
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background: var(--bg-surface, #ffffff);
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}
.view-header h2 { margin: 0; font-size: 1rem; font-weight: 700; color: var(--text-main, #0f172a); }

.view-scroll-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card {
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 8px;
  padding: 14px 16px;
}
.card h3 { margin: 0 0 8px 0; font-size: 0.9rem; color: var(--text-main, #334155); }
.card p { margin: 0; font-size: 0.85rem; color: var(--text-muted, #64748b); }

.data-row { display: flex; justify-content: space-between; font-size: 0.85rem; }
.text-green { color: var(--color-success, #16a34a); font-weight: 700; }
.text-gray { color: var(--text-muted, #64748b); font-weight: 700; }

.view-footer {
  height: 60px;
  flex-shrink: 0;
  padding: 8px 16px;
  background: var(--bg-surface, #ffffff);
  border-top: 1px solid var(--border-color, #e2e8f0);
}
.action-btn {
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.95rem;
  color: #ffffff;
  cursor: pointer;
}
.btn-primary { background: var(--color-primary, #2563eb); }
.btn-danger { background: var(--color-danger, #dc2626); }
</style>
