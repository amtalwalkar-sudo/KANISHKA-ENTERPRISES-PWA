<script setup>
import { computed, onMounted, ref } from 'vue'
import { useWorkCycleStore } from '../stores/workCycle'
import { MileageAccountingService } from '../services/mileageAccountingService'

const store = useWorkCycleStore()
const shifts = ref([])
const mileage = ref(null)
const loading = ref(true)
const error = ref(null)

const selectedMonth = ref(new Date().toISOString().slice(0, 7))
const vehicleName = 'KFE-01'

const loadPerformance = async () => {
  loading.value = true
  error.value = null
  try {
    const [accounting, shiftData] = await Promise.all([
      MileageAccountingService.getMileageAccounting(),
      import('../repositories/shiftRepository').then(({ ShiftRepository }) => ShiftRepository.getAll())
    ])
    mileage.value = accounting || null
    shifts.value = (shiftData || []).map((shift) => ({
      ...shift,
      revenue: Number(shift.revenue ?? shift.totalRevenue ?? 0)
    }))
  } catch (err) {
    console.error('Failed to load Performance:', err)
    error.value = err?.message || 'Performance data could not be loaded.'
  } finally {
    loading.value = false
  }
}

const monthLabel = computed(() => {
  const date = new Date(`${selectedMonth.value}-01T00:00:00`)
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
})

const monthShifts = computed(() => shifts.value.filter((shift) => {
  const raw = shift.shiftStartAt || shift.shiftEndAt || shift.createdAt
  if (!raw) return false
  return new Date(raw).toISOString().slice(0, 7) === selectedMonth.value
}))

const revenue = computed(() => monthShifts.value.reduce((sum, shift) => sum + (Number(shift.revenue) || 0), 0))
const shiftCount = computed(() => monthShifts.value.length)

const workingHours = computed(() => {
  const seconds = monthShifts.value.reduce((sum, shift) => {
    const start = new Date(shift.shiftStartAt || shift.startedAt || 0).getTime()
    const end = new Date(shift.shiftEndAt || shift.endedAt || 0).getTime()
    if (!start || !end || end <= start) return sum
    return sum + (end - start) / 1000
  }, 0)
  return seconds > 0 ? seconds / 3600 : null
})

const totalVehicleKm = computed(() => {
  // The mileage service remains the authoritative source. Until its selected-period
  // projection is available, do not relabel lifetime data as monthly Performance data.
  return mileage.value?.periodTotalVehicleDistance ?? null
})

const rideKm = computed(() => mileage.value?.periodRideKm ?? null)
const deadKm = computed(() => {
  if (totalVehicleKm.value == null || rideKm.value == null) return null
  return totalVehicleKm.value - rideKm.value
})
const deadKmPercent = computed(() => {
  if (deadKm.value == null || !totalVehicleKm.value) return null
  return (deadKm.value / totalVehicleKm.value) * 100
})

const money = (value, decimals = 0) => value == null ? '—' : `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}`
const number = (value, decimals = 0, suffix = '') => value == null ? '—' : `${Number(value).toLocaleString('en-IN', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}${suffix}`
const percent = (value) => value == null ? '—' : `${Number(value).toFixed(1)}%`

const revenuePerHour = computed(() => workingHours.value ? revenue.value / workingHours.value : null)
const revenuePerKm = computed(() => totalVehicleKm.value ? revenue.value / totalVehicleKm.value : null)

const setMonth = (offset) => {
  const date = new Date(`${selectedMonth.value}-01T00:00:00`)
  date.setMonth(date.getMonth() + offset)
  selectedMonth.value = date.toISOString().slice(0, 7)
}

onMounted(loadPerformance)
</script>

