<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  performance: { type: Object, default: null },
  dailyReport: { type: Object, default: null },
  activeShiftId: { type: String, default: null },
  odometer: { type: Number, default: null },
})

const emit = defineEmits(['refresh'])

const section = ref('capture')
const busy = ref(false)
const message = ref('')
const error = ref('')
const revenue = ref('')
const expenseAmount = ref('')
const expenseCategory = ref('')
const expenseDescription = ref('')
const fuelAmount = ref('')
const fuelPrice = ref('')
const maintenanceAmount = ref('')
const maintenanceCategory = ref('')
const maintenanceDescription = ref('')
const maintenanceLife = ref('')
const maintenanceOdometer = ref('')

const money = value => value == null ? '—' : `₹${(Number(value) / 100).toFixed(2)}`
const number = value => value == null ? '—' : Number(value).toFixed(1)
const effectiveOdometer = computed(() => Number.isFinite(props.odometer) ? props.odometer : null)
const report = computed(() => props.dailyReport || {})
const history = computed(() => Array.isArray(props.performance?.history) ? props.performance.history : [])

function resetNotice() { message.value = ''; error.value = '' }
function validPositive(value) { return Number.isFinite(Number(value)) && Number(value) > 0 }
async function run(label, action) {
  resetNotice(); busy.value = true
  try {
    await action()
    message.value = `${label} recorded.`
    emit('refresh')
  } catch (err) {
    error.value = String(err?.message || err)
  } finally { busy.value = false }
}

async function saveRevenue() {
  if (!validPositive(revenue.value)) throw new Error('Revenue must be positive')
  await run('Revenue', () => window.__kfeWorkCommands.recordRevenue({
    amount_paise: Math.round(Number(revenue.value) * 100),
    scope: 'BUSINESS',
    business_date: new Date().toISOString().slice(0, 10),
    work_session_id: props.activeShiftId || null,
  }))
  revenue.value = ''
}
async function saveExpense() {
  if (!validPositive(expenseAmount.value)) throw new Error('Expense amount must be positive')
  if (!expenseCategory.value.trim()) throw new Error('Expense category is required')
  await run('Expense', () => window.__kfeWorkCommands.recordExpense({
    amount: Number(expenseAmount.value), category: expenseCategory.value.trim(), description: expenseDescription.value.trim(),
    date: new Date().toISOString().slice(0, 10), work_session_id: props.activeShiftId || null,
  }))
  expenseAmount.value = ''; expenseCategory.value = ''; expenseDescription.value = ''
}
async function saveFuel() {
  if (!validPositive(fuelAmount.value) || !validPositive(fuelPrice.value)) throw new Error('Fuel amount and price must be positive')
  if (effectiveOdometer.value == null) throw new Error('Authoritative odometer is unavailable')
  await run('Fuel', () => window.__kfeWorkCommands.recordFuel({
    amount_paise: Math.round(Number(fuelAmount.value) * 100), price_per_kg: Number(fuelPrice.value),
    odometer: Math.round(effectiveOdometer.value), scope: 'BUSINESS', date: new Date().toISOString().slice(0, 10),
  }))
  fuelAmount.value = ''; fuelPrice.value = ''
}
async function saveMaintenance() {
  if (!validPositive(maintenanceAmount.value)) throw new Error('Maintenance amount must be positive')
  if (!maintenanceCategory.value.trim()) throw new Error('Maintenance category is required')
  const odometer = maintenanceOdometer.value === '' ? effectiveOdometer.value : Number(maintenanceOdometer.value)
  if (!Number.isFinite(odometer) || odometer < 0) throw new Error('Maintenance odometer is required')
  const expectedKmLife = maintenanceLife.value === '' ? null : Number(maintenanceLife.value)
  if (expectedKmLife != null && (!Number.isInteger(expectedKmLife) || expectedKmLife <= 0)) throw new Error('KM life must be a positive whole number')
  await run('Maintenance', () => window.__kfeWorkCommands.recordMaintenance({
    amount: Number(maintenanceAmount.value), category: maintenanceCategory.value.trim(), description: maintenanceDescription.value.trim(),
    date: new Date().toISOString().slice(0, 10), odometer: Math.round(odometer), vehicle: 'CURRENT_VEHICLE',
    expectedKmLife, workSessionId: props.activeShiftId || null,
  }))
  maintenanceAmount.value = ''; maintenanceCategory.value = ''; maintenanceDescription.value = ''; maintenanceLife.value = ''; maintenanceOdometer.value = ''
}
</script>

