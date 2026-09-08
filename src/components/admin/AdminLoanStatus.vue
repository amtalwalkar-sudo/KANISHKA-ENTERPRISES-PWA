<template>
<section class="kfe-admin-section">
<h2>LOAN STATUS</h2>
<div v-if="loanItems.length" class="kfe-admin-list">
<article v-for="loan in loanItems" :key="loan.id||loan.loanId||loan.name" class="kfe-admin-card">
<strong>{{loan.name||loan.lender||loan.loanNumber||'Loan'}}</strong>
<p>Remaining balance: {{money(loan.remainingBalancePaise??loan.remaining_balance_paise??loan.balancePaise)}}</p>
<p>EMI: {{money(loan.emiPaise??loan.emi_paise)}} · {{loan.status||'Active'}}</p>
<div v-if="loan.id===primaryLoan?.id && amortization.length" class="kfe-loan-schedule">
<strong>Amortization</strong>
<div v-for="row in amortization.slice(0,12)" :key="row.month" class="kfe-loan-row">
<span>Month {{row.month}}</span><span>Principal {{money(row.principal_paise)}}</span><span>Interest {{money(row.interest_paise)}}</span><span>Balance {{money(row.ending_balance_paise)}}</span>
</div>
</div>
<div v-if="loan.id===primaryLoan?.id" class="kfe-loan-prepayment">
<label>Prepayment calculator<input v-model.number="prepayment" type="number" min="0" step="1" inputmode="numeric" placeholder="₹ amount" /></label>
<button type="button" @click="calculatePrepayment">Calculate</button>
<p v-if="prepaymentResult">Effective prepayment: {{money(prepaymentResult.effectivePrepaymentPaise)}} · Remaining principal: {{money(prepaymentResult.remainingPrincipalPaise)}} · {{prepaymentResult.status}}</p>
</div>
</article>
</div>
<p v-else class="kfe-boundary-note">No authoritative loan status is currently available.</p>
</section>
</template>
<script setup>
import {computed,ref} from 'vue'
const props=defineProps({loanModel:{default:null},money:{type:Function,required:true},application:{default:null}})
const loanItems=computed(()=>{const v=props.loanModel;return Array.isArray(v)?v:(v?.loans||v?.items||v?.records||[])})
const primaryLoan=computed(()=>props.loanModel?.loan||loanItems.value[0]||null)
const amortization=computed(()=>props.loanModel?.amortization||[])
const prepayment=ref(0),prepaymentResult=ref(null)
function calculatePrepayment(){
 const loan=primaryLoan.value
 if(!loan||!props.application?.commands?.applyPrepayment)return
 const balance=Number(loan.remaining_balance_paise??loan.remainingBalancePaise??0)
 const requested=Number(prepayment.value||0)
 if(!Number.isInteger(balance)||balance<0||!Number.isInteger(requested)||requested<0){prepaymentResult.value=null;return}
 prepaymentResult.value=props.application.commands.applyPrepayment(balance,requested)
}
</script>
