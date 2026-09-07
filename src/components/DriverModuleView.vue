<script setup>
import Role from './DriverModuleRole.vue';
</script>
<template><Role v-bind="$attrs" @back="$emit('back')" @open="$emit('open',$event)" /></template>
