<script setup>
import {computed, onMounted, onUnmounted, ref} from 'vue';
import './styles/shell.css';

const online=ref(typeof navigator === 'undefined' ? true : navigator.onLine);
const activeModule=ref('Dashboard');
const foundationReady=ref(false);
const modules=['Dashboard','Work','Fuel','Expenses','Revenue'];
const storageState=computed(()=>foundationReady.value ? 'Ready' : 'Initializing');
const syncState=computed(()=>online.value ? 'Online' : 'Offline');

function refresh(){online.value=typeof navigator === 'undefined' ? true : navigator.onLine;}
function selectModule(module){activeModule.value=module;}

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

window.KFE_VUE_RUNTIME={online,storageState,foundationReady,activeModule};
</script>

<template>
  <div class="kfe-shell" data-framework="vue">
    <header class="kfe-topbar" aria-label="KFE application header">
      <div class="kfe-brand">
        <strong>KFE 2.0</strong>
        <span>Kanishka Fleet ERP</span>
      </div>
      <div class="kfe-status" aria-label="Application status">
        <span class="kfe-status-dot" aria-hidden="true"></span>
        <span>{{ syncState }} · {{ storageState }}</span>
      </div>
    </header>

    <main class="kfe-viewport" aria-label="Main application viewport">
      <section class="kfe-workspace" aria-live="polite">
        <div class="kfe-placeholder">
          <h1>{{ activeModule }}</h1>
          <p>Structural PWA shell is active. Module views will be connected through the application boundary in later phases.</p>
        </div>
      </section>
    </main>

    <nav class="kfe-bottom-nav" aria-label="Primary module navigation">
      <button v-for="module in modules" :key="module" class="kfe-nav-item" type="button" :aria-current="activeModule === module ? 'page' : undefined" @click="selectModule(module)">{{ module }}</button>
    </nav>
  </div>
</template>
