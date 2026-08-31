<script setup>
import { computed, ref } from 'vue';
import KfeFormShell from './KfeFormShell.vue';
import KfeFormField from './KfeFormField.vue';

const emit = defineEmits(['back','save-request']);
const mode = ref('day');
const saving = ref(false);
const notice = ref('');
const error = ref('');
const formVersion = ref(0);
const day = ref({date:'',start_odometer:'',end_odometer:'',revenue:''});
const fuel = ref({date:'',odometer:'',amount:'',cost_per_kg:''});

const quantityKg = computed(() => {
  const amount = Number(fuel.value.amount);
  const price = Number(fuel.value.cost_per_kg);
  if (!Number.isFinite(amount) || !Number.isFinite(price) || price <= 0) return null;
  return amount / price;
});

function number(value){return Number(value);}
function resetMessages(){notice.value='';error.value='';}
function finishSave(ok,message){
  saving.value=false;
  if(ok){
    formVersion.value+=1;
    notice.value=message;
    error.value='';
  }else{
    error.value=message;
    notice.value='';
  }
}
function saveDay(value){
  resetMessages();
  const date=value.date;
  const start=number(value.start_odometer);
  const end=number(value.end_odometer);
  const revenue=number(value.revenue);
  if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(start)||start<0||!Number.isFinite(end)||end<start||!Number.isFinite(revenue)||revenue<0){error.value='Enter a valid historical date, start/end odometer and revenue.';return;}
  saving.value=true;
  emit('save-request',{kind:'HISTORICAL_DAY',value:{date,start_odometer:start,end_odometer:end,revenue_paise:Math.round(revenue*100)},done:(ok,message)=>finishSave(ok,message)});
}
function saveFuel(value){
  resetMessages();
  const date=value.date;
  const odometer=number(value.odometer);
  const amount=number(value.amount);
  const cost=number(value.cost_per_kg);
  if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(odometer)||odometer<0||!Number.isFinite(amount)||amount<=0||!Number.isFinite(cost)||cost<=0){error.value='Enter a valid historical fuel date, odometer, amount and cost per kg.';return;}
  saving.value=true;
  emit('save-request',{kind:'HISTORICAL_FUEL',value:{date,odometer,amount_paise:Math.round(amount*100),price_per_kg:cost},done:(ok,message)=>finishSave(ok,message)});
}
</script>

<template>
<section class="kfe-module-view" data-module="Historical Entries" aria-labelledby="historical-entries-title">
  <div class="kfe-module-heading">
    <button class="kfe-secondary-action kfe-back-action" type="button" :disabled="saving" @click="emit('back')">‹ More</button>
    <p class="kfe-eyebrow">Data setup</p>
    <h1 id="historical-entries-title">Historical Entries</h1>
    <p class="kfe-destination-subtitle">Add pre-launch records without touching the live Work screen.</p>
  </div>
  <div class="kfe-segmented" aria-label="Historical entry type">
    <button type="button" :class="{'is-active':mode==='day'}" :disabled="saving" @click="mode='day';resetMessages()">Historical Day</button>
    <button type="button" :class="{'is-active':mode==='fuel'}" :disabled="saving" @click="mode='fuel';resetMessages()">Historical Fuel</button>
  </div>
  <p v-if="notice" class="kfe-form-boundary-note" role="status">✓ {{notice}}</p>
  <p v-if="error" class="kfe-form-boundary-note" role="alert">{{error}}</p>
  <KfeFormShell v-if="mode==='day'" :key="`historical-day-${formVersion}`" draft-key="historical-day" title="Historical Day" subtitle="Pre-launch daily operational summary." :saving="saving" @save="saveDay">
    <template #default="{value}">
      <KfeFormField id="date" label="Date" type="date" required v-model="value.date" />
      <KfeFormField id="start_odometer" label="Start-day odometer" type="number" required v-model="value.start_odometer" />
      <KfeFormField id="end_odometer" label="End-day odometer" type="number" required v-model="value.end_odometer" />
      <KfeFormField id="revenue" label="Revenue" type="number" required placeholder="0.00" v-model="value.revenue" />
      <p class="kfe-form-boundary-note">Stored as a completed historical business work session and revenue record. It cannot open or close a live shift.</p>
    </template>
  </KfeFormShell>
  <KfeFormShell v-else :key="`historical-fuel-${formVersion}`" draft-key="historical-fuel" title="Historical Fuel" subtitle="Pre-launch CNG fuel entry." :saving="saving" @save="saveFuel">
    <template #default="{value}">
      <KfeFormField id="date" label="Date" type="date" required v-model="value.date" />
      <KfeFormField id="odometer" label="Odometer" type="number" required v-model="value.odometer" />
      <KfeFormField id="amount" label="Amount paid" type="number" required placeholder="0.00" v-model="value.amount" />
      <KfeFormField id="cost_per_kg" label="Cost per kg" type="number" required placeholder="0.00" v-model="value.cost_per_kg" />
      <p v-if="quantityKg!==null" class="kfe-form-boundary-note">Calculated CNG: {{quantityKg.toFixed(3)}} kg</p>
      <p class="kfe-form-boundary-note">Marked historical/manual. The live Work fuel workflow is unchanged.</p>
    </template>
  </KfeFormShell>
</section>
</template>
