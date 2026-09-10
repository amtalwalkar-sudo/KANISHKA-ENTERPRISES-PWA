<script setup>
import { computed, ref } from 'vue'
import { calculateTotalAmount, paiseToRupees } from '../domain/math/index.js'

const props = defineProps({
  application: { type: Object, required: true },
  entries: { type: Array, default: () => [] }
})

const emit = defineEmits(['select', 'edit', 'refresh'])

const searchFilter = ref('')
const selectedType = ref('ALL')

const filteredEntries = computed(() => {
  return props.entries.filter(entry => {
    const matchesType = selectedType.value === 'ALL' || (entry.type || entry.record_type) === selectedType.value
    const matchesQuery = !searchFilter.value || 
      (entry.notes && entry.notes.toLowerCase().includes(searchFilter.value.toLowerCase())) ||
      (entry.category && entry.category.toLowerCase().includes(searchFilter.value.toLowerCase())) ||
      (entry.reference && entry.reference.toLowerCase().includes(searchFilter.value.toLowerCase()))
    return matchesType && matchesQuery
  })
})

const totalPaise = computed(() => {
  return calculateTotalAmount(filteredEntries.value, 'amount_paise')
})

const totalRupees = computed(() => {
  return paiseToRupees(totalPaise.value)
})

function formatMoney(paise) {
  return `₹${paiseToRupees(paise || 0).toFixed(2)}`
}
</script>

<template>
  <section class="kfe-history-view">
    <div class="kfe-history-header">
      <div>
        <p class="kfe-eyebrow">AUDIT & RECORDS</p>
        <h2>Historical Entries</h2>
      </div>
      <button type="button" class="btn-refresh" @click="emit('refresh')">↻ Refresh</button>
    </div>

    <div class="kfe-history-filters">
      <input 
        v-model="searchFilter" 
        type="search" 
        placeholder="Search notes, category, reference..." 
        class="search-input"
      />
      <select v-model="selectedType" class="type-select">
        <option value="ALL">All Types</option>
        <option value="REVENUE">Revenue</option>
        <option value="EXPENSE">Expense</option>
        <option value="MAINTENANCE">Maintenance</option>
        <option value="FUEL">Fuel</option>
      </select>
    </div>

    <div class="kfe-history-summary">
      <span>Total ({{ filteredEntries.length }} items):</span>
      <strong>{{ formatMoney(totalPaise) }}</strong>
    </div>

    <div v-if="filteredEntries.length" class="kfe-history-list">
      <article 
        v-for="item in filteredEntries" 
        :key="item.id || item.entityId" 
        class="kfe-history-card"
        @click="emit('select', item)"
      >
        <div class="card-top">
          <span class="badge-type" :data-type="item.type || item.record_type">{{ item.type || item.record_type || 'ENTRY' }}</span>
          <span class="card-date">{{ item.date || item.recordedAt?.slice(0, 10) || '—' }}</span>
        </div>
        <div class="card-details">
          <p v-if="item.category" class="card-category">{{ item.category }}</p>
          <p v-if="item.notes" class="card-notes">{{ item.notes }}</p>
          <p v-if="item.reference" class="card-ref">Ref: {{ item.reference }}</p>
        </div>
        <div class="card-bottom">
          <strong class="card-amount">{{ formatMoney(item.amount_paise) }}</strong>
          <button type="button" class="btn-edit" @click.stop="emit('edit', item)">Edit</button>
        </div>
      </article>
    </div>
    <p v-else class="empty-state">No historical entries found.</p>
  </section>
</template>

<style scoped>
.kfe-history-view {
  padding: 0.8rem;
  background: var(--bg-surface, #ffffff);
  border-radius: 12px;
  border: 1px solid var(--border-color, #e2e8f0);
}
.kfe-history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}
.kfe-eyebrow {
  margin: 0;
  font-size: 0.52rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: var(--text-muted, #64748b);
}
.kfe-history-header h2 {
  margin: 0;
  font-size: 0.95rem;
}
.btn-refresh {
  padding: 0.3rem 0.5rem;
  border-radius: 6px;
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--bg-surface, #fff);
  font-size: 0.68rem;
  cursor: pointer;
}
.kfe-history-filters {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.6rem;
}
.search-input {
  flex: 1;
  padding: 0.38rem;
  border-radius: 6px;
  border: 1px solid var(--border-color, #cbd5e1);
  font-size: 0.75rem;
}
.type-select {
  padding: 0.38rem;
  border-radius: 6px;
  border: 1px solid var(--border-color, #cbd5e1);
  font-size: 0.72rem;
}
.kfe-history-summary {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0.5rem;
  background: var(--bg-subtle, #f8fafc);
  border-radius: 6px;
  font-size: 0.7rem;
  margin-bottom: 0.6rem;
}
.kfe-history-list {
  display: grid;
  gap: 0.5rem;
}
.kfe-history-card {
  padding: 0.6rem;
  border: 1px solid var(--border-color, #f1f5f9);
  border-radius: 8px;
  background: var(--bg-surface, #fff);
  cursor: pointer;
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.3rem;
}
.badge-type {
  font-size: 0.58rem;
  font-weight: 800;
  padding: 0.15rem 0.35rem;
  border-radius: 4px;
  background: #e0f2fe;
  color: #0369a1;
}
.badge-type[data-type="EXPENSE"] { background: #fee2e2; color: #b91c1c; }
.badge-type[data-type="FUEL"] { background: #fef3c7; color: #b45309; }
.card-date {
  font-size: 0.62rem;
  color: var(--text-muted, #64748b);
}
.card-details {
  font-size: 0.7rem;
  margin-bottom: 0.4rem;
}
.card-details p {
  margin: 0.1rem 0;
}
.card-notes {
  color: var(--text-muted, #475569);
}
.card-ref {
  font-size: 0.62rem;
  color: var(--text-muted, #94a3b8);
}
.card-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-amount {
  font-size: 0.85rem;
  color: var(--text-main, #0f172a);
}
.btn-edit {
  padding: 0.2rem 0.5rem;
  border-radius: 5px;
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--bg-surface, #fff);
  font-size: 0.65rem;
  cursor: pointer;
}
.empty-state {
  text-align: center;
  font-size: 0.72rem;
  color: var(--text-muted, #64748b);
  margin: 1rem 0;
}
</style>
