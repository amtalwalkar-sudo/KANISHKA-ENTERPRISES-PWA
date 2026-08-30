<script setup>
import { computed, ref } from 'vue';
import KfeFormShell from './KfeFormShell.vue';
import KfeFormField from './KfeFormField.vue';
import FuelHistoryView from './FuelHistoryView.vue';
const props=defineProps({module:{type:String,required:true},fuelRecords:{type:Array,default:()=>[]},fuelHistoryOpen:{type:Boolean,default:false}});
const emit=defineEmits(['save-request','back','open','fuel-history-back','fuel-edit','fuel-undo']);
const activeAction=ref('');
const definitions={Fuel:{title:'Fuel',subtitle:'Record fuel using the established KFE fuel model.',actions:['Add fuel','Fuel history']},Expenses:{title:'Expenses',subtitle:'One unified expense model for business expenses.',actions:['Add expense','Toll','Parking','Expense history']},Revenue:{title:'Revenue',subtitle:'Fast manual end-of-day revenue entry.',actions:['Enter today’s revenue','Revenue history']}};
const definition=computed(()=>definitions[props.module]);
const formSpec=computed(()=>{
 if(props.module==='Fuel'&&activeAction.value==='Add fuel')return{title:'Add fuel',subtitle:'Capture the authoritative fuel record.',fields:[{id:'date',label:'Date',type:'date',required:true},{id:'odometer',label:'Odometer',type:'number',required:true},{id:'amount',label:'Amount',type:'number',required:true,placeholder:'0.00'}]};
 if(props.module==='Expenses'&&['Add expense','Toll','Parking'].includes(activeAction.value))return{title:activeAction.value==='Add expense'?'Add expense':`Add ${activeAction.value.toLowerCase()}`,subtitle:'Use the unified expense model.',fields:[{id:'category',label:'Category',required:true,placeholder:'Select category'},{id:'date',label:'Date',type:'date',required:true},{id:'amount',label:'Amount',type:'number',required:true,placeholder:'0.00'},{id:'description',label:'Description',optional:true,placeholder:'Optional details'},{id:'reference',label:'Receipt / reference',optional:true,placeholder:'Optional reference'}]};
 if(props.module==='Revenue'&&activeAction.value==='Enter today’s revenue')return{title:'Enter today’s revenue',subtitle:'Manual end-of-day revenue entry.',fields:[{id:'amount',label:'Revenue amount',type:'number',required:true,placeholder:'0.00'},{id:'date',label:'Date',type:'date',required:true}]};
 return null;
});
function openAction(item){if(item==='Fuel history'){emit('open','Fuel history');return;}if(formSpec.value|| (props.module==='Fuel'&&item==='Add fuel')||(props.module==='Expenses'&&['Add expense','Toll','Parking'].includes(item))||(props.module==='Revenue'&&item==='Enter today’s revenue'))activeAction.value=item;else emit('open',item);}
function closeAction(){activeAction.value='';}
function onSave(value){emit('save-request',{module:props.module,action:activeAction.value,value});}
</script>
<template>
<section v-if="module==='Fuel'&&fuelHistoryOpen"><FuelHistoryView :records="fuelRecords" @back="emit('fuel-history-back')" @edit="emit('fuel-edit',$event)" @undo="emit('fuel-undo',$event)" /></section>
<section v-else class="kfe-module-view" :data-module="module" aria-labelledby="money-title">
<button class="kfe-secondary-action kfe-back-action" type="button" @click="activeAction?closeAction():emit('back')">‹ {{activeAction?definition.title:'More'}}</button>
<p class="kfe-eyebrow">Money</p><h1 id="money-title">{{definition.title}}</h1><p class="kfe-destination-subtitle">{{definition.subtitle}}</p>
<KfeFormShell v-if="formSpec" :draft-key="`${module}:${activeAction}`" :title="formSpec.title" :subtitle="formSpec.subtitle" @save="onSave"><template #default="{value}"><KfeFormField v-for="field in formSpec.fields" :key="field.id" v-bind="field" v-model="value[field.id]"/><p class="kfe-form-boundary-note">Save submits to the application boundary. The presentation layer does not create business records or calculate financial results.</p></template></KfeFormShell>
<div v-else class="kfe-module-sections"><section class="kfe-module-section"><h2>Quick entry</h2><div class="kfe-module-list"><button v-for="item in definition.actions" :key="item" type="button" @click="openAction(item)"><span>{{item}}</span><span aria-hidden="true">›</span></button></div></section></div>
</section>
</template>
