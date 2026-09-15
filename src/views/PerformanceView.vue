<script setup>
import { computed, onMounted, ref } from 'vue'
import { ShiftTripRepository } from '../repositories/shiftTripRepository.js'
import { FuelRepository } from '../repositories/fuelRepository.js'

const periodMode = ref('MONTH')
const periodStart = ref('')
const periodEnd = ref('')
const selectorOpen = ref(false)
const activeCard = ref(null)
const layer = ref(0)
const loading = ref(true)
const shifts = ref([])
const trips = ref([])
const fuelLogs = ref([])

const cards = [
  { id: 'target', icon: '🎯', title: 'Target & Position', question: 'Are we on target?' },
  { id: 'revenue', icon: '💰', title: 'Revenue', question: 'How much are we generating?' },
  { id: 'cost', icon: '🧾', title: 'Cost & Break-even', question: 'Are costs under control?' },
  { id: 'profit', icon: '🏦', title: 'Profit & Provisions', question: 'What is the financial position?' }
]

const layers = {
  target: [['Position', ['Target', 'Achieved', 'Achievement %', 'Remaining', 'Current status']], ['Pace & projection', ['Current pace', 'Required pace', 'Pace variance', 'Projected result', 'Expected target gap']], ['Target drivers', ['Working days', 'Days elapsed', 'Days remaining', 'Revenue requirement', 'Business activity required']], ['Comparison', ['Previous period', 'Previous month', 'Previous year', 'Trend', 'Variance']], ['Detailed period', ['Day', 'Week', 'Month', 'Underlying records']]],
  revenue: [['Revenue position', ['Total revenue', 'Revenue target', 'Achievement', 'Variance', 'Growth']], ['Revenue composition', ['Ride revenue', 'Other business revenue', 'Operator contribution', 'Revenue / trip']], ['Revenue efficiency', ['Revenue / KM', 'Revenue / hour', 'Business KM', 'Working hours', 'Trips']], ['Time & trend', ['Day', 'Week', 'Month', 'Best period', 'Worst period']], ['Detailed revenue', ['Operator', 'Period', 'Trip detail', 'Adjustments']]],
  cost: [['Break-even position', ['Actual cost', 'Break-even', 'Above / below BE', 'Cost / KM', 'Cost / hour', 'Status']], ['Cost drivers', ['Fuel', 'Maintenance', 'Loan', 'Renewals / compliance', 'Toll', 'Parking', 'Other business costs']], ['Cost movement', ['Cost trend', 'Cost / KM trend', 'Fuel efficiency', 'Maintenance movement', 'Fixed vs variable behaviour']], ['Break-even analysis', ['Break-even revenue', 'Break-even / KM', 'Break-even / hour', 'Additional revenue required', 'Margin above / below BE']], ['Detailed costs', ['Category', 'Period', 'Individual records']]],
  profit: [['Profit position', ['Revenue', 'Cost', 'Profit', 'Profit margin', 'Profit / KM', 'Profit / hour', 'Status']], ['Provision position', ['Required', 'Allocated', 'Used', 'Remaining', 'Coverage %', 'Shortfall / surplus']], ['Provision buckets', ['Fuel', 'Maintenance', 'Loan', 'Renewals / compliance', 'Other obligations']], ['After provisions', ['Profit', 'Provision requirement', 'Remaining position', 'Coverage', 'Surplus / shortfall']], ['Profit trend', ['Day', 'Week', 'Month', '3 months', '6 months', '1 year', 'Multi-year', 'Custom']], ['Detailed financial records', ['Revenue records', 'Cost records', 'Provision movements']]]
}

