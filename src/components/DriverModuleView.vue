<script setup>
import VehicleDomainView from './VehicleDomainView.vue';
defineProps({application:{type:Object,required:true}});const emit=defineEmits(['back']);
</script>
<template><VehicleDomainView :application="application" initial-tab="Driver" @back="emit('back')" /></template>
