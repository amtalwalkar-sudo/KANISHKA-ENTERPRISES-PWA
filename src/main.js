import { repository, backup } from '../js/app.js';
import { createApp } from 'vue';
import { resolveKfeShell } from './presentation/shell/shell-resolver.js';

// Complete local persistence hydration before mounting the UI. This guarantees
// IndexedDB schema upgrades and persisted state are settled before any screen
// reads from the runtime. Backup protection starts only after this boundary.
await repository.load();
window.__KFE_PERSISTENCE_READY__ = true;
void backup.start().catch(error=>window.dispatchEvent(new CustomEvent('kfe:backup-error',{detail:{message:String(error?.message||error)}})));

const resolvedShell = resolveKfeShell();
const app = createApp(resolvedShell.shell.component);
app.mount('#vue-runtime');

window.KFE_VUE_RUNTIME = Object.freeze({
  mounted: true,
  app,
  shell: resolvedShell.resolved,
  requestedShell: resolvedShell.requested,
  shellFallback: resolvedShell.fallback,
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }, { once: true });
}

export const kfeVueApp = app;
export const kfeResolvedShell = resolvedShell;
