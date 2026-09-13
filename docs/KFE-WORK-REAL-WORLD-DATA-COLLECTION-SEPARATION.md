# KFE Work — Real-World Data Collection Separation Plan

## Purpose

This document records the agreed process for separating **KFE Work production data collection** from **local development/test data**, so the process is not forgotten during ongoing development.

## Target operating model

```text
                    SAME KFE CODEBASE
                           |
              +------------+------------+
              |                         |
        DEVELOPMENT                 PRODUCTION
              |                         |
          kfe-dev                      kfe
              |                         |
   Performance + Admin            KFE Work only
   synthetic/test data            real-world data
```

### Production

- KFE Work is used for real-world operational data collection.
- Production IndexedDB remains named `kfe` so existing real data is not unnecessarily renamed or migrated.
- Production must not contain synthetic/test Performance/Admin data.

### Development

- Local development and testing use a separate IndexedDB database named `kfe-dev`.
- Performance and Admin can continue to be developed and tested against synthetic/test data.
- Development must never read from or write to the production `kfe` database.

## Separation implementation

The canonical database boundary is:

`js/core/hardened-db.js` → `openKfeDb()` → `indexedDB.open(DB_NAME, DB_VERSION)`

The implementation should make the database name deterministic from the build/runtime environment rather than requiring a developer to manually edit source code before every build.

Target selection:

- Development build/runtime → `kfe-dev`
- Production build/runtime → `kfe`

Do **not** rename the existing production database merely to create the separation.

## Known hard-coded consumers to review

The following were identified during the initial separation audit:

- `js/core/hardened-db.js` — canonical `DB_NAME` definition.
- `js/application/kfe-application-facade.js` — direct `indexedDB.deleteDatabase('kfe')` cleanup path; must use the active database name.
- `js/core/repository.js` — backup metadata/validation uses `DB_NAME` and `DB_VERSION` and should therefore follow the active environment correctly.
- Browser/contract tests containing explicit `kfe` assertions or direct IndexedDB access must be reviewed and adjusted where appropriate. Test fixtures that intentionally exercise the legacy/production database should remain explicit and documented.
- `public/kfe-final-db-cleanup.html` — direct IndexedDB cleanup tool must be reviewed so it cannot accidentally delete the wrong environment.

## Safe implementation sequence

1. **Do not reset, clean, switch branches, or discard current local changes.**
2. Establish deterministic dev/prod DB selection at the canonical database boundary.
3. Keep production database name `kfe`.
4. Use `kfe-dev` for development/test builds.
5. Update application cleanup, backup/restore, and relevant tests/tools to use the active database identity safely.
6. Build and verify the development build uses `kfe-dev`.
7. Build and verify the production Work build uses `kfe`.
8. Confirm development cannot see production records and production cannot see development records.
9. Validate the Work data-collection workflow end-to-end.
10. Before first real-world production use, perform a production backup/recovery check and final release audit.
11. Only after these checks should the Work build be treated as the real-world data-collection release.

## Future feature promotion

Performance/Admin development remains isolated in `kfe-dev`.

When a new Work feature is ready for real-world use:

1. Develop and test it against development/synthetic data.
2. Identify any schema/data changes.
3. Create and validate an explicit production migration when required.
4. Back up production before a production schema/data change.
5. Build the production Work release from the validated source.
6. Apply the migration/update without deleting or replacing existing production data.
7. Verify the real production data after the update.

**Development and production databases must never be merged, copied over each other, or treated as interchangeable.** Code is promoted; production data is preserved.

## Current status

**Planning / separation not yet implemented.**

Current canonical production DB name: `kfe`  
Target development DB name: `kfe-dev`  

The next implementation step is the minimal environment-selection change at the canonical IndexedDB boundary, followed by targeted cleanup/test updates and verification.

## Design protection

This document records the agreed separation boundary. Do not silently weaken or reinterpret it. Any proposal that would allow development/test data to share the production database, or would make production depend on manually edited source code, must be treated as a design conflict and explicitly reviewed before implementation.