const currentCard = computed(() => cards.find(card => card.id === activeCard.value) || null)
const currentLayers = computed(() => layers[activeCard.value] || [])
const currentLayer = computed(() => currentLayers.value[layer.value] || null)
const periodLabel = computed(() => periodMode.value === 'MONTH' ? 'SEP 2026' : periodMode.value.replaceAll('_', ' '))
const filteredShifts = computed(() => shifts.value.filter(shift => { const date = String(shift.shiftEndAt || shift.shiftStartAt || '').slice(0, 10); if (!periodStart.value && !periodEnd.value) return periodMode.value === 'MONTH' ? date.startsWith('2026-09') : true; return (!periodStart.value || date >= periodStart.value) && (!periodEnd.value || date <= periodEnd.value) }))
const filteredShiftIds = computed(() => new Set(filteredShifts.value.map(shift => shift.id)))
const filteredTrips = computed(() => trips.value.filter(trip => filteredShiftIds.value.has(trip.shiftId)))
const completedTrips = computed(() => filteredTrips.value.filter(trip => trip.status === 'COMPLETED'))
const filteredFuel = computed(() => fuelLogs.value.filter(log => { const date = String(log.capturedAt || log.createdAt || '').slice(0, 10); if (!periodStart.value && !periodEnd.value) return periodMode.value === 'MONTH' ? date.startsWith('2026-09') : true; return (!periodStart.value || date >= periodStart.value) && (!periodEnd.value || date <= periodEnd.value) }))
const revenue = computed(() => filteredShifts.value.reduce((sum, shift) => sum + Number(shift.revenue || 0), 0))
const vehicleKm = computed(() => filteredShifts.value.reduce((sum, shift) => sum + Number(shift.totalDistance || Math.max(0, Number(shift.endOdometer || 0) - Number(shift.startOdometer || 0))), 0))
const businessKm = computed(() => completedTrips.value.reduce((sum, trip) => sum + (Number.isFinite(Number(trip.tripKm)) ? Number(trip.tripKm) : 0), 0))
const tripCount = computed(() => completedTrips.value.length)
const revenuePerKm = computed(() => businessKm.value > 0 ? revenue.value / businessKm.value : null)
const revenuePerTrip = computed(() => tripCount.value > 0 ? revenue.value / tripCount.value : null)
const fuelCost = computed(() => filteredFuel.value.reduce((sum, log) => sum + Number(log.amount || 0), 0))
const fuelQuantity = computed(() => filteredFuel.value.reduce((sum, log) => sum + Number(log.quantityKg || 0), 0))
const recordedCosts = computed(() => fuelCost.value + filteredShifts.value.reduce((sum, shift) => sum + Number(shift.toll || 0) + Number(shift.parking || 0), 0))
const recordedCostPerKm = computed(() => businessKm.value > 0 ? recordedCosts.value / businessKm.value : null)
const recordedResult = computed(() => revenue.value - recordedCosts.value)
const money = value => value == null ? '—' : `₹${Number(value).toFixed(0)}`
const km = value => value == null ? '—' : `${Number(value).toFixed(1)} km`
const rate = value => value == null ? '—' : `₹${Number(value).toFixed(1)}`

const cardMetrics = computed(() => ({
  target: [{ label: 'Achieved', value: money(revenue.value) }, { label: 'Target', value: '—' }, { label: 'Status', value: 'Target not configured' }],
  revenue: [{ label: 'Total revenue', value: money(revenue.value) }, { label: 'Revenue / KM', value: rate(revenuePerKm.value) }, { label: 'Revenue / trip', value: money(revenuePerTrip.value) }],
  cost: [{ label: 'Recorded cost', value: money(recordedCosts.value) }, { label: 'Cost / KM', value: rate(recordedCostPerKm.value) }, { label: 'Break-even', value: '—' }],
  profit: [{ label: 'Recorded result', value: money(recordedResult.value) }, { label: 'Margin', value: revenue.value > 0 ? `${((recordedResult.value / revenue.value) * 100).toFixed(1)}%` : '—' }, { label: 'Provisions', value: '—' }]
}))
const cardStatus = computed(() => ({ target: 'Target source pending', revenue: `${tripCount.value} completed trips · ${km(businessKm.value)}`, cost: `Fuel ${money(fuelCost.value)} · ${fuelQuantity.value.toFixed(1)} kg CNG`, profit: 'Full cost & provision model pending authoritative read-model' }))
const valueFor = label => ({ 'Total revenue': money(revenue.value), Achieved: money(revenue.value), Revenue: money(revenue.value), 'Business KM': km(businessKm.value), 'Total Vehicle KM': km(vehicleKm.value), Trips: String(tripCount.value), 'Revenue / KM': rate(revenuePerKm.value), 'Revenue / trip': money(revenuePerTrip.value), Fuel: money(fuelCost.value), 'Actual cost': money(recordedCosts.value), 'Cost / KM': rate(recordedCostPerKm.value), Profit: money(recordedResult.value), 'Profit margin': revenue.value > 0 ? `${((recordedResult.value / revenue.value) * 100).toFixed(1)}%` : '—' }[label] ?? '—')
const isUnavailable = label => !['Total revenue','Achieved','Revenue','Business KM','Total Vehicle KM','Trips','Revenue / KM','Revenue / trip','Fuel','Actual cost','Cost / KM','Profit','Profit margin'].includes(label)
const openCard = id => { activeCard.value = id; layer.value = 0 }
const openLayer = index => { layer.value = index }
const back = () => { if (selectorOpen.value) { selectorOpen.value = false; return } if (activeCard.value && layer.value > 0) { layer.value -= 1; return } if (activeCard.value) { activeCard.value = null; layer.value = 0; return } window.history.back() }
const choosePeriod = mode => { periodMode.value = mode; periodStart.value=''; periodEnd.value=''; selectorOpen.value=false }
const applyCustom = () => { if (periodStart.value && periodEnd.value) selectorOpen.value=false }

