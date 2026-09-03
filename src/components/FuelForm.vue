<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { application } from '../../js/app.js';
import { clearFormDraft, hasFormDraft } from '../../js/ui/form-drafts.js';

const props=defineProps({mode:{type:String,default:'CREATE'},record:{type:Object,default:null},authoritativeOdometer:{type:[Number,String],default:null}});
const emit=defineEmits(['close','saved']);
const formRef=ref(null),busy=ref(false),error=ref(''),success=ref(''),gpsStatus=ref('Waiting for location…'),lastPosition=ref(null);
const draft=ref({odometer:'',pricePerKg:'',amount:'',recordedAt:new Date().toISOString(),locationName:'',locationArea:null});
let watchId=null,reverseTimer=null;
const isEdit=computed(()=>props.mode==='EDIT');
const title=computed(()=>isEdit.value?'Correct Fuel':'Quick Fuel');
const quantityKg=computed(()=>{const a=Number(draft.value.amount),p=Number(draft.value.pricePerKg);return Number.isFinite(a)&&a>0&&Number.isFinite(p)&&p>0?a/p:null;});
const timestampLabel=computed(()=>{const d=new Date(draft.value.recordedAt);return Number.isFinite(d.getTime())?d.toLocaleString():'Time unavailable';});
const locationLabel=computed(()=>draft.value.locationName||'Location unavailable');
const authoritative=computed(()=>props.authoritativeOdometer==null||props.authoritativeOdometer===''?null:Number(props.authoritativeOdometer));
const draftKey=computed(()=>isEdit.value?`fuel:edit:${props.record?.entityId||props.record?.id||'unknown'}`:'fuel:create');
function localIso(){return new Date().toISOString();}
function fromRecord(){const r=props.record||{};if(isEdit.value){draft.value={odometer:r.odometer??'',pricePerKg:r.pricePerKg??r.price_per_kg??'',amount:r.amount??(r.amount_paise!=null?Number(r.amount_paise)/100:''),recordedAt:r.occurredAt||r.recorded_at||r.date||localIso(),locationName:r.locationName??r.location_name??'',locationArea:r.locationArea??r.location_area??null};}else{draft.value={odometer:'',pricePerKg:'',amount:'',recordedAt:localIso(),locationName:'',locationArea:null};}}
function reverseGeocode(position){clearTimeout(reverseTimer);reverseTimer=setTimeout(async()=>{const {latitude,longitude}=position.coords;try{const response=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`,{headers:{Accept:'application/json'}});if(!response.ok)throw new Error();const data=await response.json();const a=data.address||{};const name=data.display_name||[a.suburb,a.city_district,a.city,a.town,a.village].filter(Boolean).join(', ')||null;draft.value.locationName=name||'';const s=String(name||'').toLowerCase();draft.value.locationArea=s.includes('mumbai')?'MUMBAI':name?'OUTSIDE':'UNKNOWN';gpsStatus.value=name?`Location captured · ${name}`:`Location captured · ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;}catch{gpsStatus.value=`Location captured · ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;}},100);}
function onPosition(position){lastPosition.value=position;gpsStatus.value='Location captured';reverseGeocode(position);}
function startLocation(){if(!navigator.geolocation){gpsStatus.value='Location unavailable on this device/browser';return;}gpsStatus.value='Requesting location…';watchId=navigator.geolocation.watchPosition(onPosition,()=>{gpsStatus.value='Location permission unavailable';},{enableHighAccuracy:true,maximumAge:30000,timeout:10000});navigator.geolocation.getCurrentPosition(onPosition,()=>{},{enableHighAccuracy:true,maximumAge:0,timeout:10000});}
function stopLocation(){if(watchId!==null&&navigator.geolocation)navigator.geolocation.clearWatch(watchId);watchId=null;clearTimeout(reverseTimer);}
function validate(){const o=Number(draft.value.odometer),p=Number(draft.value.pricePerKg),a=Number(draft.value.amount);if(!Number.isInteger(o)||o<0)return 'Enter a valid odometer.';if(!isEdit.value&&authoritative.value!=null&&o<authoritative.value)return 'Fuel odometer cannot be below the current authoritative odometer.';if(!Number.isFinite(p)||p<=0)return 'Enter a valid price per litre/kg.';if(!Number.isFinite(a)||a<=0)return 'Enter a valid amount.';return '';}
async function save(){if(busy.value)return;error.value='';const v=validate();if(v){error.value=v;return;}busy.value=true;try{let result;if(isEdit.value){result=await application.saveHistoricalCorrection({entityType:'Fuel',entityId:props.record?.entityId||props.record?.id},{recordedAt:new Date(draft.value.recordedAt).toISOString(),odometer:Number(draft.value.odometer),pricePerKg:Number(draft.value.pricePerKg),amount:Number(draft.value.amount),locationName:draft.value.locationName||null,locationArea:draft.value.locationArea||null});success.value='Fuel record updated successfully.';}else{const p=lastPosition.value;const recordedAt=new Date(draft.value.recordedAt).toISOString();result=await application.recordFuel({odometer:Number(draft.value.odometer),price_per_kg:Number(draft.value.pricePerKg),amount_paise:Math.round(Number(draft.value.amount)*100),recorded_at:recordedAt,date:recordedAt.slice(0,10),scope:'BUSINESS',entry_source:'FUEL',latitude:p?.coords?.latitude??null,longitude:p?.coords?.longitude??null,location_name:draft.value.locationName||null,location_area:draft.value.locationArea||null});success.value='Fuel record saved successfully.';}clearFormDraft(formRef.value);emit('saved',result);setTimeout(()=>emit('close'),900);}catch(e){error.value=String(e?.message||e);}finally{busy.value=false;}}
function cancel(){if(busy.value)return;if(formRef.value&&hasFormDraft(formRef.value)){const ok=globalThis.confirm?.('Discard this unsaved draft?');if(ok===false)return;}clearFormDraft(formRef.value);emit('close');}
function onKey(event){if(event.key==='Escape')cancel();}
fromRecord();
onMounted(()=>{window.addEventListener('keydown',onKey);startLocation();});
onUnmounted(()=>{window.removeEventListener('keydown',onKey);stopLocation();});
</script>
<template>
  <div class="fuel-form-overlay" role="dialog" aria-modal="true" :aria-label="title">
    <form ref="formRef" class="fuel-form-card" data-kfe-draft-form="true" :data-kfe-draft-key="draftKey" @submit.prevent="save">
      <header class="fuel-form-header"><div><p class="fuel-eyebrow">KFE 2.0 · FUEL</p><h2>{{title}}</h2></div><button type="button" class="kfe-qf-close" :disabled="busy" aria-label="Close" @click="cancel">×</button></header>
      <p class="fuel-form-help">Date/time and optional location are captured automatically in the background.</p>
      <label>Odometer *<input v-model="draft.odometer" inputmode="numeric" type="number" min="0" step="1" required></label>
      <label>Fuel price per litre/kg *<input v-model="draft.pricePerKg" inputmode="decimal" type="number" min="0" step="0.01" required></label>
      <label>Amount *<input v-model="draft.amount" inputmode="decimal" type="number" min="0" step="0.01" required></label>
      <div class="fuel-calculated"><span>Refuelled kg</span><strong>{{quantityKg==null?'—':quantityKg.toFixed(3)+' kg'}}</strong></div>
      <div class="fuel-meta"><span>🕒 {{timestampLabel}}</span><span>📍 {{locationLabel}}</span><small>{{gpsStatus}}</small></div>
      <p v-if="error" class="kfe-qf-error" role="alert">{{error}}</p><p v-if="success" class="kfe-qf-success" role="status">✓ {{success}}</p>
      <div class="fuel-actions"><button type="button" class="secondary-action" :disabled="busy" @click="cancel">Cancel</button><div class="kfe-qf-swipe-track" role="button" tabindex="0" :aria-disabled="busy||!!success" aria-label="Save Quick Fuel" @click="save" @keydown.enter.prevent="save"><span>{{busy?'Saving…':isEdit?'Save correction':'Save Fuel →'}}</span></div></div>
    </form>
  </div>
</template>
<style scoped>
.fuel-form-overlay{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:1rem;background:rgba(0,0,0,.5)}.fuel-form-card{width:min(34rem,100%);max-height:92vh;overflow:auto;box-sizing:border-box;padding:1.2rem;border-radius:18px;background:#fff;color:#111;box-shadow:0 20px 60px rgba(0,0,0,.25)}.fuel-form-header{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem}.fuel-form-header h2{margin:.2rem 0 1rem}.fuel-eyebrow{margin:0;font-size:.75rem;font-weight:800;letter-spacing:.08em}.kfe-qf-close{border:0;background:transparent;font-size:1.8rem;line-height:1;cursor:pointer}.fuel-form-help{font-size:.86rem;opacity:.75}.fuel-form-card label{display:grid;gap:.35rem;margin:.8rem 0;font-weight:700}.fuel-form-card input{width:100%;box-sizing:border-box;padding:.78rem;border:1px solid #c7cbd1;border-radius:10px;background:#fff;color:#111}.fuel-calculated,.fuel-meta{display:flex;justify-content:space-between;gap:.75rem;align-items:center;padding:.8rem 0;border-top:1px solid #e3e5e8}.fuel-meta{flex-wrap:wrap;font-size:.8rem}.fuel-meta small{width:100%;opacity:.72}.kfe-qf-error{padding:.7rem;border-radius:10px;background:#ffe9e9;color:#8a1f1f}.kfe-qf-success{padding:.8rem;border-radius:10px;background:#e9f8ed;color:#176b32;font-weight:800}.fuel-actions{display:flex;align-items:center;justify-content:flex-end;gap:.7rem;margin-top:1rem}.secondary-action{padding:.72rem 1rem;border-radius:10px;border:1px solid #bbb;background:#fff}.kfe-qf-swipe-track{min-width:11rem;padding:.8rem 1rem;border-radius:999px;border:1px solid #222;background:#222;color:#fff;font-weight:800;text-align:center;cursor:pointer;user-select:none}.kfe-qf-swipe-track[aria-disabled="true"]{opacity:.55;cursor:wait}
</style>
