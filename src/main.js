import {createApp,ref,onMounted,onUnmounted} from 'vue';
import App from './App.vue';

const app=createApp(App);
app.mount('#vue-runtime');

// Migration bridge: Vue owns application composition while the existing DOM UI
// continues to render unchanged until each screen is migrated independently.
export const kfeVueApp=app;