onMounted(async () => {
  loading.value = true
  try { const [shiftRows, tripRows, fuelRows] = await Promise.all([ShiftTripRepository.getAll(), ShiftTripRepository.getAllTrips(), FuelRepository.getAll()]); shifts.value = shiftRows; trips.value = tripRows; fuelLogs.value = fuelRows } catch (error) { console.error('Performance load failed', error) } finally { loading.value = false }
})
</script>

<template>
  <main class="performance-shell">
    <template v-if="!activeCard">
      <header class="performance-header"><div><span class="eyebrow">FINANCIAL CONTROL TOWER</span><h1>Performance</h1></div><button class="period-mini" type="button" @click="selectorOpen = true" aria-label="Choose performance period"><span>‹</span><strong>{{ periodLabel }}</strong><span>›</span><small>{{ periodMode.replaceAll('_',' ') }} ▾</small></button></header>
      <section class="period-strip"><span>At a glance</span><span>{{ periodLabel }}</span></section>
      <section class="card-grid" aria-label="Performance overview">
        <button v-for="card in cards" :key="card.id" type="button" class="metric-card" @click="openCard(card.id)">
          <div class="metric-icon">{{ card.icon }}</div>
          <div class="metric-copy"><span>{{ card.title }}</span><strong>{{ cardMetrics[card.id][0].value }}</strong><div class="metric-secondary"><span>{{ cardMetrics[card.id][1].label }} <b>{{ cardMetrics[card.id][1].value }}</b></span><span>{{ cardMetrics[card.id][2].label }} <b>{{ cardMetrics[card.id][2].value }}</b></span></div><small>{{ card.question }}</small></div>
          <span class="card-status">{{ cardStatus[card.id] }}</span><span class="chevron">›</span>
        </button>
      </section>
      <section class="operational-pulse" aria-label="Operational pulse"><div><span>Vehicle KM</span><strong>{{ km(vehicleKm) }}</strong></div><div><span>Business KM</span><strong>{{ km(businessKm) }}</strong></div><div><span>Trips</span><strong>{{ tripCount }}</strong></div><div><span>Fuel cost</span><strong>{{ money(fuelCost) }}</strong></div></section>
      <p v-if="loading" class="loading">Loading authoritative local performance data…</p>
    </template>
    <template v-else>
      <header class="detail-header"><button type="button" class="back" @click="back" aria-label="Back">‹</button><div><span class="eyebrow">{{ currentCard.icon }} {{ currentCard.title.toUpperCase() }}</span><h1>{{ currentLayer?.[0] }}</h1></div><span class="layer-count">{{ layer + 1 }}/{{ currentLayers.length }}</span></header>
      <section class="meaning-card"><span class="eyebrow">PRIMARY QUESTION</span><strong>{{ currentCard.question }}</strong><p>Each layer moves from meaning → explanation → analysis → detail. The UI only reads authoritative persisted data/read-model values.</p></section>
      <section class="detail-metrics"><article v-for="metric in (currentLayer?.[1] || [])" :key="metric" class="detail-metric"><span>{{ metric }}</span><strong>{{ valueFor(metric) }}</strong><small v-if="isUnavailable(metric)">Unavailable until the authoritative calculation/read-model provides this value.</small></article></section>
      <section class="layer-nav"><button v-for="(item,index) in currentLayers" :key="item[0]" type="button" :class="{active:index===layer}" @click="openLayer(index)">{{ index + 1 }} · {{ item[0] }}</button></section>
    </template>
    <div v-if="selectorOpen" class="period-overlay" role="dialog" aria-modal="true" aria-label="Performance period selector"><header><button type="button" class="back" @click="selectorOpen=false">‹</button><div><span class="eyebrow">PERFORMANCE PERIOD</span><h2>Choose the time lens</h2></div></header><p>One period controls all four Performance boxes and every drill-down layer.</p><div class="period-options"><button v-for="mode in ['DAY','WEEK','MONTH','3_MONTHS','6_MONTHS','1_YEAR','MULTI_YEAR','TILL_DATE']" :key="mode" type="button" :class="{selected:periodMode===mode}" @click="choosePeriod(mode)">{{ mode.replaceAll('_',' ') }}</button></div><section class="custom-period"><strong>Custom range</strong><label>From <input v-model="periodStart" type="date"></label><label>To <input v-model="periodEnd" type="date"></label><button type="button" :disabled="!periodStart || !periodEnd" @click="applyCustom">Apply custom range</button></section></div>
  </main>
</template>

