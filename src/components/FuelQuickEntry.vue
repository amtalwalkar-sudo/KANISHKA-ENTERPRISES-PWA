<script setup>
import AuthoritativeRecordForm from './AuthoritativeRecordForm.vue';
const props=defineProps({authoritativeOdometer:{type:[Number,String],default:null}});
const emit=defineEmits(['close','saved']);
</script>
<template><AuthoritativeRecordForm type="FUEL" mode="CREATE" :authoritative-odometer="props.authoritativeOdometer" @close="emit('close')" @saved="emit('saved',$event)" /></template>
