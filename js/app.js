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
  START_SHIFT:payload=>application.startWork(payload),
  END_SHIFT:payload=>{
    const {id,...data}=payload;
    return application.completeWork(id,data);
  },
  START_TRIP:payload=>application.recordTrip(payload),
  END_TRIP:payload=>{
    const {id,...changes}=payload;
    return application.updateTrip(id,changes);
  },
  START_PERSONAL_TRIP:payload=>application.recordTrip(payload),
  END_PERSONAL_TRIP:payload=>{
    const {id,...changes}=payload;
    return application.updateTrip(id,changes);
  }
});

export const commandDispatcher=createCommandDispatcher(commandHandlers);
installCrashBuffer();
const noTransport=async()=>{throw new Error('No sync transport configured');};
export const network=createNetworkManager({sendOutbox:noTransport,onStatus:online=>window.dispatchEvent(new CustomEvent('kfe:network',{detail:{online}}))});
export const actions=Object.freeze({
  dispatch:commandDispatcher
});
export const viewModels=Object.freeze({dashboard:dashboardReadModel,workSession:workSessionReadModel,error:presentationError});
const runtime={
  repository,
  state,
  application,
  commandDispatcher,
  network,
  actions,
  viewModels
};
window.__KFE_RUNTIME__=runtime;
window.KFE_REPOSITORY=repository;
window.KFE_NETWORK=network;
window.KFE_APPLICATION=application;
window.KFE_VIEW_MODELS=viewModels;
void initializeResilience({sendOutbox:noTransport});
export function getRuntime(){return runtime;}
