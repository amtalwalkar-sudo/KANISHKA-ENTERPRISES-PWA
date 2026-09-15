<template>
  <main class="admin" aria-label="Admin">
    <header class="admin-header">
      <small>ADMIN</small>
      <h1>Administration</h1>
      <p>Source-data management. Every write goes through KFE validation before persistence.</p>
    </header>

    <div v-if="globalMessage" class="state success" role="status">{{ globalMessage }}</div>
    <div v-if="globalError" class="state error" role="alert">{{ globalError }}</div>

    <section v-for="category in categories" :key="category.title" class="category" :aria-labelledby="category.id">
      <div class="category-heading"><small>{{ category.kicker }}</small><h2 :id="category.id">{{ category.title }}</h2></div>

      <section v-for="form in category.forms" :key="form.kind" class="form-card">
        <div class="section-heading">
          <div><small>{{ form.kicker }}</small><h3>{{ form.title }}</h3></div>
          <span class="source-badge">{{ editing[form.kind] ? 'Editing' : 'Source data' }}</span>
        </div>

        <form novalidate @submit.prevent="submit(form)">
          <template v-for="group in form.groups" :key="group.title">
            <h4 v-if="group.title">{{ group.title }}</h4>
            <div class="form-grid">
              <label v-for="field in group.fields" :key="field.name" :class="{ 'full-width': field.full }">
                <span>{{ field.label }}<b v-if="field.required"> *</b></span>
                <select v-if="field.options" v-model="values[form.kind][field.name]" :disabled="field.derived || field.readOnly || busy">
                  <option value="">Select</option>
                  <option v-for="option in field.options" :key="option" :value="option">{{ option }}</option>
                </select>
                <textarea v-else-if="field.type === 'textarea'" v-model="values[form.kind][field.name]" :rows="field.rows || 3" :disabled="field.derived || field.readOnly || busy" />
                <input v-else v-model="values[form.kind][field.name]" :type="field.type || 'text'" :min="field.type === 'number' ? 0 : undefined" :step="field.type === 'number' ? '0.01' : undefined" :disabled="field.derived || field.readOnly || busy" />
                <em v-if="field.derived" class="derived">Calculated by KFE — not editable</em>
                <em v-if="errors[form.kind]?.[field.name]" class="field-error">{{ errors[form.kind][field.name] }}</em>
              </label>
            </div>
          </template>

          <p v-if="warnings[form.kind]?.length" class="warning" role="alert">
            <strong>ERP warning</strong>
            <span v-for="warning in warnings[form.kind]" :key="warning">{{ warning }}</span>
            <label class="override"><input type="checkbox" v-model="override[form.kind]" /> I understand the consequence and want to save anyway.</label>
          </p>

          <div class="actions">
            <button type="submit" :disabled="busy">{{ editing[form.kind] ? 'Save correction' : 'Save record' }}</button>
            <button v-if="editing[form.kind]" type="button" class="secondary" :disabled="busy" @click="reset(form)">Cancel edit</button>
          </div>
        </form>

        <div class="records" v-if="records[form.kind]?.length">
          <h4>Existing records</h4>
          <article v-for="record in records[form.kind]" :key="record.id" class="record-row">
            <div><strong>{{ recordLabel(form, record) }}</strong><small>{{ record.updatedAt || record.createdAt || '—' }}</small></div>
            <div class="record-actions">
              <button type="button" class="secondary" :disabled="busy" @click="edit(form, record)">Edit</button>
              <button type="button" class="danger" :disabled="busy" @click="requestDelete(form, record)">Delete</button>
            </div>
          </article>
        </div>
      </section>
    </section>

    <section class="category" aria-labelledby="settings-title">
      <div class="category-heading"><small>SETTINGS</small><h2 id="settings-title">Settings</h2></div>
      <section class="settings-card">
        <div class="setting-row"><strong>Backup &amp; Restore</strong><span>Local and cloud backup/restore controls</span></div>
        <div class="setting-row"><strong>Themes</strong><span>Theme selection</span></div>
        <div class="setting-row"><strong>Temporary Data Reset</strong><span>Testing-only control; remove before production freeze</span></div>
      </section>
    </section>

    <div v-if="deleteCandidate" class="dialog-backdrop" role="presentation">
      <section class="dialog" role="alertdialog" aria-modal="true">
        <h3>Delete source record?</h3>
        <p>This removes the authoritative source record and can change dependent ERP calculations. The action cannot be silently undone.</p>
        <div class="actions"><button type="button" class="danger" :disabled="busy" @click="confirmDelete">Delete record</button><button type="button" class="secondary" :disabled="busy" @click="deleteCandidate=null">Cancel</button></div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { saveAdminRecord, validateAdminCommand, deleteAdminRecord } from '../application/admin.js'
