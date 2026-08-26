<script setup>
import {computed, onMounted, onUnmounted, ref} from 'vue';

const online=ref(navigator.onLine);
const runtime=ref(window.KFE_CORE_LOOP_VIEW_MODEL||{});
const models=ref(window.KFE_VIEW_MODELS||{});

function refresh(){
  online.value=navigator.onLine;
  runtime.value=window.KFE_CORE_LOOP_VIEW_MODEL||{};
  models.value=window.KFE_VIEW_MODELS||{};
}

const state=computed(()=>runtime.value?.onDuty?'on-duty':'off-duty');

onMounted(()=>{
  window.addEventListener('kfe:network',refresh);
  window.addEventListener('kfe:runtime',refresh);
  window.addEventListener('kfe:view-models-ready',refresh);
  window.addEventListener('online',refresh);
  window.addEventListener('offline',refresh);
  refresh();
});

onUnmounted(()=>{
  window.removeEventListener('kfe:network',refresh);
  window.removeEventListener('kfe:runtime',refresh);
  window.removeEventListener('kfe:view-models-ready',refresh);
  window.removeEventListener('online',refresh);
  window.removeEventListener('offline',refresh);
});

// Intentionally non-visual during migration: Vue is the application shell
// composition boundary; legacy DOM remains pixel-identical until a screen is
// migrated to a Vue component.
window.KFE_VUE_RUNTIME={state,models,online};
</script>

<template>
  <span class="kfe-vue-runtime" aria-hidden="true" data-framework="vue" :data-state="state" :data-online="online"></span>
</template>

<style scoped>
.kfe-vue-runtime{display:none}
</style>
