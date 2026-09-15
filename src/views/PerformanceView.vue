<script setup>
import { computed, onMounted, ref } from 'vue'
import { ShiftTripRepository } from '../repositories/shiftTripRepository.js'
import { FuelRepository } from '../repositories/fuelRepository.js'

const PERIODS = ['DAY', 'WEEK', 'MONTH', '3 MONTHS', '6 MONTHS', '1 YEAR', 'MULTI-YEAR', 'TILL DATE', 'CUSTOM RANGE']
const LAYERS = {
  target: ['Position', 'Pace & projection', 'Target drivers', 'Comparison', 'Detailed period'],
  revenue: ['Revenue position', 'Revenue composition', 'Revenue efficiency', 'Time & trend', 'Detailed revenue'],
  cost: ['Break-even position', 'Cost drivers', 'Cost movement', 'Break-even analysis', 'Detailed costs'],
  profit: ['Profit position', 'Provision position', 'Provision buckets', 'After provisions', 'Profit trend', 'Detailed financial records']
}

const period = ref('MONTH')
const navigatorOpen = ref(false)
const customFrom = ref('')
const customTo = ref('')
const activeCard = ref(null)
const activeLayer = ref(0)
const shifts = ref([])
const trips = ref([])
const fuelLogs = ref([])
const loading = ref(true)
const error = ref('')

const money = value => Number.isFinite(value) ? `₹${Math.round(value).toLocaleString('en-IN')}` : '—'
const number = value => Number.isFinite(value) ? value.toLocaleString('en-IN', { maximumFractionDigits: 1 }) : '—'
const pct = value => Number.isFinite(value) ? `${value.toFixed(1)}%` : '—'
const dateOnly = value => value ? new Date(value).toISOString().slice(0, 10) : ''

const periodRange = computed(() => {
  const now = new Date()
  if (period.value === 'CUSTOM RANGE' && customFrom.value && customTo.value) return { from: new Date(`${customFrom.value}T00:00:00`), to: new Date(`${customTo.value}T23:59:59.999`) }
  const to = new Date(now)
  let from = new Date(now)
  if (period.value === 'DAY') from.setHours(0, 0, 0, 0)
  else if (period.value === 'WEEK') { from.setHours(0, 0, 0, 0); from.setDate(from.getDate() - ((from.getDay() + 6) % 7)) }
  else if (period.value === 'MONTH') { from = new Date(now.getFullYear(), now.getMonth(), 1) }
  else if (period.value === '3 MONTHS') { from.setMonth(from.getMonth() - 3) }
  else if (period.value === '6 MONTHS') { from.setMonth(from.getMonth() - 6) }
  else if (period.value === '1 YEAR') { from.setFullYear(from.getFullYear() - 1) }
  else if (period.value === 'MULTI-YEAR') { from.setFullYear(from.getFullYear() - 5) }
  else if (period.value === 'TILL DATE') { from = new Date(0) }
  return { from, to }
})

const inRange = (value) => {
  if (!value) return false
  const d = new Date(value)
  return d >= periodRange.value.from && d <= periodRange.value.to
}

const periodShifts = computed(() => shifts.value.filter(s => inRange(s.shiftEndAt || s.shiftStartAt)))
const periodTrips = computed(() => trips.value.filter(t => inRange(t.tripEndAt || t.tripStartAt) && t.status === 'COMPLETED'))
const periodFuel = computed(() => fuelLogs.value.filter(f => inRange(f.capturedAt || f.createdAt)))

const revenue = computed(() => periodShifts.value.reduce((sum, s) => sum + (Number(s.revenue) || 0), 0))
const vehicleKm = computed(() => periodShifts.value.reduce((sum, s) => sum + Math.max(0, Number(s.totalDistance) || 0), 0))
const businessKm = computed(() => periodTrips.value.reduce((sum, t) => sum + Math.max(0, Number(t.tripKm) || 0), 0))
const tripCount = computed(() => periodTrips.value.length)
const fuelCost = computed(() => periodFuel.value.reduce((sum, f) => sum + (Number(f.amount) || 0), 0))
const fuelQty = computed(() => periodFuel.value.reduce((sum, f) => sum + (Number(f.quantityKg) || 0), 0))
const tollParking = computed(() => periodShifts.value.reduce((sum, s) => sum + (Number(s.toll) || 0) + (Number(s.parking) || 0), 0))
const recordedCost = computed(() => fuelCost.value + tollParking.value)
const costPerKm = computed(() => vehicleKm.value > 0 ? recordedCost.value / vehicleKm.value : NaN)
const revenuePerKm = computed(() => businessKm.value > 0 ? revenue.value / businessKm.value : NaN)
const revenuePerTrip = computed(() => tripCount.value > 0 ? revenue.value / tripCount.value : NaN)
const recordedResult = computed(() => revenue.value - recordedCost.value)
const margin = computed(() => revenue.value > 0 ? (recordedResult.value / revenue.value) * 100 : NaN)