import { AdminRepository } from '../repositories/adminRepository.js'

const f = (name, label, type = 'text', extra = {}) => ({ name, label, type, ...extra })
const select = (name, label, options, extra = {}) => ({ name, label, options, ...extra })
const required = field => ({ ...field, required: true })
const derived = (name, label) => ({ name, label, type: 'number', derived: true, readOnly: true })

const forms = [
  { kind: 'VEHICLE', kicker: 'VEHICLE', title: 'Vehicle', groups: [{ fields: [required(f('vehicleRegistrationNumber','Registration number')), required(f('vehicleMake','Make')), required(f('vehicleModel','Model')), f('vehicleVariant','Variant'), required(f('vehicleFuelType','Fuel type')), required(f('vehicleAcquisitionDate','Acquisition date','date')), f('vehicleAcquisitionCost','Acquisition cost / value','number'), f('vehicleBuyPrice','Buy price','number'), required(f('vehicleStatus','Vehicle status')), f('vehicleStatusDate','Status date','date'), f('vehicleSaleDate','Sale date','date'), f('vehicleSellPrice','Sell price','number'), f('vehicleExpiryDate','Expiry date where applicable','date'), f('vehicleCurrentOdometer','Current odometer','number'), f('vehicleLifecycleEvent','Lifecycle event'), f('vehicleLifecycleEventDate','Lifecycle event date','date'), f('vehicleLifecycleEventDetails','Lifecycle event details / reference','textarea',{full:true})] }] },
  { kind: 'DRIVER', kicker: 'DRIVER', title: 'Driver', groups: [{ fields: [required(f('driverName','Driver name')), f('driverIdentity','Driver identity details'), required(f('driverContact','Contact number','tel')), f('driverOtherContact','Other contact information'), required(f('driverStatus','Driver status')), f('driverVehicleAssignment','Vehicle assignment'), f('driverAssignmentDate','Assignment date','date'), f('driverAssignmentEndDate','Assignment end date where applicable','date')] }] },
  { kind: 'COMPLIANCE', kicker: 'COMPLIANCE', title: 'Compliance', groups: [{ fields: [required(f('complianceItemName','Compliance item name')), required(f('complianceValidFrom','Valid from','date')), f('complianceExpiryDate','Expiry date','date'), f('complianceAmount','Amount','number'), select('compliancePaymentStatus','Payment status',['paid','unpaid']), f('compliancePaymentDate','Payment date','date'), f('complianceAmountPaid','Amount paid','number'), required(f('complianceRecordDate','Record date','date')), select('complianceStatus','Status',['active','expired','cancelled']), f('complianceReference','Reference / document number'), f('complianceReminder','Reminder information','text',{full:true})] }] },
  { kind: 'MAINTENANCE', kicker: 'MAINTENANCE', title: 'Maintenance', groups: [{ fields: [required(f('maintenanceDate','Maintenance date','date')), required(f('maintenanceOdometer','Odometer','number')), f('maintenanceType','Maintenance type / category'), f('maintenanceAmount','Amount','number'), select('maintenancePaymentStatus','Payment status',['paid','unpaid']), f('maintenancePaymentDate','Payment date','date'), f('maintenanceAmountPaid','Amount paid','number'), required(select('maintenanceValidityType','Validity type',['KM based','Duration based'])), f('maintenanceValidityValue','Validity value','number'), f('nextServiceKm','Next service KM','number'), f('nextServiceDate','Next service date','date'), f('maintenanceCatalogReference','Catalog / parts / labour reference'), f('maintenanceNotes','Notes / reference','textarea',{full:true})] }] },
  { kind: 'SHIFT', kicker: 'SHIFT', title: 'Shift', groups: [{ fields: [f('shiftDate','Shift date','date'), f('shiftStatus','Shift status'), required(f('shiftStart','Shift start','datetime-local')), f('shiftEnd','Shift end','datetime-local'), required(f('openingOdometer','Opening odometer','number')), required(f('closingOdometer','Closing odometer','number')), f('shiftRevenue','Shift revenue','number'), f('personalKm','Personal KM','number'), f('deadKmSource','Dead KM allocation / source'), f('businessToll','Business toll','number'), select('businessTollTreatment','Business toll treatment',['None','Included','Excluded']), f('businessParking','Business parking','number'), select('businessParkingTreatment','Business parking treatment',['None','Included','Excluded']), f('personalToll','Personal toll','number'), f('personalParking','Personal parking','number'), f('shiftCorrectionReason','Correction reason'), f('shiftCorrectionReference','Correction reference')] }] },
  { kind: 'TRIP', kicker: 'RIDE / TRIP', title: 'Ride / Trip', groups: [{ fields: [f('tripShiftReference','Shift reference'), required(f('tripOperator','Operator')), required(f('tripType','Trip type')), required(f('tripStatus','Ride status')), required(f('tripStart','Ride start','datetime-local')), f('tripEnd','Ride end','datetime-local'), f('tripKm','Ride KM','number'), select('tripKmSource','Trip KM source',['GPS','Admin correction','verified manual correction']), f('tripRevenue','Ride revenue','number'), f('tripCancellationStatus','Cancellation status'), f('tripCancellationReason','Cancellation reason'), f('tripCancellationRevenue','Cancellation revenue where applicable','number'), f('tripPickup','Pickup'), f('tripDrop','Drop'), f('tripReconciliationStatus','Missed-trip / reconciliation status'), f('tripCorrectionReason','Correction reason'), f('tripCorrectionReference','Correction reference')] }] },
  { kind: 'FUEL', kicker: 'FUEL / REFUELLING', title: 'Fuel / Refuelling', groups: [{ fields: [f('fuelType','Fuel type'), required(f('fuelOdometer','Fuel odometer','number')), required(f('fuelPricePerKg','Price per kg','number')), required(f('fuelAmount','Amount','number')), select('fuelFillType','Full / partial refuelling',['Full','Partial']), f('fuelRecordedAt','Fuel record date/time','datetime-local'), f('fuelNotes','Notes / reference','textarea',{full:true})] }, { title: 'Calculated', fields: [derived('quantityKg','Quantity (kg)')] }] },
  { kind: 'LOAN', kicker: 'LOAN', title: 'Loan', groups: [{ title: 'Loan setup', fields: [required(f('loanPrincipal','Principal','number')), required(f('loanInterestRate','Interest rate','number')), required(f('loanTenure','Tenure','number')), required(f('loanStartDate','Loan start date','date')), required(f('loanStatus','Loan status')), f('loanReference','Loan reference / details'), derived('emi','EMI')] }, { title: 'EMI / payment record', fields: [required(f('emiNumber','EMI number','number')), required(f('emiDueDate','Due date','date')), derived('scheduledEmiAmount','Scheduled EMI amount'), f('emiPaymentDate','Actual payment date','date'), f('emiAmountPaid','Actual amount paid','number'), select('emiPaymentStatus','Payment status',['paid','unpaid','partial','overdue'])] }, { title: 'Delayed payment', fields: [select('loanDelayStatus','Delay status',['None','Delayed','Resolved']), f('loanDelayedPaymentDate','Delayed payment date','date'), f('loanDelayedAmount','Delayed amount','number'), f('loanDelayAdjustment','Charges / adjustment','number'), f('loanDelayReference','Reference')] }, { title: 'Prepayment', fields: [f('prepaymentDate','Prepayment date','date'), f('prepaymentAmount','Prepayment amount','number'), derived('prepaymentPrincipalBefore','Outstanding principal before'), derived('prepaymentPrincipalAfter','Outstanding principal after'), select('prepaymentStatus','Prepayment status',['Recorded','Reversed']), f('prepaymentReference','Reference'), derived('prepaymentEffect','Prepayment effect / schedule record')] }] },
  { kind: 'RECOVERY', kicker: 'PRE-ACTIVATION RECOVERY', title: 'Pre-Activation Recovery', groups: [{ fields: [f('recoveryHistoricalMaintenance','Historical maintenance burden','number'), f('recoveryLoanBurden','Unpaid / pre-activation EMI or loan burden','number'), f('recoveryRepairs','Pre-activation repairs / maintenance','number'), f('recoverySetupCosts','Initial used-vehicle / setup / business costs','number'), select('recoveryApplicability','Recovery applicability',['Applicable','Not applicable']), f('recoveryStartDate','Recovery start date','date'), f('recoveryPeriodReference','Recovery period / reference')] }] },
  { kind: 'TARGET', kicker: 'DRIVER TARGET', title: 'Driver Target', groups: [{ fields: [required(f('targetDriver','Driver')), required(f('targetValue','Target value','number'))] }] }
]