<template>
  <main class="performance-page" aria-labelledby="performance-title">
    <header class="performance-header">
      <div>
        <h1 id="performance-title">PERFORMANCE</h1>
        <div class="period-control">
          <button type="button" aria-label="Previous month" @click="setMonth(-1)">‹</button>
          <span>{{ monthLabel }}</span>
          <button type="button" aria-label="Next month" @click="setMonth(1)">›</button>
        </div>
        <p>Vehicle: {{ vehicleName }}</p>
      </div>
      <span class="readonly-badge">READ ONLY</span>
    </header>

    <div v-if="error" class="state-message error">{{ error }}</div>
    <div v-else-if="loading" class="state-message">Loading Performance…</div>

    <template v-else>
      <section class="hero-metrics">
        <div class="hero-revenue">{{ money(revenue) }}</div>
        <div class="hero-label">REVENUE</div>
        <div class="hero-submetrics">
          <div><strong>—</strong><span>COST</span></div>
          <div><strong>—</strong><span>NET RESULT</span></div>
        </div>
      </section>

      <section class="section-card">
        <h2>TARGET PERFORMANCE</h2>
        <div class="metric-list">
          <div><span>Dynamic Break-even</span><strong>—</strong></div>
          <div><span>Driver Monthly Target</span><strong>—</strong></div>
          <div><span>Monthly Driver Target</span><strong>—</strong></div>
          <div><span>Target achieved</span><strong>{{ money(revenue) }}</strong></div>
          <div><span>Target remaining</span><strong>—</strong></div>
        </div>
        <div class="progress-row"><div class="progress-track"><div class="progress-fill" style="width:0%"></div></div><strong>—</strong></div>
      </section>

      <section class="section-card">
        <h2>TODAY</h2>
        <div class="metric-list">
          <div><span>TARGET</span><strong>—</strong></div>
          <div><span>ACTUAL</span><strong>—</strong></div>
        </div>
        <div class="today-result">Target data will appear from the authoritative Performance read model.</div>
      </section>

      <section class="section-card">
        <h2>FINANCIAL DAYS</h2>
        <div class="metric-list">
          <div><span>Financial days</span><strong>—</strong></div>
          <div><span>OFF days</span><strong>—</strong></div>
          <div><span>Remaining financial days</span><strong>—</strong></div>
        </div>
      </section>

      <section class="section-card">
        <h2>REVENUE</h2>
        <div class="metric-list">
          <div><span>Total Revenue</span><strong>{{ money(revenue) }}</strong></div>
          <div><span>Revenue / Hour</span><strong>{{ money(revenuePerHour) }}</strong></div>
          <div><span>Revenue / KM</span><strong>{{ money(revenuePerKm) }}</strong></div>
          <div><span>Revenue / Ride</span><strong>—</strong></div>
          <div><span>Rides</span><strong>—</strong></div>
        </div>
        <div class="trend-placeholder"><span>Revenue Trend</span><div class="trend-line"></div></div>
      </section>

      <section class="section-card">
        <h2>UTILISATION</h2>
        <div class="metric-list">
          <div><span>Working / Financial Days</span><strong>{{ number(shiftCount) }}</strong></div>
          <div><span>Working Hours</span><strong>{{ number(workingHours, 1, ' h') }}</strong></div>
          <div><span>Ride Hours</span><strong>—</strong></div>
          <div><span>Utilisation</span><strong>—</strong></div>
        </div>
      </section>

      <section class="section-card">
        <h2>DISTANCE</h2>
        <div class="metric-list">
          <div><span>Total Vehicle KM</span><strong>{{ number(totalVehicleKm, 1, ' km') }}</strong></div>
          <div><span>Ride KM</span><strong>{{ number(rideKm, 1, ' km') }}</strong></div>
          <div><span>Dead KM</span><strong>{{ number(deadKm, 1, ' km') }}</strong></div>
          <div><span>Dead KM %</span><strong>{{ percent(deadKmPercent) }}</strong></div>
          <div><span>Average KM / Ride</span><strong>—</strong></div>
        </div>
      </section>

      <section class="section-card">
        <h2>FUEL &amp; RUNNING</h2>
        <div class="metric-list">
          <div><span>CNG Consumed</span><strong>—</strong></div>
          <div><span>Fuel Cost</span><strong>—</strong></div>
          <div><span>KM / kg</span><strong>—</strong></div>
          <div><span>Fuel Cost / KM</span><strong>—</strong></div>
          <div><span>Maintenance</span><strong>—</strong></div>
          <div><span>Maintenance / KM</span><strong>—</strong></div>
        </div>
      </section>

      <section class="section-card">
        <h2>COSTS</h2>
        <div class="metric-list">
          <div><span>Fuel</span><strong>—</strong></div>
          <div><span>Maintenance</span><strong>—</strong></div>
          <div><span>Fixed Expenses</span><strong>—</strong></div>
          <div><span>Finance</span><strong>—</strong></div>
          <div><span>Renewals / Compliance</span><strong>—</strong></div>
          <div><span>Other</span><strong>—</strong></div>
          <div class="total-row"><span>TOTAL COST</span><strong>—</strong></div>
        </div>
      </section>

      <section class="section-card">
        <h2>PROFITABILITY</h2>
        <div class="metric-list">
          <div><span>Net Result</span><strong>—</strong></div>
          <div><span>Profit / KM</span><strong>—</strong></div>
          <div><span>Profit / Hour</span><strong>—</strong></div>
          <div><span>Profit Margin</span><strong>—</strong></div>
        </div>
        <div class="trend-placeholder"><span>Net Result Trend</span><div class="trend-line"></div></div>
      </section>

      <p class="data-note">Performance is display-only. Missing or not-yet-projected values remain unavailable rather than being invented or redefined here.</p>
    </template>

    <div v-if="!store.isOnline" class="offline-note">OFFLINE — showing available local authoritative data.</div>
  </main>