const target = computed(() => NaN)
const achievement = computed(() => NaN)
const targetStatus = computed(() => 'Target not configured')
const breakEven = computed(() => NaN)
const provisionStatus = computed(() => 'Provision model not surfaced here')

const cardData = computed(() => ({
  target: { title: '🎯 Target & Position', metrics: [['Achieved revenue', money(revenue.value)], ['Target', money(target.value)], ['Status', targetStatus.value]] },
  revenue: { title: '💰 Revenue', metrics: [['Total revenue', money(revenue.value)], ['Revenue/KM', money(revenuePerKm.value)], ['Revenue/trip', money(revenuePerTrip.value)]] },
  cost: { title: '🧾 Cost & Break-even', metrics: [['Recorded cost', money(recordedCost.value)], ['Cost/KM', money(costPerKm.value)], ['Break-even', Number.isFinite(breakEven.value) ? money(breakEven.value) : 'Not surfaced']] },
  profit: { title: '🏦 Profit & Provisions', metrics: [['Recorded result', money(recordedResult.value)], ['Margin', pct(margin.value)], ['Provisions', provisionStatus.value]] }
}))

const drillTitle = computed(() => activeCard.value ? `${cardData.value[activeCard.value].title.replace(/^\S+\s/, '')} — ${LAYERS[activeCard.value][activeLayer.value]}` : '')

function selectPeriod(value) {
  period.value = value
  if (value !== 'CUSTOM RANGE') navigatorOpen.value = false
}
function applyCustom() {
  if (customFrom.value && customTo.value) { period.value = 'CUSTOM RANGE'; navigatorOpen.value = false }
}
function openCard(key) { activeCard.value = key; activeLayer.value = 0 }
function backLayer() {
  if (activeLayer.value > 0) activeLayer.value--
  else activeCard.value = null
}
function nextLayer() {
  if (activeCard.value && activeLayer.value < LAYERS[activeCard.value].length - 1) activeLayer.value++
}

onMounted(async () => {
  try {
    ;[shifts.value, trips.value, fuelLogs.value] = await Promise.all([
      (async () => { const db = await import('../utils/indexedDB.js').then(m => m.initializeCanonicalStorage()); return new Promise((resolve, reject) => { const r = db.transaction('shifts', 'readonly').objectStore('shifts').getAll(); r.onsuccess = () => resolve(r.result || []); r.onerror = () => reject(r.error) }) })(),
      ShiftTripRepository.getAllTrips(),
      FuelRepository.getAll()
    ])
  } catch (e) { error.value = e?.message || 'Performance data could not be loaded.' }
  finally { loading.value = false }
})
</script>

