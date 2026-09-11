<template>
  <div class="work-view">
    <header class="work-header">
      <h2>Work Menu</h2>
      <p class="subtitle">Operational actions and shift workflow</p>
    </header>

    <div class="work-card">
      <h3>Active Session</h3>
      <p>Ready to integrate shift tracking and task logging.</p>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.work-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.work-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
}

.subtitle {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: #64748b;
}

.work-card {
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.work-card h3 {
  margin: 0 0 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
}

.work-card p {
  margin: 0;
  font-size: 0.875rem;
  color: #475569;
}
</style>
