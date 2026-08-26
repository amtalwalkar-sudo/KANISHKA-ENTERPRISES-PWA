import {getScreenViewModel, getDashboardSnapshot} from './app.js';
const screenNames=['work','fuel','expenses','revenue','maintenance','loan','renewals'];
function publish(){
  const models=Object.fromEntries(screenNames.map(n=>[n,getScreenViewModel(n)]));
  window.KFE_VIEW_MODELS=Object.freeze(models);
  window.KFE_DASHBOARD_SNAPSHOT=getDashboardSnapshot();
  return models;
}
function boot(){
  publish();
  window.dispatchEvent(new CustomEvent('kfe:view-models-ready',{detail:window.KFE_VIEW_MODELS}));
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
else boot();
export {publish};
