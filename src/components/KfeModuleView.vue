<script setup>
import { computed, ref } from 'vue'
import { calculateTotalAmount, paiseToRupees, rupeesToPaise } from '../domain/math/index.js'

const props = defineProps({
  application: { type: Object, required: true },
  title: { type: String, default: 'Module Summary' },
  records: { type: Array, default: () => [] },
  currencySymbol: { type: String, default: '₹' }
})

const emit = defineEmits(['refresh', 'select'])

const filterType = ref('ALL')

const filteredRecords = computed(() => {
  if (filterType.value === 'ALL') return props.records
  return props.records.filter(r => r.type === filterType.value || r.record_type === filterType.value)
})

const totalAmountPaise = computed(() => {
  return calculateTotalAmount(filteredRecords.value, 'amount_paise')
})

const totalAmountRupees = computed(() => {
  return paiseToRupees(totalAmountPaise.value)
})

function formatAmount(paise) {
  return `${props.currencySymbol}${paiseToRupees(paise).toFixed(2)}`
}

function toPaiseInput(rupees) {
  return rupeesToPaise(rupees)
}
</script>

<template>
  <section class="kfe-module-view">
    <header class="kfe-module-header">
      <h2>{{ title }}</h2>
      <div class="kfe-module-stats">
        <span class="stat-label">Total Filtered:</span>
        <strong class="stat-value">{{ formatAmount(totalAmountPaise) }}</strong>
      </div>
    </header>

    <div class="kfe-module-controls">
      <label>
        Filter Type:
        <select v-model="filterType">
          <option value="ALL">All Records</option>
          <option value="REVENUE">Revenue</option>
          <option value="EXPENSE">Expense</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="FUEL">Fuel</option>
        </select>
      </label>
      <button type="button" class="kfe-refresh-btn" @click="emit('refresh')">Refresh</button>
    </div>

    <ul v-if="filteredRecords.length" class="kfe-record-list">
      <li 
        v-for="item in filteredRecords" 
        :key="item.id || item.entityId" 
        class="kfe-record-item"
        @click="emit('select', item)"
      >
        <div class="item-main">
          <span class="item-type">{{ item.type || item.record_type || 'RECORD' }}</span>
          <span class="item-date">{{ item.date || item.recordedAt?.slice(0, 10) || '—' }}</span>
        </div>
        <div class="item-amount">
          <strong>{{ formatAmount(item.amount_paise ?? rupeesToPaise(item.amount || 0)) }}</strong>
        </div>
      </li>
    </ul>
    <p v-else class="kfe-empty-msg">No records found matching the criteria.</p>
  </section>
</template>

<style scoped>
.kfe-module-view {
  padding: 0.8rem;
  background: var(--bg-surface, #ffffff);
  border-radius: 12px;
  border: 1px solid var(--border-color, #e2e8f0);
}
.kfe-module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}
.kfe-module-header h2 {
  margin: 0;
  font-size: 1rem;
}
.kfe-module-stats {
  font-size: 0.75rem;
  color: var(--text-muted, #64748b);
}
.stat-value {
  color: var(--text-main, #0f172a);
  font-size: 0.85rem;
  margin-left: 0.2rem;
}
.kfe-module-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
  font-size: 0.7rem;
}
.kfe-module-controls select {
  padding: 0.3rem 0.4rem;
  border-radius: 6px;
  border: 1px solid var(--border-color, #cbd5e1);
  font-size: 0.75rem;
}
.kfe-refresh-btn {
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  border: 1px solid var(--border-color, #cbd5e1);
  background: var(--bg-surface, #fff);
  cursor: pointer;
  font-size: 0.7rem;
}
.kfe-record-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.4rem;
}
.kfe-record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--border-color, #f1f5f9);
  border-radius: 8px;
  background: var(--bg-subtle, #f8fafc);
  cursor: pointer;
}
.item-main {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.item-type {
  font-size: 0.65rem;
  font-weight: 800;
  color: var(--color-primary, #2563eb);
}
.item-date {
  font-size: 0.6rem;
  color: var(--text-muted, #64748b);
}
.item-amount {
  font-size: 0.8rem;
}
.kfe-empty-msg {
  font-size: 0.7rem;
  color: var(--text-muted, #64748b);
  text-align: center;
  margin: 1rem 0;
}
</style>
