# KFE PWA decoupling boundary

## Rule
Each operational screen owns its calculations and wiring. Screen domains do not import other screen domains.

- `domain/work.js` → Work calculations
- `domain/fuel.js` → Fuel calculations
- `domain/expenses.js` → Expenses calculations
- `domain/revenue.js` → Revenue calculations
- `screens/*` → screen-local controllers/view models
- `core/store.js` → state only
- `app.js` → dependency composition only
- `dashboard/aggregator.js` → consumes published screen view models only

## Dashboard rule
Dashboard may later extract/present outputs from every screen, but it must never reach into another screen's calculation implementation. The screen publishes a result; Dashboard aggregates results.

## Migration rule
The legacy monolithic UI remains the compatibility shell while calculations are migrated behind these boundaries. During migration, existing behavior is preserved first; the old inline implementation is not silently rewritten into different business rules.