const categories = [
  { id:'operations-title', kicker:'OPERATIONS', title:'Operations', forms: forms.filter(f => ['VEHICLE','DRIVER','COMPLIANCE','MAINTENANCE','SHIFT','TRIP','FUEL'].includes(f.kind)) },
  { id:'finance-title', kicker:'FINANCE', title:'Finance', forms: forms.filter(f => ['LOAN','RECOVERY'].includes(f.kind)) },
  { id:'target-title', kicker:'TARGET & BREAK-EVEN', title:'Target & Break-even', forms: forms.filter(f => f.kind === 'TARGET') }
]

const values = reactive({})
const records = reactive({})
const errors = reactive({})
const warnings = reactive({})
const override = reactive({})
const editing = reactive({})
const deleteCandidate = ref(null)
const busy = ref(false)
const globalMessage = ref('')
const globalError = ref('')
const dirty = computed(() => Object.values(values).some(value => Object.values(value).some(v => v !== '' && v !== null)))

const allFields = form => form.groups.flatMap(group => group.fields)
const freshValues = form => Object.fromEntries(allFields(form).map(field => [field.name, field.derived ? '' : '']))
for (const form of forms) { values[form.kind] = freshValues(form); records[form.kind] = []; errors[form.kind] = {}; warnings[form.kind] = []; override[form.kind] = false; editing[form.kind] = null }

