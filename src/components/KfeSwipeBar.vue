<script setup>
import {computed, ref} from 'vue';
const props=defineProps({leftLabel:{type:String,default:''},rightLabel:{type:String,default:''},leftAction:{type:String,default:''},rightAction:{type:String,default:''},leftDisabled:{type:Boolean,default:false},rightDisabled:{type:Boolean,default:false},disabled:{type:Boolean,default:false}});
const emit=defineEmits(['swipe']);
const startX=ref(0),startY=ref(0),capturing=ref(false);
function normalizeLabel(label){return String(label||'').replace(/^\s*<+\s*/,'').replace(/\s*>+\s*$/,'').trim();}
const leftText=computed(()=>normalizeLabel(props.leftLabel));
const rightText=computed(()=>normalizeLabel(props.rightLabel));
function down(event){if(props.disabled)return;startX.value=event.clientX;startY.value=event.clientY;capturing.value=true;event.currentTarget.setPointerCapture?.(event.pointerId);}
function up(event){if(!capturing.value)return;capturing.value=false;const dx=event.clientX-startX.value,dy=event.clientY-startY.value;event.currentTarget.releasePointerCapture?.(event.pointerId);if(Math.abs(dx)<Math.max(72,event.currentTarget.clientWidth*.22)||Math.abs(dx)<Math.abs(dy)*1.15)return;const left=dx<0,action=left?props.leftAction:props.rightAction,blocked=props.disabled||(left?props.leftDisabled:props.rightDisabled);if(action&&!blocked)emit('swipe',action);}
</script>
<template>
<div class="kfe-swipe-bar" :class="{ 'is-disabled': disabled, 'is-dual': Boolean(leftText&&rightText) }" aria-hidden="false" :aria-disabled="disabled" :aria-label="[leftText,rightText].filter(Boolean).join(' or ')" @pointerdown="down" @pointerup="up" @pointercancel="capturing=false">
  <span v-if="leftText" class="kfe-swipe-left" :class="{'is-action-disabled':leftDisabled}"><b>←</b>{{ leftText }}</span>
  <span v-if="rightText" class="kfe-swipe-right" :class="{'is-action-disabled':rightDisabled}">{{ rightText }}<b>→</b></span>
</div>
</template>