</template>

<style scoped>
.performance-page{max-width:680px;margin:0 auto;padding:16px 14px 28px;box-sizing:border-box;color:#0f172a;display:grid;gap:12px;background:#f8fafc;min-height:100%}
.performance-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:2px 2px 8px}.performance-header h1{margin:0;font-size:1.35rem;letter-spacing:.02em}.performance-header p{margin:5px 0 0;font-size:.78rem;color:#64748b}.period-control{display:flex;align-items:center;gap:7px;margin-top:5px;font-size:.95rem;font-weight:800}.period-control button{border:0;background:transparent;font-size:1.4rem;line-height:1;cursor:pointer;color:#475569;padding:0 3px}.readonly-badge{font-size:.62rem;font-weight:900;color:#64748b;border:1px solid #cbd5e1;border-radius:999px;padding:5px 8px;white-space:nowrap}
.hero-metrics{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:24px 16px 18px;text-align:center;box-shadow:0 1px 2px rgba(15,23,42,.04)}.hero-revenue{font-size:2rem;font-weight:900;letter-spacing:-.04em}.hero-label{font-size:.7rem;font-weight:900;letter-spacing:.12em;color:#64748b;margin-top:3px}.hero-submetrics{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:20px}.hero-submetrics div{display:grid;gap:3px}.hero-submetrics strong{font-size:1.1rem}.hero-submetrics span{font-size:.65rem;color:#64748b;font-weight:900}
.section-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:16px;box-shadow:0 1px 2px rgba(15,23,42,.03)}.section-card h2{font-size:.78rem;letter-spacing:.06em;margin:0 0 12px;font-weight:900}.metric-list{display:grid;gap:0}.metric-list>div{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:.82rem}.metric-list>div:last-child{border-bottom:0}.metric-list span{color:#64748b}.metric-list strong{font-size:.88rem;text-align:right}.total-row{margin-top:4px;padding-top:12px!important;font-weight:900;border-top:1px solid #cbd5e1!important}.total-row span,.total-row strong{color:#0f172a}
.progress-row{display:grid;grid-template-columns:1fr auto;align-items:center;gap:10px;margin-top:12px}.progress-track{height:9px;background:#e2e8f0;border-radius:999px;overflow:hidden}.progress-fill{height:100%;background:#2563eb;border-radius:999px}.today-result{margin-top:10px;text-align:center;font-size:.76rem;color:#64748b}.trend-placeholder{margin-top:14px;padding-top:10px;border-top:1px solid #f1f5f9}.trend-placeholder span{font-size:.7rem;color:#64748b;font-weight:800}.trend-line{height:42px;margin-top:6px;position:relative;overflow:hidden}.trend-line:before{content:"";position:absolute;left:0;right:0;top:25px;height:2px;background:#cbd5e1;transform:skewY(-7deg);box-shadow:55px -8px 0 #cbd5e1,110px 6px 0 #cbd5e1,165px -12px 0 #cbd5e1,220px 2px 0 #cbd5e1,275px -9px 0 #cbd5e1}.data-note,.offline-note{margin:0;text-align:center;font-size:.68rem;color:#64748b;line-height:1.4}.state-message{padding:24px;text-align:center;background:#fff;border:1px solid #e2e8f0;border-radius:16px;color:#64748b;font-size:.85rem}.state-message.error{color:#b91c1c;border-color:#fecaca}.offline-note{padding:8px;border-radius:10px;background:#f1f5f9}
@media(max-width:380px){.performance-page{padding-left:10px;padding-right:10px}.section-card{padding:13px}.hero-revenue{font-size:1.8rem}.metric-list>div{font-size:.76rem}}
</style>
