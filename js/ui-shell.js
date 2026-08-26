import {getScreenViewModel,getDashboardSnapshot,getCoreLoopViewModel,coreLoop,network,repository,actions as appActions} from './app.js';

const screenNames=['work','fuel','expenses','revenue','maintenance','loan','renewals'];

function syncExistingUi(models,dashboard){
  // Existing DOM remains the visual shell. This adapter only projects view-model
  // values into already-owned UI fields; it contains no business calculations.
  const work=models.work||{};
  const todayKm=document.getElementById('today-km');
  if(todayKm && Number.isFinite(Number(work.km))) todayKm.textContent=String(work.km);
  const dashboardWork=dashboard?.work||{};
  const dashboardKm=document.getElementById('dash-km');
  if(dashboardKm && Number.isFinite(Number(dashboardWork.km))) dashboardKm.textContent=`${dashboardWork.km} km`;
}

function publish(){
  const models=Object.fromEntries(screenNames.map(n=>[n,getScreenViewModel(n)]));
  const dashboardSnapshot=getDashboardSnapshot();
  const coreLoopViewModel=getCoreLoopViewModel();
  const legacyActions=window.KFE_ACTIONS||{};
  const mergedActions=Object.freeze({...legacyActions,...appActions});
  window.KFE_ACTIONS=mergedActions;
  window.KFE_VIEW_MODELS=Object.freeze(models);
  window.KFE_DASHBOARD_SNAPSHOT=Object.freeze(dashboardSnapshot);
  window.KFE_CORE_LOOP=coreLoop;
  window.KFE_REPOSITORY=repository;
  window.KFE_NETWORK=network;
  window.KFE_CORE_LOOP_VIEW_MODEL=Object.freeze(coreLoopViewModel);
  window.__KFE_RUNTIME__=Object.freeze({
    workViewModel:models.work,
    fuelViewModel:models.fuel,
    expensesViewModel:models.expenses,
    revenueViewModel:models.revenue,
    maintenanceViewModel:models.maintenance,
    loanViewModel:models.loan,
    renewalsViewModel:models.renewals,
    dashboardViewModel:dashboardSnapshot,
    actions:mergedActions
  });
  syncExistingUi(models,dashboardSnapshot);
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
publish();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
export{publish};
