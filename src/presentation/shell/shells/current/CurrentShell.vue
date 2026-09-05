<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import App from '../../../../App.vue';
import WorkBreakControl from '../../../../components/WorkBreakControl.vue';

const showWorkBreak = ref(location.hash === '' || location.hash === '#Work');
function syncRoute() { showWorkBreak.value = location.hash === '' || location.hash === '#Work'; }
onMounted(() => window.addEventListener('hashchange', syncRoute));
onUnmounted(() => window.removeEventListener('hashchange', syncRoute));
</script>

<template>
  <App />
  <WorkBreakControl v-if="showWorkBreak" />
</template>
