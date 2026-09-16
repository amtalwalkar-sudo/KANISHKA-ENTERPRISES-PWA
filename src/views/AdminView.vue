<script setup>
import { computed, onMounted, ref } from 'vue'
import UniversalAdminForm from '../components/admin/UniversalAdminForm.vue'
import { ADMIN_FORM_DEFINITIONS, ADMIN_FORM_KEYS } from '../application/admin/adminFormDefinitions.js'
import { AdminService } from '../application/admin/adminService.js'

const groups=[{key:'operations',title:'Operations',forms:['vehicle','driver','compliance','maintenance','driverCollectedData']},{key:'finance',title:'Finance',forms:['loan','loanPayment','prepayment']},{key:'targetBreakEven',title:'Target & Break-even',forms:['driverTarget','breakEvenInputs']}]
const selected=ref('vehicle'), records=ref([]), editing=ref(null), draft=ref({}), loading=ref(false), error=ref(''), notice=ref('')
const baseDefinition=computed(()=>ADMIN_FORM_DEFINITIONS[selected.value])
const options=computed(()=>({vehicles:recordsFor('vehicle'),drivers:recordsFor('driver'),loans:recordsFor('loan')}))
function recordsFor(key){return key===selected.value?records.value:[]}
function label(key,r){if(!r)return '';const v=r.values||r;return key==='vehicle'?[v.registrationNumber,v.make,v.model].filter(Boolean).join(' · ')||r.id:key==='driver'?v.name||r.id:key==='loan'?[v.lender,v.accountReference].filter(Boolean).join(' · ')||r.id:r.id}
function definition(){const d=structuredClone(baseDefinition.value);for(const f of d.fields){if(f.key==='vehicleId')f.options=options.value.vehicles.map(x=>x.id);if(f.key==='driverId')f.options=options.value.drivers.map(x=>x.id);if(f.key==='loanId')f.options=options.value.loans.map(x=>x.id)}return d}
const activeDefinition=computed(definition)
const optionLabels=computed(()=>{const map={};for(const x of options.value.vehicles)map[x.id]=label('vehicle',x);for(const x of options.value.drivers)map[x.id]=label('driver',x);for(const x of options.value.loans)map[x.id]=label('loan',x);return map})
async function load(){loading.value=true;error.value='';try{records.value=await AdminService.list(selected.value)}catch(e){error.value=e.message||'Unable to load records.'}finally{loading.value=false}}
function choose(key){selected.value=key;editing.value=null;draft.value={};notice.value='';load()}
function add(){editing.value=null;draft.value={}}
function edit(r){editing.value=r.id;draft.value=structuredClone(r.values||{})}
async function save(values){loading.value=true;error.value='';notice.value='';try{await AdminService.save(selected.value,values,editing.value);notice.value='Saved successfully.';editing.value=null;draft.value={};await load()}catch(e){error.value=e.validation?Object.values(e.validation).join(' '):e.message||'Save failed.'}finally{loading.value=false}}
async function remove(r){if(!confirm('Delete this source record? Related records may prevent deletion.'))return;loading.value=true;error.value='';try{await AdminService.remove(selected.value,r.id);notice.value='Deleted.';await load()}catch(e){error.value=e.message||'Delete failed.'}finally{loading.value=false}}
onMounted(load)
</script>
<template>
<section class="admin-page" aria-label="Admin">
<header><small>ADMIN</small><h1>Control &amp; Records</h1><p>Manage authoritative KFE source records. Derived ERP values are calculated elsewhere.</p></header>
<nav class="category-nav"><button v-for="g in groups" :key="g.key" :class="{active:g.forms.includes(selected)}" @click="choose(g.forms[0])">{{g.title}}</button></nav>
<div class="form-tabs"><button v-for="g in groups" v-for="key in g.forms" :key="key" :class="{active:selected===key}" @click="choose(key)">{{ADMIN_FORM_DEFINITIONS[key].title}}</button></div>
<section class="panel"><div class="panel-head"><div><small>SOURCE RECORD</small><h2>{{baseDefinition.title}}</h2></div><button class="primary" @click="add">+ New</button></div>
<p v-if="error" class="error">{{error}}</p><p v-if="notice" class="notice">{{notice}}</p>
<UniversalAdminForm v-if="editing!==null || records.length===0 && draft" :definition="activeDefinition" :model-value="draft" @update:model-value="draft=$event" @submit="save" @cancel="editing=null;draft={}" :submit-label="editing!==null?'Update':'Save'" />
<div v-else class="record-list"><article v-for="r in records" :key="r.id" class="record"><div><strong>{{label(selected,r)}}</strong><small>Updated {{r.updatedAt||'—'}}</small><div class="chips"><span v-for="(v,k) in r.values" v-if="v!==''&&v!==null&&v!==undefined&&k!=='notes'" :key="k">{{optionLabels[v]||v}}</span></div></div><div class="actions"><button @click="edit(r)">Edit</button><button @click="remove(r)">Delete</button></div></article></div>
<p v-if="!loading && records.length===0" class="empty">No {{baseDefinition.title}} records yet. Create the first source record above.</p>
</section>
<section class="derived"><small>ERP CALCULATIONS</small><h2>Derived automatically</h2><p>Vehicle KM, Business KM, Dead KM, mileage, revenue/KM, revenue/hour, cost/KM, profit, break-even result, achievement, pace, projection and provision totals are not Admin inputs.</p></section>
<aside class="boundary">🛡️ <span><strong>Controlled boundary</strong><br>Admin validates source records and persists through the Admin application/repository path. Operational execution and ERP calculations remain outside Admin.</span></aside>
</section>
</template>
<style scoped>
.admin-page{min-height:100%;padding:18px 14px 30px;background:#f8fafc;color:#0f172a;box-sizing:border-box}header h1{margin:3px 0 5px;font-size:1.45rem}header p{margin:0;color:#64748b;font-size:.82rem}small{font-size:.68rem;font-weight:800;letter-spacing:.08em;color:#64748b}.category-nav,.form-tabs{display:flex;gap:8px;overflow:auto;margin-top:14px;padding-bottom:2px}.category-nav button,.form-tabs button,.actions button,.primary{border:1px solid #cbd5e1;background:#fff;border-radius:10px;padding:9px 11px;white-space:nowrap;font-weight:650}.category-nav button.active,.form-tabs button.active{border-color:#475569;background:#f1f5f9}.panel,.derived,.boundary{margin-top:14px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;padding:14px}.panel-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}.panel h2,.derived h2{margin:3px 0;font-size:1.05rem}.primary{background:#0f172a;color:#fff;border-color:#0f172a}.record-list{display:grid;gap:9px}.record{display:flex;justify-content:space-between;gap:12px;border:1px solid #e2e8f0;border-radius:11px;padding:11px}.record small{display:block;margin-top:3px;letter-spacing:0;font-weight:500}.chips{display:flex;gap:5px;flex-wrap:wrap;margin-top:7px}.chips span{background:#f1f5f9;border-radius:7px;padding:4px 6px;font-size:.68rem}.actions{display:flex;gap:6px;align-items:center}.error{color:#b42318;background:#fef3f2;padding:9px;border-radius:8px;font-size:.75rem}.notice{color:#166534;background:#f0fdf4;padding:9px;border-radius:8px;font-size:.75rem}.empty{color:#64748b;font-size:.76rem}.derived p,.boundary{color:#64748b;font-size:.72rem;line-height:1.45}.boundary{display:flex;gap:9px}@media(max-width:640px){.record{flex-direction:column}.actions{justify-content:flex-end}}
</style>
