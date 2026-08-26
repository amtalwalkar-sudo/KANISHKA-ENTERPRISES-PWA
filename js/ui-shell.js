import {getScreenViewModel,getDashboardSnapshot,getCoreLoopViewModel,coreLoop,network,repository,actions} from './app.js';

const screenNames=['work','fuel','expenses','revenue','maintenance','loan','renewals'];
function publish(){
  const models=Object.fromEntries(screenNames.map(n=>[n,getScreenViewModel(n)]));
  window.KFE_VIEW_MODELS=Object.freeze(models);
  window.KFE_DASHBOARD_SNAPSHOT=Object.freeze(getDashboardSnapshot());
  window.KFE_CORE_LOOP=coreLoop;
  window.KFE_REPOSITORY=repository;
  window.KFE_NETWORK=network;
  window.KFE_ACTIONS=actions;
  window.KFE_CORE_LOOP_VIEW_MODEL=Object.freeze(getCoreLoopViewModel());
  return models;
}
function parseArgs(raw,event){
  if(!raw)return[];const parts=[];let token='',quote=null,depth=0;
  for(const ch of raw){if(quote){token+=ch;if(ch===quote)quote=null;continue;}if(ch==='"'||ch==="'"){quote=ch;token+=ch;continue;}if(ch==='('||ch==='['||ch==='{')depth++;if(ch===')'||ch===']'||ch==='}')depth--;if(ch===','&&depth===0){parts.push(token.trim());token='';}else token+=ch;}
  if(token.trim())parts.push(token.trim());
  return parts.map(value=>{if(value==='event')return event;if(value==='true')return true;if(value==='false')return false;if(value==='null')return null;if(/^[-+]?\d+(\.\d+)?$/.test(value))return Number(value);if((value.startsWith("'")&&value.endsWith("'"))||(value.startsWith('"')&&value.endsWith('"')))return value.slice(1,-1);return value;});
}
function dispatch(event){
  const target=event.target?.closest?.('[data-kfe-action]');if(!target)return;
  const expected=target.dataset.kfeEvent||'click';if(expected!==event.type)return;
  const action=target.dataset.kfeAction;
  if(action==='open-import-picker'){document.getElementById('import-file-input')?.click();return;}
  const handler=window.KFE_ACTIONS?.[action];if(typeof handler!=='function')return;handler(...parseArgs(target.dataset.kfeArgs,event));
}
function boot(){
  publish();
  document.addEventListener('click',dispatch);document.addEventListener('change',dispatch);
  window.addEventListener('kfe:network',publish);window.addEventListener('kfe:runtime',publish);
  window.dispatchEvent(new CustomEvent('kfe:view-models-ready',{detail:window.KFE_VIEW_MODELS}));
}
function safeBoot(){
  try{publish();}
  catch(error){
    window.KFE_BOOT_ERROR={name:error?.name||'Error',message:error?.message||String(error),stack:error?.stack||null};
    throw error;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
// Publish immediately so the runtime contract is available independently of DOM readiness.
safeBoot();
export{publish};