<template>
  <section class="performance-page">
    <div v-if="loading" class="state-card">Loading Performance…</div>
    <div v-else-if="error" class="state-card error">{{ error }}</div>
    <template v-else-if="!activeCard">
      <header class="performance-header">
        <div><small>PERFORMANCE</small><h1>Business position</h1></div>
        <button class="period-button" @click="navigatorOpen = true">{{ period }} <span>⌄</span></button>
      </header>

      <div class="four-grid">
        <button v-for="key in ['target','revenue','cost','profit']" :key="key" class="metric-card" @click="openCard(key)">
          <h2>{{ cardData[key].title }}</h2>
          <div v-for="metric in cardData[key].metrics" :key="metric[0]" class="metric-row"><span>{{ metric[0] }}</span><strong>{{ metric[1] }}</strong></div>
          <span class="view-detail">View detail →</span>
        </button>
      </div>

      <section class="pulse card">
        <div class="section-heading"><div><small>OPERATIONAL PULSE</small><h2>What matters now</h2></div></div>
        <div class="pulse-grid">
          <div><span>Vehicle KM</span><strong>{{ number(vehicleKm) }}</strong></div>
          <div><span>Business KM</span><strong>{{ number(businessKm) }}</strong></div>
          <div><span>Trips</span><strong>{{ number(tripCount) }}</strong></div>
          <div><span>Fuel cost</span><strong>{{ money(fuelCost) }}</strong></div>
        </div>
      </section>
    </template>

    <template v-else>
      <header class="detail-header">
        <button class="back" @click="backLayer">‹</button>
        <div><small>PERFORMANCE</small><h1>{{ drillTitle }}</h1></div>
        <button v-if="activeLayer < LAYERS[activeCard].length - 1" class="next" @click="nextLayer">Next ›</button>
      </header>
      <section class="detail card">
        <div class="layer-tabs"><button v-for="(layer, index) in LAYERS[activeCard]" :key="layer" :class="{active:index===activeLayer}" @click="activeLayer=index">{{ index + 1 }}. {{ layer }}</button></div>
        <div class="detail-content">
          <h2>{{ LAYERS[activeCard][activeLayer] }}</h2>
          <p class="muted">Period: <strong>{{ period }}</strong></p>
          <div class="detail-grid">
            <div><span>Revenue</span><strong>{{ money(revenue) }}</strong></div>
            <div><span>Vehicle KM</span><strong>{{ number(vehicleKm) }}</strong></div>
            <div><span>Business KM</span><strong>{{ number(businessKm) }}</strong></div>
            <div><span>Recorded cost</span><strong>{{ money(recordedCost) }}</strong></div>
            <div><span>Revenue/KM</span><strong>{{ money(revenuePerKm) }}</strong></div>
            <div><span>Cost/KM</span><strong>{{ money(costPerKm) }}</strong></div>
          </div>
          <div class="explanation">This layer is a read-only interpretation of authoritative KFE records. It does not create or replace business authority.</div>
        </div>
      </section>
    </template>

    <div v-if="navigatorOpen" class="period-overlay">
      <div class="period-panel">
        <header><div><small>PERIOD</small><h2>Choose reporting range</h2></div><button @click="navigatorOpen=false">✕</button></header>
        <div class="period-list"><button v-for="item in PERIODS" :key="item" :class="{selected:period===item}" @click="selectPeriod(item)">{{ item }} <span>›</span></button></div>
        <div v-if="period==='CUSTOM RANGE'" class="custom-range">
          <label>From<input v-model="customFrom" type="date"></label>
          <label>To<input v-model="customTo" type="date"></label>
          <button class="apply" @click="applyCustom">Apply range</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.performance-page{padding:16px;max-width:760px;margin:0 auto;box-sizing:border-box;color:#0f172a}.performance-header,.detail-header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}.performance-header small,.detail-header small,.section-heading small{font-size:.68rem;font-weight:800;color:#64748b;letter-spacing:.08em}.performance-header h1,.detail-header h1,.section-heading h2{margin:3px 0 0;font-size:1.25rem}.period-button,.back,.next,.period-panel header button{border:1px solid #cbd5e1;background:white;border-radius:10px;padding:9px 11px;font-weight:800;color:#0f172a}.four-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.metric-card,.card{background:#fff;border:1px solid #e2e8f0;border-radius:16px}.metric-card{text-align:left;padding:15px;min-height:190px;box-shadow:0 3px 12px rgba(15,23,42,.04)}.metric-card h2{font-size:.98rem;margin:0 0 14px}.metric-row{display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-top:1px solid #f1f5f9;font-size:.76rem}.metric-row strong{font-size:.8rem;text-align:right}.view-detail{display:block;margin-top:12px;color:#2563eb;font-size:.75rem;font-weight:800}.pulse{margin-top:12px;padding:15px}.section-heading{display:flex;justify-content:space-between;align-items:flex-start}.pulse-grid,.detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.pulse-grid>div,.detail-grid>div{background:#f8fafc;border-radius:10px;padding:10px}.pulse-grid span,.detail-grid span{display:block;font-size:.7rem;color:#64748b}.pulse-grid strong,.detail-grid strong{display:block;margin-top:3px;font-size:.95rem}.state-card{padding:24px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;text-align:center}.state-card.error{color:#b91c1c}.back{font-size:1.25rem;padding:5px 11px}.next{color:#2563eb}.detail{padding:14px}.layer-tabs{display:flex;gap:7px;overflow-x:auto;padding-bottom:10px}.layer-tabs button{white-space:nowrap;border:1px solid #e2e8f0;background:#f8fafc;border-radius:999px;padding:7px 10px;font-size:.7rem;font-weight:800}.layer-tabs button.active{background:#0f172a;color:#fff;border-color:#0f172a}.detail-content{padding:8px 2px}.detail-content h2{font-size:1.1rem;margin:10px 0 4px}.muted{color:#64748b;font-size:.78rem}.explanation{margin-top:14px;padding:12px;border-radius:10px;background:#f8fafc;color:#475569;font-size:.75rem;line-height:1.5}.period-overlay{position:fixed;inset:0;background:rgba(15,23,42,.48);z-index:10000;display:flex;align-items:flex-end}.period-panel{background:#fff;width:100%;max-height:88vh;border-radius:20px 20px 0 0;padding:18px;box-sizing:border-box;overflow:auto}.period-panel header{display:flex;justify-content:space-between;align-items:flex-start}.period-panel h2{margin:3px 0 15px;font-size:1.15rem}.period-list{display:grid;gap:7px}.period-list button{display:flex;justify-content:space-between;align-items:center;border:1px solid #e2e8f0;background:#f8fafc;border-radius:11px;padding:12px;font-weight:800;text-align:left}.period-list button.selected{border-color:#2563eb;background:#eff6ff;color:#1d4ed8}.custom-range{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.custom-range label{font-size:.72rem;font-weight:800;color:#475569}.custom-range input{display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:9px;border:1px solid #cbd5e1;border-radius:9px}.custom-range .apply{grid-column:1/-1;padding:11px;border:0;border-radius:10px;background:#2563eb;color:#fff;font-weight:800}@media(max-width:420px){.four-grid{gap:8px}.metric-card{padding:12px;min-height:185px}.performance-page{padding:12px}}
</style>
