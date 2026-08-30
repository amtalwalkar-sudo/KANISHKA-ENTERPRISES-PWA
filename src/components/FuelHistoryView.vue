<script setup>
import { computed, ref } from 'vue';
const props=defineProps({records:{type:Array,default:()=>[]}});
const emit=defineEmits(['back','edit','undo']);
const editing=ref(null);const draft=ref({});
const ordered=computed(()=>[...props.records].filter(r=>!r.is_deleted).sort((a,b)=>String(b.recorded_at||b.created_at||'').localeCompare(String(a.recorded_at||a.created_at||''))));
function begin(r){editing.value=r.id;draft.value={odometer:r.odometer,price_per_kg:r.price_per_kg,amount_paise:r.amount_paise};}
function save(){if(!draft.value.odometer||!draft.value.price_per_kg||!draft.value.amount_paise)return;emit('edit',{id:editing.value,changes:{odometer:Number(draft.value.odometer),price_per_kg:Number(draft.value.price_per_kg),amount_paise:Math.round(Number(draft.value.amount_paise))}});editing.value=null;}
function cancel(){editing.value=null;draft.value={};}
</script>
<template>
<section class="kfe-module-view" aria-labelledby="fuel-history-title">
<button class="kfe-secondary-action kfe-back-action" type="button" @click="emit('back')">‹ Fuel</button>
<p class="kfe-eyebrow">Money · Fuel</p><h1 id="fuel-history-title">Fuel history</h1>
<p class="kfe-destination-subtitle">Authoritative saved CNG refills. Records remain editable and reversible.</p>
<div v-if="!ordered.length" class="kfe-placeholder"><h2>No fuel records</h2><p>Saved Quick CNG refills will appear here.</p></div>
<div v-else class="kfe-module-sections"><article v-for="r in ordered" :key="r.id" class="kfe-detail-card">
<div class="kfe-detail-card__top"><div><span class="kfe-card-label">{{ r.fuel_type||'CNG' }} · {{ new Date(r.recorded_at||r.created_at).toLocaleString() }}</span><strong>{{ Number(r.quantity_kg||0).toFixed(3) }} kg</strong></div><span class="kfe-state-badge">Saved</span></div>
<dl v-if="editing!==r.id" class="kfe-detail-list"><div><dt>Odometer</dt><dd>{{ r.odometer }}</dd></div><div><dt>Price / kg</dt><dd>₹{{ Number(r.price_per_kg||0).toFixed(2) }}</dd></div><div><dt>Amount paid</dt><dd>₹{{ (Number(r.amount_paise||0)/100).toFixed(2) }}</dd></div></dl>
<div v-if="editing===r.id" class="kfe-form-body"><label class="kfe-form-field">Odometer<input v-model="draft.odometer" inputmode="numeric" type="number" min="0"></label><label class="kfe-form-field">Price / kg<input v-model="draft.price_per_kg" inputmode="decimal" type="number" min="0" step="0.01"></label><label class="kfe-form-field">Amount paid<input v-model="draft.amount_paise" inputmode="numeric" type="number" min="0" step="1"></label><div class="kfe-form-actions"><button class="kfe-secondary-action" type="button" @click="cancel">Cancel</button><button class="kfe-primary-action" type="button" @click="save">Save changes</button></div></div>
<div v-else class="kfe-form-actions"><button class="kfe-secondary-action" type="button" @click="begin(r)">Edit</button><button class="kfe-secondary-action" type="button" @click="emit('undo',r.id)">Undo / remove</button></div>
</article></div>
</section>
</template>
