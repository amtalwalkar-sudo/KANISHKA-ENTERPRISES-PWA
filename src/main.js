import '../js/app.js';
import {createApp} from 'vue';
import App from './App.vue';

const app=createApp(App);
app.mount('#vue-runtime');

window.KFE_VUE_RUNTIME=Object.freeze({mounted:true,app});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }, {once:true});
}

export const kfeVueApp=app;
