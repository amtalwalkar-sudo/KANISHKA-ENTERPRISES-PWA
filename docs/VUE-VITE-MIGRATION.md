# KFE Vue + Vite PWA migration

The migration is progressive: the existing UI remains pixel-identical while Vue becomes the application composition boundary. Business behavior and persistence stay behind the existing view-model/repository contracts.

## 12-step migration status

1. **Lock the existing behavior** — existing `index.html`, legacy runtime, screen view-models and repository remain intact as the compatibility baseline.
2. **Introduce Vite** — `vite.config.js` owns development/build composition and copies the existing runtime assets into `dist`.
3. **Introduce Vue** — `src/main.js` and `src/App.vue` bootstrap Vue without altering the visible UI.
4. **Keep the UI shell uncoupled** — `js/ui-shell.js` remains prohibited from importing domain, screen or dashboard modules.
5. **Preserve the application boundary** — Vue consumes `window.KFE_*` view-model bridges produced by the application layer rather than reading IndexedDB directly.
6. **Preserve feature isolation** — Work, Fuel, Expenses, Revenue, Maintenance, Loan and Renewals continue to expose screen view-models independently.
7. **Preserve Dashboard aggregation** — Dashboard receives the aggregation boundary and does not reach into individual UI components.
8. **Preserve repository ownership** — IndexedDB and Outbox remain behind `js/core/repository.js`; Vue has no storage calls.
9. **Preserve Android PWA infrastructure** — the existing service worker, Background Sync, crash buffer, recovery, Wake Lock and geolocation services remain outside Vue components.
10. **Make production builds reproducible** — CI installs dependencies, runs `npm run build`, then runs architecture/resilience/offline validation against `dist`.
11. **Screen-by-screen Vue migration boundary** — the Vue bridge is deliberately non-visual now; each screen can be moved into `src/screens/*.vue` independently without rewriting storage or business calculations.
12. **Legacy removal gate** — `js/legacy-runtime.js` is not deleted until all screen behavior is migrated and the business-runtime/resilience/offline test suites pass against the Vue build.

## Important boundary

This is a **progressive migration**, not a risky big-bang rewrite. The current commit makes Vue + Vite the build/application foundation while preserving the existing UI and business behavior. The remaining legacy runtime is intentionally retained as a compatibility layer until its responsibilities have been replaced and independently validated.

Android is the target runtime. No iOS-specific replay path is introduced by this migration.
