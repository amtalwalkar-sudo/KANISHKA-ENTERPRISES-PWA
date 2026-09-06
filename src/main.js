import { repository } from '../js/app.js';
import { createApp } from 'vue';
import { resolveKfeShell } from './presentation/shell/shell-resolver.js';
import { installFormDraftRecovery } from '../js/ui/form-drafts.js';
import { installFormResilience } from '../js/ui/form-resilience.js';
import './styles/theme-adaptation.css';

// Persistence is preferred, but failure to open IndexedDB must never leave the
// production shell blank. Mount the UI even when storage is temporarily
// unavailable; repository operations can recover on the next attempt.
try {
  await repository.load();
  window.__KFE_PERSISTENCE_READY__ = true;
} catch (error) {
  window.__KFE_PERSISTENCE_READY__ = false;
  window.__KFE_PERSISTENCE_ERROR__ = String(error?.message || error || 'Persistence unavailable');
  console.warn('KFE persistence unavailable; continuing with runtime shell.', error);
}

const resolvedShell = resolveKfeShell();
const app = createApp(resolvedShell.shell.component);
app.config.errorHandler = (error, instance, info) => {
  window.__KFE_LAST_UI_ERROR__ = String(error?.message || error || 'UI error');
  console.error('KFE UI error:', error, info, instance);
};
app.mount('#vue-runtime');

// Install shared driver-facing form safeguards once, above individual screens.
// Existing form/domain behavior remains authoritative; these utilities only
// provide recovery, viewport, keyboard, validation and input ergonomics.
installFormDraftRecovery();
installFormResilience();

window.KFE_VUE_RUNTIME = Object.freeze({
  mounted: true,
  app,
  shell: resolvedShell.resolved,
  requestedShell: resolvedShell.requested,
  shellFallback: resolvedShell.fallback,
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js?v=20260905').catch((error) => {
      window.__KFE_SERVICE_WORKER_ERROR__ = String(error?.message || error || 'Service worker registration failed');
    });
  }, { once: true });
}

export const kfeVueApp = app;
export const kfeResolvedShell = resolvedShell;
