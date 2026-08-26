import {createApp} from 'vue';
import App from './App.vue';

const app=createApp(App);
app.mount('#vue-runtime');

// Explicit composition boundary: the shell can prove Vue is mounted without
// reaching into component internals.
window.KFE_VUE_RUNTIME=Object.freeze({mounted:true,app});
export const kfeVueApp=app;
