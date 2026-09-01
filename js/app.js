import {createStore} from './core/store.js';
import {createRepository} from './core/repository.js';
import {createNetworkManager} from './core/network.js';
import {installCrashBuffer} from './pwa/crash-buffer.js';
import {initializeResilience} from './core/resilience.js';
import {createKfeApplication} from './application/kfe.js';
import {createCommandDispatcher} from './application/command-dispatcher.js';
import {dashboardReadModel,workSessionReadModel,presentationError} from './application/read-models.js';

const initialState={};
export const repository=createRepository({initial:initialState});
export const state=createStore(initialState,repository);
export const application=createKfeApplication(repository);

const commandHandlers=Object.freeze({
  START_DAY:payload=>application.startDay(payload),
  START_SHIFT:payload=>application.startShift(payload),
  END_SHIFT:async payload=>{
    const revenue=payload?.revenuePaise;
    if(!Number.isInteger(revenue)||revenue<0)throw new Error('Shift revenue is compulsory. Enter revenue before closing the shift.');
    const shift=await application.getWork(payload?.id);
    if(!shift)throw new Error('Shift is not active.');
    const revenueRecord=await application.recordRevenue({work_session_id:shift.id,amount_paise:revenue,scope:'BUSINESS',business_date:shift.business_date,recorded_at:new Date().toISOString(),entry_source:'SHIFT_CLOSURE'});
    try{
      const result=await application.endShift(payload);
      return result;
    }catch(error){
      try{const existing=await repository.entity('revenue_records').get(revenueRecord.id);if(existing)await repository.entity('revenue_records').softDelete(existing);}catch{}
      throw error;
    }
  },
  START_TRIP:payload=>application.startBusinessTrip(payload),
  END_TRIP:payload=>application.endBusinessTrip(payload),
  START_PERSONAL_TRIP:payload=>application.startPersonalTrip(payload),
  END_PERSONAL_TRIP:payload=>application.endPersonalTrip(payload),
  END_DAY:payload=>application.endDay(payload),
  UNDO_WORK_ACTION:payload=>application.undoWorkAction(payload),
  SELECT_MODULE:async()=>true
});

export const commandDispatcher=createCommandDispatcher(commandHandlers);
installCrashBuffer();
const noTransport=async()=>{throw new Error('No sync transport configured');};
export const network=createNetworkManager({sendOutbox:noTransport,onStatus:online=>window.dispatchEvent(new CustomEvent('kfe:network',{detail:{online}}))});
export const actions=Object.freeze({dispatch:commandDispatcher});
export const viewModels=Object.freeze({dashboard:dashboardReadModel,workSession:workSessionReadModel,error:presentationError});
const runtime={repository,state,application,commandDispatcher,network,actions,viewModels};
window.__KFE_RUNTIME__=runtime;
window.KFE_REPOSITORY=repository;
window.KFE_NETWORK=network;
window.KFE_APPLICATION=application;
window.KFE_VIEW_MODELS=viewModels;
void initializeResilience({sendOutbox:noTransport});
export function getRuntime(){return runtime;}