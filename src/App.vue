<script setup>
import {computed, onMounted, onUnmounted, ref} from 'vue';

const online=ref(typeof navigator === 'undefined' ? true : navigator.onLine);
const foundationReady=ref(false);

const storageState=computed(()=>foundationReady.value ? 'ready' : 'initializing');

function refresh(){
  online.value=typeof navigator === 'undefined' ? true : navigator.onLine;
}

onMounted(()=>{
  window.addEventListener('online',refresh);
  window.addEventListener('offline',refresh);
  foundationReady.value=true;
  refresh();
});

onUnmounted(()=>{
  window.removeEventListener('online',refresh);
  window.removeEventListener('offline',refresh);
});

window.KFE_VUE_RUNTIME={online,storageState,foundationReady};
</script>

<template>
  <div id="kfe-foundation-root" data-framework="vue" :data-online="online" :data-foundation="storageState" aria-hidden="true"></div>
</template>

<style scoped>
#kfe-foundation-root{display:none}
</style>