<template>
  <section class="work-operations" aria-label="Work operations">
    <header class="operations-header">
      <div><span class="eyebrow">WORK OPERATIONS</span><h2>Record activity</h2></div>
      <span v-if="busy" class="state">Saving…</span>
    </header>

    <div class="tabs" role="tablist" aria-label="Work operation views">
      <button type="button" :class="{active: section === 'capture'}" @click="section = 'capture'">Capture</button>
      <button type="button" :class="{active: section === 'summary'}" @click="section = 'summary'">Today</button>
      <button type="button" :class="{active: section === 'history'}" @click="section = 'history'">History</button>
    </div>

    <p v-if="message" class="notice success" role="status">{{ message }}</p>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>

    <template v-if="section === 'capture'">
      <div class="forms">
        <form @submit.prevent="saveRevenue">
          <h3>Revenue</h3>
          <label>Amount (₹)<input v-model="revenue" inputmode="decimal" type="number" min="0.01" step="0.01" required /></label>
          <button type="submit" :disabled="busy">Record Revenue</button>
        </form>
        <form @submit.prevent="saveFuel">
          <h3>Fuel</h3>
          <label>Amount (₹)<input v-model="fuelAmount" inputmode="decimal" type="number" min="0.01" step="0.01" required /></label>
          <label>Price / kg (₹)<input v-model="fuelPrice" inputmode="decimal" type="number" min="0.01" step="0.01" required /></label>
          <small>Odometer: {{ effectiveOdometer ?? 'unavailable' }}</small>
          <button type="submit" :disabled="busy">Record Fuel</button>
        </form>
        <form @submit.prevent="saveExpense">
          <h3>Business Expense</h3>
          <label>Category<input v-model="expenseCategory" required /></label>
          <label>Amount (₹)<input v-model="expenseAmount" inputmode="decimal" type="number" min="0.01" step="0.01" required /></label>
          <label>Description<input v-model="expenseDescription" /></label>
          <button type="submit" :disabled="busy">Record Expense</button>
        </form>
        <form @submit.prevent="saveMaintenance">
          <h3>Maintenance</h3>
          <label>Category<input v-model="maintenanceCategory" required /></label>
          <label>Amount (₹)<input v-model="maintenanceAmount" inputmode="decimal" type="number" min="0.01" step="0.01" required /></label>
          <label>Odometer<input v-model="maintenanceOdometer" inputmode="numeric" type="number" min="0" step="1" :placeholder="effectiveOdometer == null ? '' : String(effectiveOdometer)" /></label>
          <label>Expected KM life (optional)<input v-model="maintenanceLife" inputmode="numeric" type="number" min="1" step="1" /></label>
          <label>Description<input v-model="maintenanceDescription" /></label>
          <button type="submit" :disabled="busy">Record Maintenance</button>
        </form>
      </div>
    </template>

    <template v-else-if="section === 'summary'">
      <div class="summary-grid">
        <article><span>Business KM</span><strong>{{ number(report.businessDistanceKm) }} km</strong></article>
        <article><span>Personal KM</span><strong>{{ number(report.personalDistanceKm) }} km</strong></article>
        <article><span>Revenue</span><strong>{{ money(report.revenuePaise) }}</strong></article>
        <article><span>Fuel</span><strong>{{ money(report.fuelPaise) }}</strong></article>
        <article><span>Maintenance</span><strong>{{ money(report.maintenancePaise) }}</strong></article>
        <article><span>Expenses</span><strong>{{ money(report.expensePaise) }}</strong></article>
        <article><span>Loan Payments</span><strong>{{ money(report.loanPaise) }}</strong></article>
        <article><span>Fixed Overhead</span><strong>{{ money(report.fixedOverheadPaise) }}</strong></article>
        <article class="wide"><span>Total Operating Cost</span><strong>{{ money(report.totalExpensePaise) }}</strong></article>
      </div>
      <p class="context">Personal-use KM remains separated from business accounting. Maintenance is usage-allocated when an expected KM life is configured.</p>
    </template>

    <template v-else>
      <div v-if="!history.length" class="empty">No operational history is available yet.</div>
      <div v-else class="history-list">
        <article v-for="item in history" :key="item.date">
          <strong>{{ item.date }}</strong>
          <span>{{ number(item.businessKm) }} km</span>
          <span>{{ money(item.revenuePaise) }}</span>
        </article>
      </div>
    </template>
  </section>
