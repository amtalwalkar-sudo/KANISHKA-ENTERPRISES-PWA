<script setup>
import {onMounted,onUnmounted,ref} from 'vue';
import './styles/shell.css';
import WorkSessionView from './components/WorkSessionView.vue';
import {createUiRouter} from '../js/ui/router.js';
import {createUiState,UI_STATES} from '../js/ui/state.js';
import {detectUiCapabilities} from '../js/ui/capabilities.js';
import {createInteractionGuard} from '../js/ui/interaction.js';
import {createUiLifecycle} from '../js/ui/lifecycle.js';

const online=ref(typeof navigator==='undefined'?true:navigator.onLine);
const activeModule=ref('Dashboard');
const uiState=ref(UI_STATES.IDLE);
const capabilities=ref(detectUiCapabilities());
const modules=['Dashboard','Work','Fuel','Expenses','Revenue'];
const storageState=ref('Ready');
const syncState=ref(online.value?'Online':'Offline');
const router=createUiRouter({initialPath:activeModule.value,onChange:path=>{activeModule.value=path;}});
const state=createUiState();
const interaction=createInteractionGuard();
const lifecycle=createUiLifecycle({onOnline:()=>{online.value=true;syncState.value='Online';},onOffline:()=>{online.value=false;syncState.value='Offline';}});

function refresh(){online.value=typeof navigator==='undefined'?true:navigator.onLine;syncState.value=online.value?'Online':'Offline';capabilities.value=detectUiCapabilities();}
async function selectModule(module){const result=await interaction.run(async()=>{router.navigate(module);});if(!result.accepted)return;state.set(UI_STATES.READY);uiState.value=state.state;interaction.reset();}

onMounted(()=>{router.start();lifecycle.start();refresh();state.set(UI_STATES.READY);uiState.value=state.state;});
onUnmounted(()=>{router.stop();lifecycle.stop();});

window.KFE_VUE_RUNTIME={online,activeModule,uiState,capabilities};
</script>

<template>
  <div class="kfe-shell" data-framework="vue">
    <header class="kfe-topbar" aria-label="KFE application header">
      <div class="kfe-brand"><strong>KFE 2.0</strong><span>Kanishka Fleet ERP</span></div>
      <div class="kfe-status" aria-label="Application status"><span class="kfe-status-dot" aria-hidden="true"></span><span>{{ syncState }} · {{ storageState }}</span></div>
    </header>
    <main class="kfe-viewport" aria-label="Main application viewport">
      <section class="kfe-workspace" aria-live="polite">
        <WorkSessionView v-if="activeModule==='Work'" />
        <div v-else class="kfe-placeholder"><h1>{{ activeModule }}</h1><p>Structural PWA shell is active. Module views will be connected through the application boundary in later phases.</p></div>
      </section>
    </main>
    <nav class="kfe-bottom-nav" aria-label="Primary module navigation">
      <button v-for="module in modules" :key="module" class="kfe-nav-item" type="button" :aria-current="activeModule===module?'page':undefined" @click="selectModule(module)">{{ module }}</button>
    </nav>
  </div>
</template>
