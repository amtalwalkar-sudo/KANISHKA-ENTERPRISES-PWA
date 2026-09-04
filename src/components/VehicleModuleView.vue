<script setup>
import VehicleDomainView from './VehicleDomainView.vue';
defineProps({application:{type:Object,required:true}});const emit=defineEmits(['back','open']);
</script>
<template><VehicleDomainView :application="application" initial-tab="Vehicle" @back="emit('back')" /></template>
