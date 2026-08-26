import {createApp} from 'vue';
import App from './App.vue';

const app=createApp(App);
app.mount('#vue-runtime');

// Runtime proof marker: Vue is the mounted application composition boundary.
window.KFE_VUE_RUNTIME={mounted:true,app};

// Migration bridge: Vue owns application composition while the existing DOM UI
// continues to render unchanged until each screen is migrated independently.
export const kfeVueApp=app;