const load = async form => { records[form.kind] = await AdminRepository.list(form.kind) }
const loadAll = async () => { for (const form of forms) await load(form) }
const recordLabel = (form, record) => record.vehicleRegistrationNumber || record.driverName || record.complianceItemName || record.maintenanceType || record.operator || record.tripOperator || record.shiftDate || record.shiftStartAt || record.fuelRecordedAt || record.loanReference || record.targetDriver || record.recoveryStartDate || String(record.id).slice(0,8)

const edit = (form, record) => { editing[form.kind] = record; values[form.kind] = { ...freshValues(form), ...record }; errors[form.kind] = {}; warnings[form.kind] = []; override[form.kind] = false }
const reset = form => { editing[form.kind] = null; values[form.kind] = freshValues(form); errors[form.kind] = {}; warnings[form.kind] = []; override[form.kind] = false }

const submit = async form => {
  if (busy.value) return
  globalMessage.value = ''; globalError.value = ''
  const fields = allFields(form)
  const gate = await validateAdminCommand({ kind: form.kind, fields, values: values[form.kind], existing: editing[form.kind], overrideWarning: override[form.kind] })
  errors[form.kind] = gate.errors || {}; warnings[form.kind] = gate.warnings || []
  if (!gate.ok) return
  busy.value = true
  try {
    const result = await saveAdminRecord({ kind: form.kind, fields, values: values[form.kind], existing: editing[form.kind], overrideWarning: override[form.kind] })
    if (!result.ok) { errors[form.kind] = result.errors || {}; warnings[form.kind] = result.warnings || []; return }
    globalMessage.value = result.warnings?.length ? 'Saved with ERP warning override.' : 'Record saved successfully.'
    reset(form); await load(form)
  } catch (error) { globalError.value = error?.message || 'Save failed.' } finally { busy.value = false }
}

