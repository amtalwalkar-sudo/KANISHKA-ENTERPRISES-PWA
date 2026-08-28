import {createStore} from './core/store.js';
import {createRepository} from './core/repository.js';
import {createNetworkManager} from './core/network.js';
import {installCrashBuffer} from './pwa/crash-buffer.js';
import {initializeResilience} from './core/resilience.js';
import {createKfeApplication} from './application/kfe.js';
import {dashboardReadModel,workSessionReadModel,presentationError} from './application/read-models.js';

const initialState={};
export const repository=createRepository({initial:initialState});
export const state=createStore(initialState,repository);
export const application=createKfeApplication(repository);
installCrashBuffer();
const noTransport=async()=>{throw new Error('No sync transport configured');};
export const network=createNetworkManager({sendOutbox:noTransport,onStatus:online=>window.dispatchEvent(new CustomEvent('kfe:network',{detail:{online}}))});
export const actions=Object.freeze({});
export const viewModels=Object.freeze({dashboard:dashboardReadModel,workSession:workSessionReadModel,error:presentationError});
const runtime={repository,state,application,network,actions,viewModels};
window.__KFE_RUNTIME__=runtime;
window.KFE_REPOSITORY=repository;
window.KFE_NETWORK=network;
window.KFE_APPLICATION=application;
window.KFE_VIEW_MODELS=viewModels;
void initializeResilience({sendOutbox:noTransport});
export function getRuntime(){return runtime;}
