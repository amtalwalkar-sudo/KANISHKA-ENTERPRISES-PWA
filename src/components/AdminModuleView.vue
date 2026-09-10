<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AdminCurrentState from './admin/AdminCurrentState.vue'
import AdminOperatingPosition from './admin/AdminOperatingPosition.vue'
import AdminPeriodOverview from './admin/AdminPeriodOverview.vue'
import AdminInsight from './admin/AdminInsight.vue'
import AdminExpenseBreakdown from './admin/AdminExpenseBreakdown.vue'
import AdminLoanStatus from './admin/AdminLoanStatus.vue'
import AdminAttention from './admin/AdminAttention.vue'
import AdminProfitability from './admin/AdminProfitability.vue'
import AdminBreakEven from './admin/AdminBreakEven.vue'
import AdminRecordGateway from './admin/AdminRecordGateway.vue'
import AdminMonthView from './admin/AdminMonthView.vue'
import AdminWeekView from './admin/AdminWeekView.vue'
import AdminFinanceView from './admin/AdminFinanceView.vue'
import AdminManagementView from './admin/AdminManagementView.vue'
import AdminFixedExpenses from './admin/AdminFixedExpenses.vue'

const props=defineProps({application:{type:Object,required:true},online:{type:Boolean,default:true}})
const emit=defineEmits(['open','back'])
const section=ref('home'),week=ref(null),model=ref(null),loanModel=ref(null),loading=ref(true),error=ref(''),month=ref(new Date().toISOString().slice(0,7))
const managementGroups=[{title:'BUSINESS',items:['Vehicle','Driver']},{title:'FINANCE',items:['Finance','Fixed Expenses']},{title:'OPERATIONS',items:['Renewals','Maintenance','Loans']},{title:'SYSTEM',items:['Settings']}]
const money=v=>v==null?'Unavailable':`₹${(Number(v)/100).toFixed(2)}`
const percent=v=>v==null?'Unavailable':`${(Number(v)*100).toFixed(1)}%`
const statusText=v=>v==='UNAVAILABLE'?'Calculation unavailable':v
const currentState=computed(()=>model.value?.currentState||{})
const fixedExpenses=computed(()=>model.value?.fixedExpenses||[])
const expenseBreakdown=computed(()=>model.value?.expenseBreakdown||model.value?.month?.expenseBreakdown||{})
const loanItems=computed(()=>{const v=loanModel.value;return Array.isArray(v)?v:(v?.loans||v?.items||v?.records||[])})
async function load(){loading.value=true;error.value='';try{model.value=await props.application.getAdminState(month.value);try{loanModel.value=await props.application.getLoanReadModel(month.value)}catch{loanModel.value=null}}catch(e){error.value=String(e?.message||e);model.value=null}finally{loading.value=false}}
function open(item){if(item==='Fixed Expenses'){section.value='fixed-expenses';return}emit('open',item)}
function goHome(){section.value='home';week.value=null}
function goMonth(){section.value='month';week.value=null}
function goFinance(){section.value='finance';week.value=null}
function goManagement(){section.value='management';week.value=null}
function selectWeek(v){week.value=v;section.value='week'}
watch(()=>props.online,load);onMounted(load)
</script>
<template>
<section class="kfe-admin" aria-labelledby="admin-title">
<header class="kfe-admin__header"><button v-if="section!=='home'" type="button" class="kfe-secondary-action" @click="section==='week'?goMonth():goHome()">‹ Admin</button><p class="kfe-eyebrow">BACK-OFFICE</p><h1 id="admin-title">Admin</h1><p class="kfe-destination-subtitle">Administrative command center for business operations, finance and management.</p></header>
<p v-if="loading" class="kfe-boundary-note" role="status">Loading authoritative state…</p><p v-if="error" class="kfe-error-note" role="alert">{{error}}</p>
<template v-if="!loading && model">
<template v-if="section==='home'">
<AdminCurrentState :current-state="currentState" :online="online" />
<AdminOperatingPosition :month="model.month" :money="money" />
<AdminPeriodOverview :month-label="month" :period="model.month" :money="money" />
<AdminInsight :insight="model.insight" />
<AdminExpenseBreakdown :expense-breakdown="expenseBreakdown" :period="model.month" :money="money" />
<AdminLoanStatus :loan-model="loanModel" :money="money" />
<AdminAttention :attention="model.attention" />
<AdminProfitability :profitability="model.profitability" :money="money" :percent="percent" :status-text="statusText" />
<AdminBreakEven :break-even="model.breakEven" :money="money" :status-text="statusText" />
<AdminRecordGateway @open="open" />
<div class="kfe-admin-actions"><button class="kfe-primary-action" type="button" @click="goMonth">Month View</button><button class="kfe-secondary-action" type="button" @click="goFinance">Finance</button><button class="kfe-secondary-action" type="button" @click="goManagement">Management</button></div>
</template>
<AdminMonthView v-else-if="section==='month'" :month="month" :period="model.month" :expense-breakdown="expenseBreakdown" :weekly="model.weekly" :loan-count="loanItems.length" :money="money" @update:month="month=$event" @change="load" @week="selectWeek" />
<AdminWeekView v-else-if="section==='week'" :week="week" />
<AdminFinanceView v-else-if="section==='finance'" :month="month" :period="model.month" :profitability="model.profitability" :break-even="model.breakEven" :money="money" @change="v=>{month=v;load()}" />
<AdminManagementView v-else-if="section==='management'" :groups="managementGroups" @open="open" />
<AdminFixedExpenses v-else-if="section==='fixed-expenses'" :rows="fixedExpenses" :application="application" :money="money" :reload="load" />
</template>
</section>
</template>
<style scoped>
/* Admin Root Container */
:host, div {
  box-sizing: border-box;
}

:host, div:first-child {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow-y: auto;
  padding: 16px;
  gap: 12px;
  background-color: #f8fafc;
}

/* Card Wrappers */
:deep(section), :deep(article), :deep(.card) {
}

/* Row Formatting (Separates Keys & Values) */
:deep(p), :deep(li), :deep(.row) {
}

:deep(h1), :deep(h2), :deep(h3) {
}

:deep(button) {
}
</style>