<style scoped>
.performance-shell{min-height:100%;padding:16px;box-sizing:border-box;background:var(--kfe-ui-surface-2,#f8fafc);color:var(--kfe-text,#0f172a)}
.performance-header,.detail-header,.period-overlay header{display:flex;align-items:center;justify-content:space-between;gap:12px}.performance-header h1,.detail-header h1{margin:2px 0 0;font-size:clamp(1.55rem,6vw,2rem);letter-spacing:-.03em}.eyebrow{font-size:.64rem;font-weight:900;letter-spacing:.09em;color:#64748b}.period-mini{border:1px solid #dbe3ec;background:#fff;border-radius:14px;padding:7px 9px;display:grid;grid-template-columns:16px 1fr 16px;align-items:center;min-width:112px;font-size:.65rem;color:#334155}.period-mini strong{text-align:center;font-size:.68rem}.period-mini span{font-size:1rem}.period-mini small{grid-column:1/-1;text-align:center;margin-top:2px;color:#64748b}.period-strip{margin:14px 0 10px;display:flex;justify-content:space-between;font-size:.72rem;color:#64748b}.card-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.metric-card{min-height:170px;text-align:left;border:1px solid #dbe3ec;border-radius:20px;background:#fff;padding:16px;box-shadow:0 3px 12px rgba(15,23,42,.06);display:flex;flex-direction:column;justify-content:space-between;gap:10px;color:#0f172a}.metric-card:active{transform:scale(.99)}.metric-icon{font-size:1.45rem}.metric-copy{display:grid;gap:5px}.metric-copy>span{font-size:.76rem;font-weight:800;color:#64748b}.metric-copy>strong{font-size:1.35rem;letter-spacing:-.03em}.metric-secondary{display:grid;gap:3px;font-size:.67rem;color:#64748b}.metric-secondary span{display:flex;justify-content:space-between;gap:8px}.metric-secondary b{color:#334155;font-weight:800}.metric-copy small{font-size:.68rem;color:#64748b;line-height:1.35}.card-status{font-size:.62rem;color:#94a3b8;line-height:1.3}.chevron{align-self:flex-end;color:#94a3b8;font-size:1.25rem}.operational-pulse{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.operational-pulse div{background:#fff;border:1px solid #dbe3ec;border-radius:13px;padding:10px;display:grid;gap:3px}.operational-pulse span{font-size:.62rem;color:#64748b}.operational-pulse strong{font-size:.82rem}.loading{font-size:.75rem;color:#64748b;text-align:center;margin-top:20px}.back{width:38px;height:38px;border-radius:12px;border:1px solid #dbe3ec;background:#fff;font-size:1.5rem;line-height:1;color:#334155}.detail-header{margin-bottom:14px}.layer-count{font-size:.68rem;color:#64748b}.meaning-card{background:#fff;border:1px solid #dbe3ec;border-radius:18px;padding:15px;display:grid;gap:6px;margin-bottom:12px}.meaning-card strong{font-size:1.1rem}.meaning-card p{margin:0;font-size:.73rem;line-height:1.4;color:#64748b}.detail-metrics{display:grid;gap:9px}.detail-metric{background:#fff;border:1px solid #dbe3ec;border-radius:15px;padding:13px;display:grid;gap:4px}.detail-metric span{font-size:.72rem;font-weight:800;color:#64748b}.detail-metric strong{font-size:1.05rem}.detail-metric small{font-size:.64rem;color:#94a3b8;line-height:1.35}.layer-nav{display:grid;gap:7px;margin-top:14px}.layer-nav button{padding:10px 12px;text-align:left;border:1px solid #dbe3ec;border-radius:12px;background:#fff;color:#475569;font-size:.72rem;font-weight:700}.layer-nav button.active{border-color:#2563eb;color:#1d4ed8;background:#eff6ff}.period-overlay{position:fixed;inset:0;z-index:10000;background:#f8fafc;padding:18px;overflow:auto}.period-overlay h2{margin:2px 0 0;font-size:1.35rem}.period-overlay>p{color:#64748b;font-size:.78rem;line-height:1.4;margin:16px 0}.period-options{display:grid;grid-template-columns:1fr 1fr;gap:9px}.period-options button{padding:14px;border:1px solid #dbe3ec;background:#fff;border-radius:14px;text-align:left;font-weight:800;font-size:.74rem}.period-options button.selected{border-color:#2563eb;background:#eff6ff;color:#1d4ed8}.custom-period{margin-top:18px;background:#fff;border:1px solid #dbe3ec;border-radius:16px;padding:14px;display:grid;gap:9px}.custom-period strong{font-size:.82rem}.custom-period label{display:grid;gap:4px;font-size:.68rem;color:#64748b}.custom-period input{padding:10px;border:1px solid #cbd5e1;border-radius:10px}.custom-period button{padding:11px;border:0;border-radius:10px;background:#2563eb;color:#fff;font-weight:800}.custom-period button:disabled{opacity:.45}@media(max-width:360px){.card-grid{grid-template-columns:1fr}.metric-card{min-height:145px}}
</style>
