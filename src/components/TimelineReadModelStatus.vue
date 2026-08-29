<script setup>
defineProps({ model: { type: Object, default: null } });
</script>
<template><span v-if="model" class="sr-only" aria-live="polite">Timeline data: {{ model.events?.length || 0 }} events</span></template>
