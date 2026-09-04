<script setup>
import { computed, onMounted, ref, watch } from 'vue';

const props=defineProps({application:{type:Object,required:true},online:{type:Boolean,default:true}});
const emit=defineEmits(['open','back']);
const section=ref('home');
const week=ref(null);
const model=ref(null);
const loading=ref(true);
const error=ref('');
const month=ref(new Date().toISOString().slice(0,7));
const managementGroups=[
  {title:'BUSINESS',items:['Vehicle','Driver']},
  {title:'FINANCE',items:['Finance']},
  {title:'OPERATIONS',items:['Renewals','Maintenance','Loans']},
  {title:'SYSTEM',items:['Settings']}
];
const financialTiles=['Revenue','Business Cost','Profit','Profit/KM','Cost/KM','Break-even'];
const admin= computed(()=>props.application);
const money=value=>value==null?'Unavailable':`₹${(Number(value)/100).toFixed(2)}`;
const percent=value=>value==null?'Unavailable':`${(Number(value)*100).toFixed(1)}%`;
const statusText=value=>value==='UNAVAILABLE'?'Calculation unavailable':value;
const currentState=computed(()=>model.value?.currentState||{});
async function load(){loading.value=true;error.value='';try{model.value=await admin.value.getAdminState(month.value);}catch(e){error.value=String(e?.message||e);model.value=null;}finally{loading.value=false;}}
function open(item){emit('open',item);}
function goManagement(){section.value='management';}
function goHome(){section.value='home';week.value=null;}
function goMonth(){section.value='month';week.value=null;}
function goFinance(){section.value='finance';week.value=null;}
function selectWeek(value){week.value=value;section.value='week';}
function selectDay(date){emit('open',{module:'Timeline',horizon:'Day',date});}
watch(()=>props.online,load);
onMounted(load);
</script>

