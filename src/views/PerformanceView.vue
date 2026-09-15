<script setup>
import { computed, ref } from 'vue'

const period = ref('MONTH')
const selectedLayer = ref(null)

const cards = [
  { id: 'target', icon: '🎯', title: 'Target & Position', metrics: ['Target', 'Achieved', 'Achievement %', 'Remaining', 'Status'] },
  { id: 'revenue', icon: '💰', title: 'Revenue', metrics: ['Total revenue', 'Revenue/KM', 'Revenue/trip', 'Revenue/hour'] },
  { id: 'cost', icon: '🧾', title: 'Cost & Break-even', metrics: ['Actual cost', 'Cost/KM', 'Break-even', 'Status'] },
  { id: 'profit', icon: '🏦', title: 'Profit & Provisions', metrics: ['Profit', 'Margin', 'Provision coverage', 'Surplus / shortfall'] }
]

const layers = {
  target: ['Position', 'Pace & projection', 'Target drivers', 'Comparison', 'Detailed period'],
  revenue: ['Revenue position', 'Revenue composition', 'Revenue efficiency', 'Time & trend', 'Detailed revenue'],
  cost: ['Break-even position', 'Cost drivers', 'Cost movement', 'Break-even analysis', 'Detailed costs'],
  profit: ['Profit position', 'Provision position', 'Provision buckets', 'After provisions', 'Profit trend', 'Detailed financial records']
}

const periods = ['DAY', 'WEEK', 'MONTH', '3 MONTHS', '6 MONTHS', '1 YEAR', 'MULTI-YEAR', 'TILL DATE', 'CUSTOM RANGE']
const selectedCard = computed(() => cards.find(card => card.id === selectedLayer.value) || null)

function openCard(id) { selectedLayer.value = id }
function closeCard() { selectedLayer.value = null }
</script>

<template>
  <section class="performance">
    <header class="performance-header">
      <div>
        <small>PERFORMANCE</small>
        <h1>Business position</h1>
      </div>
      <button class="period-button" type="button" @click="period = period === 'MONTH' ? 'DAY' : 'MONTH'">{{ period }}</button>
    </header>

    <div class="overview-grid">
      <button v-for="card in cards" :key="card.id" class="overview-card" type="button" @click="openCard(card.id)">
        <span class="card-icon">{{ card.icon }}</span>
        <span class="card-title">{{ card.title }}</span>
        <span v-for="metric in card.metrics.slice(0, 3)" :key="metric" class="metric-row"><span>{{ metric }}</span><strong>—</strong></span>
      </button>
    </div>

    <section class="pulse">
      <div class="section-heading"><div><small>OPERATIONAL PULSE</small><h2>Situational awareness</h2></div><span>Read-only</span></div>
      <div class="pulse-grid">
        <div><small>Vehicle KM</small><strong>—</strong></div>
        <div><small>Business KM</small><strong>—</strong></div>
        <div><small>Trips</small><strong>—</strong></div>
        <div><small>Working hours</small><strong>—</strong></div>
      </div>
    </section>

    <div v-if="selectedCard" class="detail-overlay">
      <header><button type="button" @click="closeCard">←</button><div><small>{{ selectedCard.title }}</small><h2>{{ period }}</h2></div></header>
      <div class="detail-list">
        <button v-for="(layer, index) in layers[selectedCard.id]" :key="layer" type="button" class="detail-row">
          <span>{{ index + 1 }}</span><strong>{{ layer }}</strong><b>›</b>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.performance{min-height:100%;padding:18px 14px 28px;background:#f8fafc;color:#0f172a}.performance-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}.performance-header small,.section-heading small{font-size:.68rem;font-weight:800;letter-spacing:.08em;color:#64748b}.performance h1,.section-heading h2{margin:3px 0 0}.performance h1{font-size:1.35rem}.period-button{border:1px solid #cbd5e1;background:#fff;border-radius:12px;padding:10px 14px;font-weight:800}.overview-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.overview-card{min-height:190px;text-align:left;background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:10px;box-shadow:0 1px 2px rgba(15,23,42,.04)}.card-icon{font-size:1.35rem}.card-title{font-size:.9rem;font-weight:850}.metric-row{display:flex;justify-content:space-between;gap:8px;font-size:.73rem;color:#64748b}.metric-row strong{color:#0f172a}.pulse{margin-top:12px;background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:14px}.section-heading{display:flex;justify-content:space-between;align-items:center}.section-heading h2{font-size:1rem}.section-heading>span{font-size:.7rem;color:#64748b}.pulse-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}.pulse-grid div{padding:10px;background:#f8fafc;border-radius:12px}.pulse-grid small{display:block;color:#64748b;font-size:.65rem}.pulse-grid strong{display:block;margin-top:4px}.detail-overlay{position:fixed;inset:48px 0 60px;background:#f8fafc;z-index:1000;padding:16px;overflow:auto}.detail-overlay header{display:flex;align-items:center;gap:12px}.detail-overlay header button{width:40px;height:40px;border:1px solid #cbd5e1;border-radius:12px;background:#fff;font-size:1.2rem}.detail-overlay header small{color:#64748b;font-weight:800}.detail-overlay h2{margin:2px 0}.detail-list{margin-top:18px;display:grid;gap:8px}.detail-row{display:grid;grid-template-columns:32px 1fr 24px;align-items:center;text-align:left;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px}.detail-row span{color:#64748b}.detail-row strong{font-size:.9rem}.detail-row b{font-size:1.2rem;color:#94a3b8}@media (max-width:520px){.overview-card{min-height:170px}.pulse-grid{grid-template-columns:1fr 1fr}}
</style>
