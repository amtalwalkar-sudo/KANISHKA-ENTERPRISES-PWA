<script setup>
import {computed,onMounted,onUnmounted,ref} from 'vue';
import {application} from '../../js/app.js';
import KfeSwipeBar from './KfeSwipeBar.vue';

const open=ref(false),busy=ref(false),error=ref(''),confirming=ref(false),editing=ref(false),otherFormOpen=ref(false);
const odometer=ref(''),price=ref(''),amount=ref('');
const lastFuel=ref(null),location=ref(null),locationPending=ref(false);
let observer=null,locationTimer=null;

const canSave=computed(()=>Number.isInteger(Number(odometer.value))&&Number(odometer.value)>=0&&Number(price.value)>0&&Number(amount.value)>0&&!busy.value);
function syncOtherForm(){otherFormOpen.value=Boolean(document.querySelector('.work-form-overlay'));}
function clearForm(){odometer.value='';price.value='';amount.value='';error.value='';confirming.value=false;editing.value=false;location.value=null;locationPending.value=false;}
async function loadLast(){try{const rows=await application.listFuel();lastFuel.value=rows.filter(r=>!r.is_deleted).sort((a,b)=>Date.parse(b.recorded_at||b.created_at||0)-Date.parse(a.recorded_at||a.created_at||0))[0]||null;}catch{lastFuel.value=null;}}
function startLocationCapture(){
  if(!navigator.geolocation)return;
  locationPending.value=true;
  const finish=()=>{locationPending.value=false;clearTimeout(locationTimer);};
  locationTimer=setTimeout(finish,5000);
  navigator.geolocation.getCurrentPosition(async position=>{
    const latitude=position.coords.latitude,longitude=position.coords.longitude;
    const fallback={coordinates:`${latitude}, ${longitude}`,latitude,longitude};
    location.value=fallback;
    try{
      const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),3000);
      const response=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`,{headers:{Accept:'application/json'},signal:controller.signal});
      clearTimeout(timeout);
      if(response.ok){const data=await response.json();if(data?.display_name)location.value={...fallback,name:data.display_name};}
    }catch{}
    finish();
  },()=>finish(),{enableHighAccuracy:true,timeout:4500,maximumAge:300000});
}
async function openFuel(){syncOtherForm();if(otherFormOpen.value)return;clearForm();open.value=true;await loadLast();startLocationCapture();}
function closeFuel(){if(busy.value)return;open.value=false;clearForm();}
function validate(){
  const o=Number(odometer.value),p=Number(price.value),a=Number(amount.value);
  if(!Number.isInteger(o)||o<0){error.value='Enter the fuel odometer.';return false;}
  if(!Number.isFinite(p)||p<=0){error.value='Enter the fuel price per litre/kg.';return false;}
  if(!Number.isFinite(a)||a<=0){error.value='Enter the fuel amount.';return false;}
  return true;
}
async function authoritativeOdometer(){try{const latest=await application.latestWorkOdometer();return latest?.odometer??null;}catch{return null;}}
async function requestSave(){
  if(!validate())return;
  const current=Number(odometer.value),authoritative=await authoritativeOdometer();
  if(authoritative!=null&&Number.isFinite(Number(authoritative))&&current<Number(authoritative)){error.value='Fuel odometer cannot be below the authoritative odometer.';return;}
  confirming.value=true;
}
async function saveNew(){
  if(!validate())return;
  busy.value=true;error.value='';
  try{
    const now=new Date().toISOString(),amountPaise=Math.round(Number(amount.value)*100),pricePerUnit=Number(price.value),quantity=Number(amount.value)/pricePerUnit;
    const record=await application.recordFuel({odometer:Number(odometer.value),amount_paise:amountPaise,price_per_unit:pricePerUnit,price_per_kg:pricePerUnit,quantity,quantity_kg:quantity,fuel_unit:'kg_or_litre',recorded_at:now,location_name:location.value?.name||null,location_coordinates:location.value?.coordinates||null,latitude:location.value?.latitude??null,longitude:location.value?.longitude??null});
    lastFuel.value=record;open.value=false;clearForm();window.dispatchEvent(new CustomEvent('kfe:fuel-saved',{detail:{id:record.id}}));
  }catch(e){error.value=String(e?.message||e);confirming.value=false;}finally{busy.value=false;}
}
function beginEdit(){if(!lastFuel.value)return;editing.value=true;confirming.value=false;error.value='';odometer.value=String(lastFuel.value.odometer??'');price.value=String(lastFuel.value.price_per_unit??lastFuel.value.price_per_kg??'');amount.value=(Number(lastFuel.value.amount_paise||0)/100).toFixed(2);startLocationCapture();}
async function saveEdit(){
  if(!validate()||!lastFuel.value)return;
  const current=Number(odometer.value),authoritative=await authoritativeOdometer();
  if(authoritative!=null&&Number.isFinite(Number(authoritative))&&current<Number(authoritative)){error.value='Fuel odometer cannot be below the authoritative odometer.';return;}
  busy.value=true;error.value='';
  try{
    const pricePerUnit=Number(price.value),quantity=Number(amount.value)/pricePerUnit,id=lastFuel.value.id;
    await application.updateFuel(id,{odometer:current,amount_paise:Math.round(Number(amount.value)*100),price_per_unit:pricePerUnit,price_per_kg:pricePerUnit,quantity,quantity_kg:quantity});
    await loadLast();open.value=false;clearForm();window.dispatchEvent(new CustomEvent('kfe:fuel-saved',{detail:{id}}));
  }catch(e){error.value=String(e?.message||e);confirming.value=false;}finally{busy.value=false;}
}
onMounted(()=>{observer=new MutationObserver(syncOtherForm);observer.observe(document.body,{subtree:true,childList:true});syncOtherForm();});
onUnmounted(()=>{observer?.disconnect();clearTimeout(locationTimer);});
</script>
<template>
  <button v-if="!open && !otherFormOpen" class="fuel-quick-tab" type="button" aria-label="Quick fuel" @click="openFuel">⛽ FUEL</button>
  <div v-if="open" class="fuel-form-overlay" role="dialog" aria-modal="true" aria-labelledby="fuel-title">
    <div class="fuel-form-card">
      <p class="kfe-eyebrow">⛽ REFUEL</p><h2 id="fuel-title">{{ editing?'Edit Last Fuel Entry':'Quick Fuel' }}</h2>
      <div v-if="error" class="fuel-error" role="alert">{{ error }}</div>
      <label>Odometer *<input v-model="odometer" inputmode="numeric" type="number" min="0" step="1" autofocus /></label>
      <label>Fuel price per litre/kg *<input v-model="price" inputmode="decimal" type="number" min="0" step="0.01" /></label>
      <label>Amount *<input v-model="amount" inputmode="decimal" type="number" min="0" step="0.01" /></label>
      <div class="fuel-auto"><span>Date &amp; time: automatic</span></div>
      <section v-if="lastFuel && !editing" class="fuel-last-entry"><h3>LAST FUEL ENTRY</h3><p>Odometer: {{ lastFuel.odometer }}</p><p>Price: ₹ {{ Number(lastFuel.price_per_unit??lastFuel.price_per_kg??0).toFixed(2) }}</p><p>Amount: ₹ {{ (Number(lastFuel.amount_paise||0)/100).toFixed(2) }}</p><button type="button" class="secondary-action" :disabled="busy" @click="beginEdit">Edit</button></section>
      <div v-if="confirming" class="fuel-confirm"><p>Confirm this fuel entry?</p><button class="primary-action" type="button" :disabled="busy" @click="editing?saveEdit():saveNew()">Confirm</button><button class="secondary-action" type="button" :disabled="busy" @click="confirming=false">Cancel</button></div>
      <button v-else class="secondary-action" type="button" :disabled="busy" @click="closeFuel">Cancel</button>
    </div>
    <KfeSwipeBar v-if="!confirming" right-label="CONFIRM FUEL" right-action="CONFIRM_FUEL" :disabled="!canSave||busy" @swipe="requestSave" />
  </div>
</template>
<style scoped>
.fuel-quick-tab{position:fixed;right:16px;bottom:calc(var(--kfe-bottom-nav-height) + var(--kfe-safe-bottom) + 92px);z-index:70;min-height:48px;padding:0 14px;border:2px solid var(--kfe-shell-border);border-radius:14px;background:var(--kfe-shell-surface);color:var(--kfe-shell-text);font-weight:850;box-shadow:0 4px 14px rgba(0,0,0,.18)}
.fuel-form-overlay{position:fixed;inset:0;z-index:100;background:color-mix(in srgb,var(--kfe-shell-bg) 96%,transparent);display:flex;align-items:flex-start;justify-content:center;padding:calc(var(--kfe-topbar-height) + var(--kfe-safe-top) + 10px) 10px calc(var(--kfe-bottom-nav-height) + var(--kfe-safe-bottom) + 96px);overflow:auto}
.fuel-form-card{width:min(620px,100%);display:grid;gap:13px;padding:20px;border:1px solid var(--kfe-shell-border);border-radius:18px;background:var(--kfe-shell-surface);box-shadow:0 12px 36px rgba(0,0,0,.25)}
.fuel-form-card h2{margin:0}.fuel-form-card label{display:grid;gap:6px;font-weight:700}.fuel-form-card input{width:100%;min-height:50px;padding:11px 13px;border:1px solid var(--kfe-shell-border);border-radius:12px;background:var(--kfe-shell-bg);color:var(--kfe-shell-text);font-size:16px;box-sizing:border-box}.fuel-auto,.fuel-last-entry{display:grid;gap:5px;padding:14px;border:1px solid var(--kfe-shell-border);border-radius:15px;background:var(--kfe-shell-bg);color:var(--kfe-shell-muted)}.fuel-last-entry h3{margin:0;color:var(--kfe-shell-text)}.fuel-last-entry p{margin:0}.fuel-error{padding:10px 12px;border:1px solid var(--kfe-shell-border);border-radius:12px;font-weight:700}.fuel-confirm{display:grid;gap:10px}
</style>