<template>
<section class="kfe-admin" aria-labelledby="admin-title">
  <header class="kfe-admin__header">
    <button v-if="section!=='home'" type="button" class="kfe-secondary-action" @click="section==='management'||section==='month'||section==='finance'?goHome():section==='week'?goMonth():goHome()">‹ Admin</button>
    <p class="kfe-eyebrow">BACK-OFFICE</p>
    <h1 id="admin-title">Admin</h1>
    <p class="kfe-destination-subtitle">Administrative command center. Driver operations remain in Work, Performance and Timeline.</p>
  </header>

  <p v-if="loading" class="kfe-boundary-note" role="status">Loading authoritative state…</p>
  <p v-if="error" class="kfe-error-note" role="alert">{{error}}</p>

  <template v-if="!loading && model">
    <template v-if="section==='home'">
      <section class="kfe-admin-section"><h2>CURRENT STATE</h2><div class="kfe-admin-grid"><article><span>Vehicle</span><strong>{{currentState.vehicle?.registration_number||'Unavailable'}}</strong></article><article><span>Connection</span><strong>{{online?'Online':'Offline'}}</strong></article><article><span>Driver</span><strong>{{currentState.driver?.name||'None assigned'}}</strong></article><article><span>Odometer</span><strong>{{currentState.odometer==null?'Unavailable':`${currentState.odometer} km`}}</strong></article></div></section>
      <section class="kfe-admin-section"><h2>ATTENTION</h2><article v-for="item in model.attention" :key="item.id||item.message" class="kfe-admin-card"><strong>{{item.title||'Action required'}}</strong><p>{{item.message}}</p></article><p v-if="!model.attention.length" class="kfe-boundary-note">No action required right now.</p></section>
      <section class="kfe-admin-section"><h2>INSIGHT</h2><article class="kfe-admin-card"><p>{{model.insight}}</p></article></section>
      <section class="kfe-admin-section"><h2>PROFITABILITY</h2><article class="kfe-admin-card"><strong>{{statusText(model.profitability.status)}}</strong><div class="kfe-position-line"><span>LOSS</span><span>●</span><span>PROFIT</span></div><dl><div><dt>Profit/KM</dt><dd>{{money(model.profitability.profitPerKmPaise)}}</dd></div><div><dt>Cost/KM</dt><dd>{{money(model.profitability.costPerKmPaise)}}</dd></div><div><dt>Margin</dt><dd>{{percent(model.profitability.marginPaise)}}</dd></div></dl></article></section>
      <section class="kfe-admin-section"><h2>BREAK-EVEN</h2><article class="kfe-admin-card"><strong>{{statusText(model.breakEven.status)}}</strong><div class="kfe-break-even-line"><span>₹0</span><span>BREAK-EVEN</span><span>● CURRENT</span></div><dl><div><dt>Break-even</dt><dd>{{money(model.breakEven.breakEvenPaise)}}</dd></div><div><dt>Current</dt><dd>{{money(model.breakEven.currentPaise)}}</dd></div><div><dt>Remaining</dt><dd>{{money(model.breakEven.remainingPaise)}}</dd></div></dl></article></section>
      <div class="kfe-admin-actions"><button class="kfe-primary-action" type="button" @click="goMonth">Month View</button><button class="kfe-secondary-action" type="button" @click="goFinance">Finance</button><button class="kfe-secondary-action" type="button" @click="goManagement">Management</button><button class="kfe-secondary-action" type="button" @click="open({module:'Timeline',horizon:'Month'})">View Timeline</button></div>
    </template>

    <template v-else-if="section==='month'">
      <section class="kfe-admin-section"><label class="kfe-form-label" for="admin-month">Month</label><input id="admin-month" v-model="month" type="month" @change="load"></section>
      <section class="kfe-admin-section"><h2>{{month}} · MONTH OVERVIEW</h2><div class="kfe-admin-grid"><article><span>Revenue</span><strong>{{money(model.month.revenuePaise)}}</strong></article><article><span>Business Cost</span><strong>{{money(model.month.costsPaise)}}</strong></article><article><span>Profit</span><strong>{{money(model.month.profitPaise)}}</strong></article><article><span>Business KM</span><strong>{{model.month.businessKm==null?'Unavailable':`${model.month.businessKm} km`}}</strong></article></div></section>
      <section class="kfe-admin-section"><h2>PROFITABILITY</h2><article class="kfe-admin-card"><strong>{{statusText(model.profitability.status)}}</strong><p>Profit/KM {{money(model.profitability.profitPerKmPaise)}} · Cost/KM {{money(model.profitability.costPerKmPaise)}} · Margin {{percent(model.profitability.marginPaise)}}</p></article></section>
      <section class="kfe-admin-section"><h2>BREAK-EVEN</h2><article class="kfe-admin-card"><strong>{{statusText(model.breakEven.status)}}</strong><p>Break-even {{money(model.breakEven.breakEvenPaise)}} · Current {{money(model.breakEven.currentPaise)}} · Remaining {{money(model.breakEven.remainingPaise)}}</p></article></section>
      <section class="kfe-admin-section"><h2>INSIGHT</h2><article class="kfe-admin-card"><p>{{model.insight}}</p></article></section>
      <section class="kfe-admin-section"><h2>WEEKLY</h2><div class="kfe-admin-list"><button v-for="item in model.weekly" :key="item.week" type="button" @click="selectWeek(item.week)"><span>Week {{item.week}}</span><span>View Week ›</span></button></div></section>
      <section class="kfe-admin-section"><h2>TIMELINE</h2><button class="kfe-list-action" type="button" @click="open({module:'Timeline',horizon:'Month'})"><span>Month timeline</span><span>View Month Timeline ›</span></button></section>
    </template>

    <template v-else-if="section==='week'">
      <section class="kfe-admin-section"><h2>WEEK {{week}}</h2><article class="kfe-admin-card"><p>Weekly financial values are supplied by the application read model. No presentation-layer calculation is performed.</p></article></section>
      <section class="kfe-admin-section"><h2>DAYS</h2><div class="kfe-admin-list"><button v-for="day in 7" :key="day" type="button" @click="selectDay(`${month}-W${week}-${day}`)"><span>Day {{day}}</span><span>View Day ›</span></button></div></section>
      <button class="kfe-list-action" type="button" @click="open({module:'Timeline',horizon:'Week',week})"><span>Week timeline</span><span>View Week Timeline ›</span></button>
    </template>

    <template v-else-if="section==='finance'">
      <section class="kfe-admin-section"><h2>FINANCE</h2><p class="kfe-boundary-note">Derived, read-only financial dashboard. Correct source records instead of editing financial results here.</p><div class="kfe-finance-tiles"><button v-for="tile in financialTiles" :key="tile" type="button" @click="open({module:'Finance',detail:tile})"><strong>{{tile}}</strong><span>{{tile==='Revenue'?money(model.month.revenuePaise):tile==='Business Cost'?money(model.month.costsPaise):tile==='Profit'?money(model.month.profitPaise):tile==='Break-even'?money(model.breakEven.breakEvenPaise):tile==='Profit/KM'?money(model.profitability.profitPerKmPaise):money(model.profitability.costPerKmPaise)}}</span></button></div></section>
      <section class="kfe-admin-section"><label class="kfe-form-label" for="finance-month">Month</label><input id="finance-month" v-model="month" type="month" @change="load"></section>
    </template>

    <template v-else-if="section==='management'">
      <section v-for="group in managementGroups" :key="group.title" class="kfe-admin-section"><h2>{{group.title}}</h2><div class="kfe-admin-list"><button v-for="item in group.items" :key="item" type="button" @click="open(item)"><span>{{item}}</span><span>›</span></button></div></section>
    </template>
  </template>
</section>
</template>

<style scoped>
.kfe-admin{padding:16px;display:grid;gap:16px;padding-bottom:96px}.kfe-admin__header{display:grid;gap:6px}.kfe-admin-section{display:grid;gap:10px}.kfe-admin-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.kfe-admin-grid article,.kfe-admin-card{padding:14px;border:1px solid var(--kfe-ui-border);border-radius:14px;background:var(--kfe-ui-surface);display:grid;gap:6px}.kfe-admin-grid span,.kfe-admin-card span{font-size:.8rem;opacity:.72}.kfe-admin-grid strong{font-size:1.05rem}.kfe-admin-card dl{display:grid;gap:8px}.kfe-admin-card dl div{display:flex;justify-content:space-between;gap:12px}.kfe-admin-card dt{opacity:.72}.kfe-admin-card dd{margin:0;font-weight:700}.kfe-position-line,.kfe-break-even-line{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:.78rem}.kfe-admin-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.kfe-admin-list{display:grid;gap:8px}.kfe-admin-list button,.kfe-finance-tiles button{min-height:52px;border:1px solid var(--kfe-ui-border);border-radius:12px;background:var(--kfe-ui-surface);color:var(--kfe-ui-text);padding:12px;display:flex;justify-content:space-between;align-items:center;text-align:left}.kfe-finance-tiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.kfe-finance-tiles button{min-height:110px;display:grid;align-content:center;gap:8px}.kfe-finance-tiles span{font-size:1.05rem;font-weight:800}
@media(min-width:700px){.kfe-admin-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.kfe-finance-tiles{grid-template-columns:repeat(3,minmax(0,1fr))}}
</style>
