# KFE — Authoritative Data Model Boundary — Pass 9

**Status:** WORKING DESIGN — NOT FROZEN

## Purpose

Define the minimum authoritative business-record boundary before any physical database schema is implemented.

## Active product scope

1. Work
2. Performance
3. Admin

There is no Timeline product area. OCR is permanently excluded.

## Governing rule

**ONE BUSINESS FACT → ONE AUTHORITATIVE RECORD → ONE PERSISTENCE PATH → MULTIPLE READ REPRESENTATIONS ONLY WHEN NEEDED.**

## Authoritative record families

| Record family | Owning domain | Authority role |
|---|---|---|
| Vehicle | Vehicle/Admin domain | Vehicle identity and lifecycle facts |
| Driver | Admin/driver domain | Driver identity and configuration facts |
| Work session | Work domain | Operational work-session authority |
| Break | Work domain | Break facts within work lifecycle |
| Trip / ride | Work domain | Captured operational trip facts |
| Odometer reading | Work domain | Vehicle movement evidence |
| Fuel record | Fuel domain | Refuelling and fuel-cost facts |
| Maintenance record | Maintenance domain | Maintenance obligation/history facts |
| Loan record | Loan domain | Loan terms and repayment facts |
| Revenue facts | Revenue/financial domain | Revenue inputs and authoritative financial facts |
| Configuration | Owning domain/Admin | Effective-dated configuration facts |

## Derived representations

Performance summaries, financial reports, dashboards, notifications, cached state, read models and projections are not alternate business records. They are reconstructed from authoritative persisted facts through application read paths.

## Write authority

User input → Application use case → Domain validation/rules → Repository contract → Persistence transaction → authoritative local database.

No presentation component, notification, provider, backup file, sync envelope or read model may directly create authoritative business records.

## Calculation authority

Calculations remain owned by the domain that owns the business meaning. A calculated result may be persisted when required for audit/history, but its authoritative inputs and calculation definition remain identifiable and reconstructable.

## Identity and lifecycle

Authoritative records require stable identity and explicit lifecycle semantics appropriate to the record. Corrections, voids and soft deletion preserve historical integrity rather than silently creating competing records.

## Cross-domain rule

A domain may reference another domain's authoritative records through explicit application/repository boundaries, but must not copy those records into a second authoritative store.

## Work-specific boundary

Work owns operational facts including work/session lifecycle, business/personal scope, breaks, trips/rides and odometer facts. Ride values are user-entered or explicitly confirmed and validated before persistence. Optional screenshots are source evidence only.

## Performance boundary

Performance interprets authoritative records. It does not own duplicate revenue, fuel, maintenance, loan or work records merely to display performance.

## Admin boundary

Admin manages configuration and administrative records through application commands/read models. Admin does not become a second persistence authority.

## Explicit non-authorities

- UI state
- form state
- notification payloads
- cached values
- read models/projections
- backup files
- sync envelopes
- cloud-provider records
- database implementation details
- provider SDK state
- synthetic test data
- historical documentation/branches
- screenshots/source evidence

## Open questions before physical schema design

1. Exact field-level record contracts.
2. Stable ID strategy and lifecycle metadata.
3. Cross-record relationship rules.
4. Which derived values, if any, require persisted snapshots for audit/history.
5. Exact transaction boundaries per authoritative write.
6. Backup representation and restore semantics.
7. Sync identity/conflict semantics.

These questions must be resolved before treating a database schema as implementation-ready.
