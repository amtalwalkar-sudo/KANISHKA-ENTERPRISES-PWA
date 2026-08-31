<script setup>
import { computed, ref } from 'vue';
import { application } from '../../js/app.js';
import KfeFormShell from './KfeFormShell.vue';
import KfeFormField from './KfeFormField.vue';

const emit = defineEmits(['back']);
const mode = ref('day');
const saving = ref(false);
const notice = ref('');
const error = ref('');

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
function todayIso(){return new Date().toISOString().slice(0,10);}

async function saveDay(value){
  resetMessages();
  const date=value.date || todayIso();
  const start=number(value.start_odometer);
  const end=number(value.end_odometer);
  const revenue=number(value.revenue);
  if(!date || !Number.isFinite(start) || start < 0 || !Number.isFinite(end) || end < start || !Number.isFinite(revenue) || revenue < 0){error.value='Enter a valid historical day, odometers and revenue.';return;}
  saving.value=true;
  try{
    await application.recordHistoricalDay({date,start_odometer:start,end_odometer:end,revenue_paise:Math.round(revenue*100)});
    day.value={date:'',start_odometer:'',end_odometer:'',revenue:''};
    notice.value='Historical day saved safely.';
  }catch(e){error.value=String(e?.message||e);}
  finally{saving.value=false;}
}

async function saveFuel(value){
  resetMessages();
  const date=value.date || todayIso();
  const odometer=number(value.odometer);
  const amount=number(value.amount);
  const cost=number(value.cost_per_kg);
  if(!date || !Number.isFinite(odometer) || odometer < 0 || !Number.isFinite(amount) || amount <= 0 || !Number.isFinite(cost) || cost <= 0){error.value='Enter a valid historical fuel date, odometer, amount and cost per kg.';return;}
  saving.value=true;
  try{
    await application.recordHistoricalFuel({date,odometer,amount_paise:Math.round(amount*100),price_per_kg:cost});
    fuel.value={date:'',odometer:'',amount:'',cost_per_kg:''};
    notice.value='Historical fuel entry saved safely.';
  }catch(e){error.value=String(e?.message||e);}
  finally{saving.value=false;}
}
</script>

<template>
  <section class="kfe-module-view" data-module="Historical Entries" aria-labelledby="historical-entries-title">
    <div class="kfe-module-heading">
      <button class="kfe-secondary-action kfe-back-action" type="button" @click="emit('back')">‹ More</button>
      <p class="kfe-eyebrow">Data setup</p>
      <h1 id="historical-entries-title">Historical Entries</h1>
      <p class="kfe-destination-subtitle">Enter pre-launch records without touching the live Work screen.</p>
    </div>

    <div class="kfe-segmented" aria-label="Historical entry type">
      <button type="button" :class="{'is-active':mode==='day'}" @click="mode='day';resetMessages()">Historical Day</button>
      <button type="button" :class="{'is-active':mode==='fuel'}" @click="mode='fuel';resetMessages()">Historical Fuel</button>
    </div>

    <p v-if="notice" class="kfe-form-boundary-note" role="status">✓ {{ notice }}</p>
    <p v-if="error" class="kfe-form-boundary-note" role="alert">{{ error }}</p>

    <KfeFormShell v-if="mode==='day'" draft-key="historical-day" title="Historical Day" subtitle="Pre-launch daily operational summary." :saving="saving" @save="saveDay">
      <template #default="{ value }">
        <KfeFormField id="date" label="Date" type="date" required v-model="value.date" />
        <KfeFormField id="start_odometer" label="Start-day odometer" type="number" required v-model="value.start_odometer" />
        <KfeFormField id="end_odometer" label="End-day odometer" type="number" required v-model="value.end_odometer" />
        <KfeFormField id="revenue" label="Revenue" type="number" required placeholder="0.00" v-model="value.revenue" />
        <p class="kfe-form-boundary-note">Stored as a completed historical work session plus its business revenue record. It does not open or close a live shift.</p>
      </template>
    </KfeFormShell>

    <KfeFormShell v-else draft-key="historical-fuel" title="Historical Fuel" subtitle="Pre-launch CNG fuel entry." :saving="saving" @save="saveFuel">
      <template #default="{ value }">
        <KfeFormField id="date" label="Date" type="date" required v-model="value.date" />
        <KfeFormField id="odometer" label="Odometer" type="number" required v-model="value.odometer" />
        <KfeFormField id="amount" label="Amount paid" type="number" required placeholder="0.00" v-model="value.amount" />
        <KfeFormField id="cost_per_kg" label="Cost per kg" type="number" required placeholder="0.00" v-model="value.cost_per_kg" />
        <p v-if="quantityKg!==null" class="kfe-form-boundary-note">Calculated CNG: {{ quantityKg.toFixed(3) }} kg</p>
        <p class="kfe-form-boundary-note">Marked as historical/manual fuel data; the live Work fuel workflow remains unchanged.</p>
      </template>
    </KfeFormShell>
  </section>
</template>
