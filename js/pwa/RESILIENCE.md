# KFE PWA resilience infrastructure

## Web Push
`push-notifications.js` defines the browser-side subscription and notification contract. The Service Worker owns background delivery and notification display. A future server/push provider supplies VAPID-backed Web Push messages; business/domain/UI modules never call the Push API directly.

Policy: urgent operational alerts only. Push delivery is best-effort and never blocks local business actions.

## Local crash buffering
`crash-buffer.js` captures uncaught exceptions and unhandled promise rejections and stores structured records in IndexedDB. Network failures can be buffered through the same boundary. Records remain local until a future authenticated sync/telemetry adapter is added.

No credentials, tokens, or sensitive payloads should be placed into buffered context.

## Silent recovery
`silent-recovery.js` provides bounded retries with backoff. Recovery preserves current local state and the active screen. During an active trip, background failures must not navigate, reload, display blocking dialogs, or otherwise interrupt the driver. User-visible errors are reserved for failures requiring an explicit action.

## Boundary rule
PWA infrastructure is independent from domain calculations, screen view-models, dashboard aggregation, and the UI shell.
