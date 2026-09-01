<script setup>
import {computed,onMounted,onUnmounted,ref} from 'vue';
import {application,actions} from '../../js/app.js';
import {createUiCommand} from '../../js/application/ui-contract.js';
import KfeSwipeBar from './KfeSwipeBar.vue';
import './work-session.css';
const loading=ref(true),busy=ref(false),error=ref(''),notice=ref(''),lastAction=ref(null),now=ref(Date.now());
const model=ref(null),summary=ref(null),form=ref(null),endDayConfirm=ref(false);
const dayStartOdometer=ref(''),dayBusinessKm=ref(''),dayPersonalKm=ref('');
const personalStartOdometer=ref(''),personalBusinessKm=ref(''),personalPersonalKm=ref('');
const personalEndOdometer=ref(''),personalToll=ref(''),personalParking=ref('');
const shiftEndOdometer=ref(''),shiftRevenue=ref(''),shiftToll=ref(''),shiftParking=ref(''),shiftTollIncluded=ref(false),shiftParkingIncluded=ref(false);
let timer;
const screenState=computed(()=>model.value?.state||'DAY_START');
const latestOdometer=computed(()=>model.value?.latestOdometer);
const dayStatus=computed(()=>model.value?.day?.status||'NOT_STARTED');
const activeShift=computed(()=>model.value?.shift?.active?model.value.shift:null);
const activeTrip=computed(()=>model.value?.trip?.active?model.value.trip:null);
const shiftElapsed=computed(()=>activeShift.value?.startedAt?Math.max(0,Math.floor((now.value-Date.parse(activeShift.value.startedAt))/1000)):0);
const tripElapsed=computed(()=>activeTrip.value?.startedAt?Math.max(0,Math.floor((now.value-Date.parse(activeTrip.value.startedAt))/1000)):0);
const shiftTripCount=computed(()=>activeShift.value?.tripCount||0);
const shiftEndValid=computed(()=>{const n=Number(shiftEndOdometer.value);return Number.isInteger(n)&&n>=0&&(!activeShift.value?.startOdometer||n>=Number(activeShift.value.startOdometer));});
const personalEndValid=computed(()=>{const n=Number(personalEndOdometer.value);return Number.isInteger(n)&&n>=0&&(!activeTrip.value?.startOdometer||n>=Number(activeTrip.value.startOdometer));});
const shiftRevenueValid=computed(()=>String(shiftRevenue.value).trim()!==''&&Number.isFinite(Number(shiftRevenue.value))&&Number(shiftRevenue.value)>=0);
const canStartDay=computed(()=>screenState.value==='DAY_START'&&dayStatus.value!=='COMPLETED');
const canEndDay=computed(()=>screenState.value==='DAY_READY'&&!activeShift.value&&!activeTrip.value&&dayStatus.value!=='COMPLETED');
function duration(s){s=Math.max(0,Number(s)||0);return [Math.floor(s/3600),Math.floor(s/60)%60,Math.floor(s)%60].map(v=>String(v).padStart(2,'0')).join(':');}
function differenceFor(current,previous){const value=Number(current),prior=previous==null?null:Number(previous);if(!Number.isInteger(value)||value<0)return {valid:false,difference:0,required:false};if(prior==null)return {valid:true,difference:0,required:false};if(value<prior)return {valid:false,difference:prior-value,required:false};return {valid:true,difference:value-prior,required:value!==prior};}
function allocationValid(diff,business,personal){if(!diff.valid)return false;if(!diff.required)return true;const b=Number(business),p=Number(personal);return Number.isInteger(b)&&Number.isInteger(p)&&b>=0&&p>=0&&b+p===diff.difference;}
const dayDiff=computed(()=>differenceFor(dayStartOdometer.value,latestOdometer.value));
const personalDiff=computed(()=>differenceFor(personalStartOdometer.value,latestOdometer.value));
const dayAllocationValid=computed(()=>allocationValid(dayDiff.value,dayBusinessKm.value,dayPersonalKm.value));
const personalAllocationValid=computed(()=>allocationValid(personalDiff.value,personalBusinessKm.value,personalPersonalKm.value));
function openForm(kind){error.value='';form.value=kind;if(kind==='DAY_START')dayStartOdometer.value=latestOdometer.value==null?'':String(latestOdometer.value);if(kind==='PERSONAL_START')personalStartOdometer.value=latestOdometer.value==null?'':String(latestOdometer.value);if(kind==='PERSONAL_END')personalEndOdometer.value='';if(kind==='SHIFT_END'){shiftEndOdometer.value='';shiftRevenue.value='';shiftToll.value='';shiftParking.value='';shiftTollIncluded.value=false;shiftParkingIncluded.value=false;window.__KFE_SHIFT_REVENUE_PAISE=null;}}
function closeForm(){if(!busy.value){form.value=null;error.value='';}}
async function load(){loading.value=true;try{model.value=await application.getWorkScreenState();summary.value=await application.workSummary();}catch(e){error.value=String(e?.message||e);}finally{loading.value=false;}}
async function dispatch(type,payload){if(busy.value)return null;busy.value=true;error.value='';try{const r=await actions.dispatch(createUiCommand(type,payload));form.value=null;endDayConfirm.value=false;await load();return r;}catch(e){error.value=String(e?.message||e);return null;}finally{busy.value=false;}}
async function confirmDayStart(){const n=Number(dayStartOdometer.value);if(!Number.isInteger(n)||n<0)return error.value='Enter the day-start odometer.';if(!dayDiff.value.valid)return error.value='Odometer cannot decrease.';if(!dayAllocationValid.value)return error.value=`Allocate exactly ${dayDiff.value.difference} km between business and personal.`;const r=await dispatch('START_DAY',{odometer:n,prefilledOdometer:latestOdometer.value,businessKm:dayDiff.value.required?Number(dayBusinessKm.value):0,personalKm:dayDiff.value.required?Number(dayPersonalKm.value):0,actionMode:'SWIPE',direction:'RIGHT'});if(r)notice.value='Day started safely';}
async function confirmPersonalStart(){const n=Number(personalStartOdometer.value);if(!Number.isInteger(n)||n<0)return error.value='Enter the personal-trip start odometer.';if(!personalDiff.value.valid)return error.value='Odometer cannot decrease.';if(!personalAllocationValid.value)return error.value=`Allocate exactly ${personalDiff.value.difference} km between business and personal.`;const r=await dispatch('START_PERSONAL_TRIP',{odometer:n,prefilledOdometer:latestOdometer.value,businessKm:personalDiff.value.required?Number(personalBusinessKm.value):0,personalKm:personalDiff.value.required?Number(personalPersonalKm.value):0,actionMode:'SWIPE',direction:'LEFT'});if(r)notice.value='Personal trip started safely';}
async function startShift(){const r=await dispatch('START_SHIFT',{actionMode:'SWIPE',direction:'RIGHT'});if(r)notice.value='Shift started safely';}
async function startBusinessTrip(){const r=await dispatch('START_TRIP',{actionMode:'SWIPE',direction:'RIGHT'});if(r)notice.value='Business trip started safely';}
async function endBusinessTrip(){const r=await dispatch('END_TRIP',{id:activeTrip.value?.id,actionMode:'SWIPE',direction:'RIGHT'});if(r)notice.value='Business trip saved safely';}
async function confirmPersonalEnd(){const n=Number(personalEndOdometer.value);if(!Number.isInteger(n)||n<0)return error.value='End odometer is compulsory.';if(!personalEndValid.value)return error.value='End odometer cannot be below the trip start odometer.';const r=await dispatch('END_PERSONAL_TRIP',{id:activeTrip.value?.id,endOdometer:n,tollPaise:Math.round(Math.max(0,Number(personalToll.value)||0)*100),parkingPaise:Math.round(Math.max(0,Number(personalParking.value)||0)*100),actionMode:'SWIPE',direction:'RIGHT'});if(r)notice.value='Personal trip saved safely';}
async function confirmShiftEnd(){if(!shiftRevenueValid.value)return error.value='Revenue is compulsory to close the business shift.';const n=Number(shiftEndOdometer.value);if(!Number.isInteger(n)||n<0)return error.value='End odometer is compulsory.';if(!shiftEndValid.value)return error.value='End odometer cannot be below the shift start odometer.';window.__KFE_SHIFT_REVENUE_PAISE=Math.round(Number(shiftRevenue.value)*100);const r=await dispatch('END_SHIFT',{id:activeShift.value?.id,endOdometer:n,revenuePaise:window.__KFE_SHIFT_REVENUE_PAISE,tollPaise:Math.round(Math.max(0,Number(shiftToll.value)||0)*100),parkingPaise:Math.round(Math.max(0,Number(shiftParking.value)||0)*100),tollIncludedInFare:shiftTollIncluded.value,parkingIncludedInFare:shiftParkingIncluded.value,actionMode:'SWIPE',direction:'LEFT'});if(!r)window.__KFE_SHIFT_REVENUE_PAISE=null;else notice.value='Shift closed safely';}
async function confirmEndDay(){if(!canEndDay.value)return;const r=await dispatch('END_DAY',{actionMode:'BUTTON',direction:null});if(r)notice.value='Day ended safely';}
function handleSwipe(a){if(a==='START_DAY')openForm('DAY_START');else if(a==='START_PERSONAL_TRIP')openForm('PERSONAL_START');else if(a==='START_SHIFT')void startShift();else if(a==='START_TRIP')void startBusinessTrip();else if(a==='END_TRIP')void endBusinessTrip();else if(a==='END_PERSONAL_TRIP')openForm('PERSONAL_END');else if(a==='END_SHIFT')openForm('SHIFT_END');else if(a==='CLOSE_PERSONAL_TRIP')void confirmPersonalEnd();else if(a==='CLOSE_SHIFT')void confirmShiftEnd();}
function requestEndDay(){if(canEndDay.value)endDayConfirm.value=true;}
function cancelEndDay(){if(!busy.value){endDayConfirm.value=false;error.value='';}}
function onKey(e){if(e.key==='Escape'){if(endDayConfirm.value)cancelEndDay();else if(form.value)closeForm();}}
onMounted(()=>{timer=setInterval(()=>now.value=Date.now(),1000);window.addEventListener('keydown',onKey);void load();});
onUnmounted(()=>{clearInterval(timer);window.removeEventListener('keydown',onKey);});
</script>
<template>
<section class="kfe-work-session" aria-labelledby="work-title">
<div v-if="loading" class="work-loading" role="status">Loading Work…</div>
<template v-else>
<header class="work-header"><div><p class="kfe-eyebrow">Operational cockpit</p><h1 id="work-title">Work</h1><p>Today · {{ screenState.replaceAll('_',' ') }}</p></div><div class="work-header-status"><span class="work-shift-mini">SHIFT {{ activeShift?duration(shiftElapsed):'—' }}</span></div></header>
<div v-if="error" class="work-error" role="alert">{{ error }}</div>
<div v-if="notice" class="work-notice" role="status">✓ {{ notice }}</div>
<main class="work-main">
<section v-if="screenState==='DAY_START'||screenState==='DAY_ENDED'" class="work-state-panel day-start-panel"><p class="kfe-eyebrow">{{screenState==='DAY_ENDED'?'DAY ENDED':'START OF DAY'}}</p><h2>{{screenState==='DAY_ENDED'?'Ready for the next operational day':'Ready for operation'}}</h2><p class="muted">{{latestOdometer==null?'Enter the odometer to establish the first authoritative reading.':'Your latest authoritative odometer is prefilled when you start the day.'}}</p></section>
<section v-else-if="screenState==='DAY_READY'" class="work-state-panel ready-panel"><p class="kfe-eyebrow">READY FOR OPERATION</p><div class="ready-odometer"><span>Odometer</span><strong>{{latestOdometer}}</strong><small>km</small></div><div class="ready-status"><span>Shift: <b>NOT ACTIVE</b></span><span>Personal trip: <b>NOT ACTIVE</b></span></div><button class="end-day-button" type="button" :disabled="busy||!canEndDay" @click="requestEndDay">End day</button></section>
<section v-else-if="screenState==='SHIFT_WAITING'" class="work-state-panel waiting-panel"><p class="kfe-eyebrow">SHIFT ACTIVE</p><div class="waiting-metrics"><div><span>Trips</span><strong>{{shiftTripCount}}</strong></div><div><span>Shift time</span><strong>{{duration(shiftElapsed)}}</strong></div></div><p class="waiting-copy">Waiting for the next ride.</p></section>
<section v-else-if="screenState==='BUSINESS_TRIP'" class="work-state-panel trip-panel"><p class="kfe-eyebrow">BUSINESS TRIP</p><div class="trip-timer">{{duration(tripElapsed)}}</div><p class="muted">Trip active</p></section>
<section v-else-if="screenState==='PERSONAL_TRIP'" class="work-state-panel trip-panel"><p class="kfe-eyebrow">PERSONAL TRIP</p><div class="trip-timer">{{duration(tripElapsed)}}</div><p class="muted">Personal trip active</p></section>
</main>
<div class="bottom-action" aria-label="Work action">
<KfeSwipeBar v-if="!form&&screenState==='DAY_START'" left-label="START PERSONAL TRIP" right-label="START DAY" left-action="START_PERSONAL_TRIP" right-action="START_DAY" :disabled="busy" :right-disabled="!canStartDay" @swipe="handleSwipe" />
<KfeSwipeBar v-else-if="!form&&screenState==='DAY_READY'" left-label="START PERSONAL TRIP" right-label="START SHIFT" left-action="START_PERSONAL_TRIP" right-action="START_SHIFT" :disabled="busy" @swipe="handleSwipe" />
<KfeSwipeBar v-else-if="!form&&screenState==='SHIFT_WAITING'" left-label="END SHIFT" right-label="START BUSINESS TRIP" left-action="END_SHIFT" right-action="START_TRIP" :disabled="busy" @swipe="handleSwipe" />
<KfeSwipeBar v-else-if="!form&&screenState==='BUSINESS_TRIP'" right-label="END BUSINESS TRIP" right-action="END_TRIP" :disabled="busy" @swipe="handleSwipe" />
<KfeSwipeBar v-else-if="!form&&screenState==='PERSONAL_TRIP'" right-label="END PERSONAL TRIP" right-action="END_PERSONAL_TRIP" :disabled="busy" @swipe="handleSwipe" />
<KfeSwipeBar v-else-if="form==='PERSONAL_END'" right-label="CLOSE PERSONAL TRIP" right-action="CLOSE_PERSONAL_TRIP" :disabled="busy||!personalEndValid" @swipe="handleSwipe" />
<KfeSwipeBar v-else-if="form==='SHIFT_END'" left-label="CLOSE SHIFT" left-action="CLOSE_SHIFT" :disabled="busy||!shiftEndValid||!shiftRevenueValid" @swipe="handleSwipe" />
<KfeSwipeBar v-else-if="form==='PERSONAL_START'" right-label="START PERSONAL TRIP" right-action="START_PERSONAL_TRIP" :disabled="busy||!personalAllocationValid" @swipe="handleSwipe" />
<KfeSwipeBar v-else right-label="CONFIRM" right-action="CONFIRM" :disabled="busy" @swipe="handleSwipe" />
</div>
<div v-if="form" class="work-form-overlay" role="dialog" aria-modal="true">
<div class="work-form-card">
<p class="kfe-eyebrow">{{form==='DAY_START'?'START OF DAY':form==='PERSONAL_START'?'START PERSONAL TRIP':form==='PERSONAL_END'?'END PERSONAL TRIP':'END SHIFT'}}</p>
<h2>{{form==='DAY_START'?'Start day':form==='PERSONAL_START'?'Personal trip start':form==='PERSONAL_END'?'Personal trip end':'Shift closing details'}}</h2>
<div v-if="form==='DAY_START'" class="work-form-fields"><label>Start odometer *<input v-model="dayStartOdometer" inputmode="numeric" type="number" min="0" step="1" /></label><div v-if="dayDiff.required" class="allocation-block"><p>KM allocation required: {{dayDiff.difference}} km</p><label>Business KM *<input v-model="dayBusinessKm" inputmode="numeric" type="number" min="0" step="1" /></label><label>Personal KM *<input v-model="dayPersonalKm" inputmode="numeric" type="number" min="0" step="1" /></label></div><p class="muted">{{latestOdometer==null?'This establishes the first authoritative reading.':'Prefilled from the latest authoritative odometer; editable.'}}</p></div>
<div v-else-if="form==='PERSONAL_START'" class="work-form-fields"><label>Start odometer *<input v-model="personalStartOdometer" inputmode="numeric" type="number" min="0" step="1" /></label><div v-if="personalDiff.required" class="allocation-block"><p>KM allocation required: {{personalDiff.difference}} km</p><label>Business KM *<input v-model="personalBusinessKm" inputmode="numeric" type="number" min="0" step="1" /></label><label>Personal KM *<input v-model="personalPersonalKm" inputmode="numeric" type="number" min="0" step="1" /></label></div><p class="muted">Prefilled from the latest authoritative odometer; editable.</p></div>
<div v-else-if="form==='PERSONAL_END'" class="work-form-fields"><label>End odometer *<input v-model="personalEndOdometer" inputmode="numeric" type="number" min="0" step="1" /></label><label>Toll <span class="muted">Optional</span><input v-model="personalToll" inputmode="decimal" type="number" min="0" step="0.01" /></label><label>Parking <span class="muted">Optional</span><input v-model="personalParking" inputmode="decimal" type="number" min="0" step="0.01" /></label><p class="muted">End odometer is required and starts empty. Complete the form, then use the Close Personal Trip swipe.</p></div>
<div v-else class="work-form-fields"><label>Revenue *<input v-model="shiftRevenue" inputmode="decimal" type="number" min="0" step="0.01" /></label><label>End odometer *<input v-model="shiftEndOdometer" inputmode="numeric" type="number" min="0" step="1" /></label><label>Toll <span class="muted">Optional</span><input v-model="shiftToll" inputmode="decimal" type="number" min="0" step="0.01" /></label><label>Parking <span class="muted">Optional</span><input v-model="shiftParking" inputmode="decimal" type="number" min="0" step="0.01" /></label><fieldset><legend>Toll fare treatment</legend><label><input v-model="shiftTollIncluded" type="radio" :value="true" name="shift-toll" /> Included in fare</label><label><input v-model="shiftTollIncluded" type="radio" :value="false" name="shift-toll" /> Not included in fare</label></fieldset><fieldset><legend>Parking fare treatment</legend><label><input v-model="shiftParkingIncluded" type="radio" :value="true" name="shift-parking" /> Included in fare</label><label><input v-model="shiftParkingIncluded" type="radio" :value="false" name="shift-parking" /> Not included in fare</label></fieldset><p class="muted">Revenue and end odometer are required. Toll and parking are optional. Complete the form, then use the Close Shift swipe.</p></div>
<button class="secondary-action" type="button" :disabled="busy" @click="closeForm">Cancel</button>
</div></div>
<div v-if="endDayConfirm" class="work-form-overlay" role="dialog" aria-modal="true"><div class="work-form-card"><p class="kfe-eyebrow">END DAY</p><h2>Confirm day closure</h2><p>All active work must be closed before ending the day.</p><button class="primary-action" type="button" :disabled="busy" @click="confirmEndDay">Confirm</button><button class="secondary-action" type="button" :disabled="busy" @click="cancelEndDay">Cancel</button></div></div>
</template>
</section>
<style scoped>
/* existing work-session styling remains in work-session.css */
</style>