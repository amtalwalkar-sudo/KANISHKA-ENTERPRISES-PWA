# KFE Environment & Data Separation

**Status: Agreed development direction — 2026-09-13**

## Decision

KFE will use **one Git repository** (`KANISHKA-ENTERPRISES-PWA`) while maintaining strict separation between the production Work application/data and development/test application/data.

## Production

- KFE Work is the real-world operational application.
- Production APK uses the production application identity.
- Production uses the **real KFE database**.
- Real rides, shifts, odometer, revenue, expenses, and operational history must remain isolated from development/test data.
- Production data must not be used as a development/test database.

## Development

- KFE development remains in the same repository.
- Development APK/app uses a **separate development application identity** so it can coexist with the production KFE app on the same Android phone.
- Development uses a **separate synthetic/test database**.
- Synthetic test data may be created, reset, and removed without affecting production data.
- The frozen KFE synthetic dataset (April 2026 through March 2031) belongs to the development/test environment.

## Release / Promotion

Development features such as Performance, Admin, Backup/Sync, and future ERP capabilities are developed and tested against synthetic data first.

A tested release is deliberately promoted to production. Installing/updating a production APK must preserve existing real data and use explicit database migrations whenever the schema changes.

## Non-Negotiable Boundary

**Same repository does NOT mean same database.**

The following separation must be maintained:

```text
KANISHKA-ENTERPRISES-PWA
│
├── Production
│   ├── KFE Work APK
│   └── REAL database
│
└── Development
    ├── KFE DEV APK
    └── SYNTHETIC database
```

Real production data must never be replaced, seeded, reset, or contaminated by synthetic/test-data operations.

## Operational Safety

Before production releases that involve database/schema changes:

1. Create a complete KFE backup.
2. Validate the release candidate against development/synthetic data.
3. Apply an explicit database migration to production when required.
4. Verify existing real data after the update.
5. Keep a recovery path through KFE backup/restore.

## Relationship to Git Branches

Git branches control source-code development/release flow. They are **not** themselves the data boundary.

The data boundary is enforced by the runtime/environment configuration and separate databases/application identities.

The current working branch at the time this decision was recorded is:

`pr64-work-ui-improvement`

No branch switch, reset, cleanup, or destructive change is implied by this document.
