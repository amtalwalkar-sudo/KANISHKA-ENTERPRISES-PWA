<script setup>
import {onMounted,ref} from 'vue';
import {application,viewModels} from '../../js/app.js';
import {createUiCommand} from '../../js/application/ui-contract.js';

const state=ref('LOADING');
const error=ref(null);
const session=ref(null);
const startOdometer=ref('');
const endOdometer=ref('');
const breakMinutes=ref('0');
const busy=ref(false);

async function load(){
  state.value='LOADING'; error.value=null;
  try{
    const rows=await application.listWork();
    const current=[...rows].filter(row=>!row.is_deleted).sort((a,b)=>String(b.updated_at).localeCompare(String(a.updated_at)))[0]||null;
    session.value=current?viewModels.workSession(current).session:null;
    state.value=current?'READY':'EMPTY';
  }catch(e){error.value=viewModels.error(e);state.value='ERROR';}
}

async function start(){
  if(busy.value)return;
  busy.value=true;error.value=null;
  try{
    const command=createUiCommand('START_SHIFT',{started_at:new Date().toISOString(),start_odometer:Number(startOdometer.value),break_minutes:Number(breakMinutes.value)});
    const created=await application.startWork(command.payload);
    session.value=viewModels.workSession(created).session;
    state.value='READY';
  }catch(e){error.value=viewModels.error(e);state.value='ERROR';}
  finally{busy.value=false;}
}

async function complete(){
  if(busy.value||!session.value)return;
  busy.value=true;error.value=null;
  try{
    const command=createUiCommand('END_SHIFT',{ended_at:new Date().toISOString(),end_odometer:Number(endOdometer.value)});
    const updated=await application.completeWork(session.value.id,command.payload);
    session.value=viewModels.workSession(updated).session;
    state.value='READY';
  }catch(e){error.value=viewModels.error(e);state.value='ERROR';}
  finally{busy.value=false;}
}

onMounted(load);
</script>

<template>
  <section class="kfe-work-session" aria-labelledby="work-session-title">
    <header><h1 id="work-session-title">Work Session</h1><p>Persistent application slice</p></header>
    <p v-if="state==='LOADING'" role="status">Loading…</p>
    <p v-else-if="state==='EMPTY'">No work session recorded yet.</p>
    <p v-if="error" role="alert">{{ error.error }}</p>
    <div v-if="!session" class="kfe-form">
      <label>Start odometer <input v-model="startOdometer" inputmode="decimal" type="number" min="0" :disabled="busy"></label>
      <label>Break minutes <input v-model="breakMinutes" inputmode="decimal" type="number" min="0" :disabled="busy"></label>
      <button type="button" :disabled="busy||!startOdometer" @click="start">Start shift</button>
    </div>
    <div v-else class="kfe-session-card">
      <dl><div><dt>Status</dt><dd>{{ session.status }}</dd></div><div><dt>Start</dt><dd>{{ session.start_at }}</dd></div><div><dt>Start odometer</dt><dd>{{ session.start_odometer }}</dd></div><div><dt>Break</dt><dd>{{ session.break_minutes ?? 0 }} min</dd></div><div v-if="session.end_at"><dt>End</dt><dd>{{ session.end_at }}</dd></div><div v-if="session.end_odometer!=null"><dt>End odometer</dt><dd>{{ session.end_odometer }}</dd></div></dl>
      <div v-if="session.status==='OPEN'" class="kfe-form"><label>End odometer <input v-model="endOdometer" inputmode="decimal" type="number" min="0" :disabled="busy"></label><button type="button" :disabled="busy||!endOdometer" @click="complete">Complete shift</button></div>
    </div>
  </section>
</template>