</template>

<style scoped>
.work-operations{display:grid;gap:12px;padding:14px;border:1px solid var(--kfe-ui-border);border-radius:20px;background:var(--kfe-ui-surface);box-shadow:var(--kfe-ui-shadow)}
.operations-header{display:flex;justify-content:space-between;gap:10px;align-items:center}.eyebrow{font-size:.65rem;font-weight:900;color:var(--kfe-muted-text)}h2{margin:2px 0 0;font-size:1.1rem}.state{font-size:.7rem;color:var(--kfe-muted-text)}
.tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;padding:4px;border:1px solid var(--kfe-ui-border);border-radius:12px;background:var(--kfe-ui-surface-2)}.tabs button{border:0;border-radius:9px;padding:9px;font-weight:800;background:transparent;color:var(--kfe-muted-text)}.tabs button.active{background:var(--kfe-accent-soft);color:var(--kfe-accent)}
.forms{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.forms form{display:grid;gap:7px;padding:12px;border:1px solid var(--kfe-ui-border);border-radius:15px;background:var(--kfe-ui-surface-2)}h3{margin:0;font-size:.9rem}label{display:grid;gap:4px;font-size:.7rem;font-weight:800;color:var(--kfe-muted-text)}input{width:100%;box-sizing:border-box;min-height:40px;border:1px solid var(--kfe-ui-border);border-radius:9px;padding:8px;background:var(--kfe-ui-surface);color:var(--kfe-ui-text)}form button{min-height:42px;border:0;border-radius:9px;background:var(--kfe-accent);color:#fff;font-weight:850}form button:disabled{opacity:.55}small,.context,.empty{font-size:.7rem;color:var(--kfe-muted-text);line-height:1.4}
.notice{margin:0;padding:9px 10px;border-radius:10px;font-size:.72rem}.success{background:var(--kfe-accent-soft);color:var(--kfe-accent)}.error{background:var(--kfe-ui-surface-2);color:var(--kfe-ui-text);border:1px solid var(--kfe-ui-border)}
.summary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.summary-grid article{display:grid;gap:4px;padding:11px;border:1px solid var(--kfe-ui-border);border-radius:12px}.summary-grid span{font-size:.67rem;color:var(--kfe-muted-text)}.summary-grid strong{font-size:.95rem}.summary-grid .wide{grid-column:1/-1;border-color:var(--kfe-accent)}
.history-list{display:grid;gap:7px}.history-list article{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;padding:10px;border:1px solid var(--kfe-ui-border);border-radius:11px}.history-list span{font-size:.72rem;color:var(--kfe-muted-text)}
@media(max-width:600px){.forms{grid-template-columns:1fr}}@media(max-width:360px){.summary-grid{grid-template-columns:1fr}.summary-grid .wide{grid-column:auto}}
</style>