const requestDelete = record => { deleteCandidate.value = record }
const confirmDelete = async () => {
  if (busy.value || !deleteCandidate.value) return
  busy.value = true; globalMessage.value = ''; globalError.value = ''
  try {
    const result = await deleteAdminRecord({ kind: deleteCandidate.value.kind, id: deleteCandidate.value.id, confirm: true })
    if (!result.ok) { globalError.value = result.errors?._form || 'Delete failed.'; return }
    const form = forms.find(f => f.kind === deleteCandidate.value.kind)
    globalMessage.value = 'Record deleted.'; deleteCandidate.value = null; if (form) await load(form)
  } catch (error) { globalError.value = error?.message || 'Delete failed.' } finally { busy.value = false }
}

const beforeUnload = event => { if (dirty.value) { event.preventDefault(); event.returnValue = '' } }
onMounted(async () => { window.addEventListener('beforeunload', beforeUnload); await loadAll() })
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
</script>

<style scoped>
.admin{padding:20px 16px 120px;max-width:960px;margin:0 auto}.admin-header{margin-bottom:22px}.admin-header small,.category-heading small,.section-heading small{font-size:11px;letter-spacing:.12em;font-weight:700}.admin-header h1,.category-heading h2,.section-heading h3{margin:4px 0}.admin-header p{margin:8px 0;opacity:.72}.category{margin-bottom:32px}.category-heading{margin-bottom:14px}.form-card,.settings-card{border:1px solid rgba(127,127,127,.25);border-radius:18px;padding:18px;margin-bottom:16px}.section-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:18px}.source-badge{border:1px solid rgba(127,127,127,.3);border-radius:999px;padding:5px 9px;font-size:11px;white-space:nowrap}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}label{display:grid;gap:6px;min-width:0}label>span{font-size:13px;font-weight:600}label b{font-weight:700}input,select,textarea{width:100%;box-sizing:border-box;border:1px solid rgba(127,127,127,.35);border-radius:10px;padding:10px 11px;font:inherit;background:transparent}textarea{resize:vertical}.full-width{grid-column:1/-1}h4{margin:22px 0 12px}.derived,.field-error{font-size:11px;font-style:normal}.derived{opacity:.65}.field-error{opacity:.9}.actions{display:flex;gap:9px;margin-top:16px;flex-wrap:wrap}button{border:0;border-radius:10px;padding:10px 14px;font:inherit;font-weight:700;cursor:pointer}button:disabled{opacity:.5;cursor:not-allowed}.secondary{border:1px solid rgba(127,127,127,.3);background:transparent}.danger{border:1px solid rgba(190,60,60,.5);background:transparent}.state,.warning{border-radius:12px;padding:12px;margin:12px 0}.success{border:1px solid rgba(70,150,90,.45)}.error{border:1px solid rgba(190,60,60,.5)}.warning{display:grid;gap:7px;border:1px solid rgba(190,140,40,.55)}.warning span{font-size:13px}.override{display:flex;align-items:center;gap:8px;font-size:12px}.override input{width:auto}.records{margin-top:20px}.record-row{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:11px 0;border-top:1px solid rgba(127,127,127,.16)}.record-row>div:first-child{display:grid;gap:3px}.record-row small{opacity:.62}.record-actions{display:flex;gap:7px}.record-actions button{padding:7px 10px;font-size:12px}.setting-row{display:grid;gap:3px;padding:12px 0;border-bottom:1px solid rgba(127,127,127,.16)}.setting-row:last-child{border-bottom:0}.setting-row span{font-size:13px;opacity:.7}.dialog-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);display:grid;place-items:center;padding:20px;z-index:20}.dialog{max-width:460px;width:100%;background:var(--color-background-primary,#111);border:1px solid rgba(127,127,127,.3);border-radius:18px;padding:20px}.dialog p{opacity:.78;line-height:1.5}@media(max-width:640px){.form-grid{grid-template-columns:1fr}.full-width{grid-column:auto}.record-row{align-items:flex-start;flex-direction:column;width:100%}}
</style>
