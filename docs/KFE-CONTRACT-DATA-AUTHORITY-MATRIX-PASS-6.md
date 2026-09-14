# KFE — Contract & Data Authority Matrix — Pass 6

**Status:** WORKING DESIGN — NOT FROZEN

## 1. Scope

KFE has exactly three active product areas:

1. Work
2. Performance
3. Admin

There is no Timeline product area.

## 2. Governing data rule

> ONE BUSINESS FACT → ONE AUTHORITATIVE RECORD → ONE PERSISTENCE PATH → MULTIPLE READ REPRESENTATIONS ONLY WHEN NEEDED.

UI state, OCR output, notification payloads, caches, projections, backup payloads and sync payloads are representations. They are never competing business authorities.

## 3. Contract matrix

| Capability | Business authority | Write owner | Read consumer | Representation allowed |
|---|---|---|---|---|
| Work/session lifecycle | Work Domain | Work Application | Work/Performance | Read models/events |
| Business/personal scope | Work Domain | Work Application | Work/Performance | Read models |
| Break handling | Work Domain | Work Application | Work/Performance | Read models |
| Trip/ride record | Work Domain | Work Application | Work/Performance | Read models |
| Ride screenshot extraction | KFE Ride Capture contract + Work validation | Application after validation | Work | OCR/provider output only as untrusted input |
| Odometer facts | Work Domain | Work Application | Work/Performance/calculations | Read models |
| Revenue | Owning financial/domain calculation | Application use case | Performance/Admin | Calculated read models |
| Fuel | Fuel domain/calculation | Application use case | Performance/Admin | Calculated read models |
| Maintenance | Maintenance domain | Application use case | Performance/Admin | Calculated read models |
| Loans | Loan domain | Application use case | Admin/Performance | Calculated/read models |
| Vehicle/driver/settings | Owning Admin-managed domain | Admin Application | Admin/other consumers | Read models |
| Configuration history | Owning domain | Admin Application | Domain/Application | Effective-dated read models |
| Backup | Persistence authority | Backup Application boundary | Restore process | Complete versioned backup representation |
| Sync | Persistence authority | Sync boundary | Local application | Transport envelopes only |
| OCR/AI provider | Infrastructure adapter | Adapter only | Ride Capture contract | Extracted candidate data |
| Notifications | Notification boundary | Application/infrastructure | User | Notification payload |

## 4. Write path

Normal authoritative business write:

```text
UI / external input
      ↓
Application command/use case
      ↓
Domain validation + business rules
      ↓
Repository contract
      ↓
Persistence transaction
      ↓
ONE authoritative local database
```

External providers never write business records directly.

## 5. Read path

```text
ONE authoritative local database
      ↓
Repository
      ↓
Application read model/use case
      ↓
Presentation
```

Read models may be optimized or shaped for screens but must remain reconstructable and must not become a second authority.

## 6. Ride Capture boundary

```text
Screenshot
   ↓
Replaceable multimodal extraction provider
   ↓
KFE extraction contract
   ↓
KFE validation / normalization
   ↓
Work application use case
   ↓
Work domain rules
   ↓
Repository
   ↓
Authoritative local record
```

The provider is replaceable. Provider output is not authoritative until accepted through KFE validation.

## 7. Calculation boundary

A business calculation has one authoritative definition in its owning domain/calculation area.

Performance does not recalculate a competing version merely to display a number. UI formatting is not a calculation authority.

Derived values must be reconstructable from authoritative persisted facts.

## 8. Form boundary

Forms are presentation/application entry points. They collect and present data, invoke authoritative validation/use cases, and display results.

Forms do not create alternate persistence paths or duplicate business rules.

## 9. Backup and restore

Backup captures the complete recoverable KFE authority through the persistence boundary.

Restore must validate the backup representation before safe replacement and must preserve the reconstruction invariant.

Provider-specific cloud storage is an adapter, not the KFE backup authority.

## 10. Sync

Sync transports changes between authorized KFE runtimes while preserving local authority, stable identity, idempotency and conflict rules.

Sync payloads are not an additional database.

The exact protocol/outbox/inbox implementation remains open until explicitly designed and frozen.

## 11. Non-authoritative representations

The following can represent business facts but can never own them:

- UI state
- form state
- OCR provider output
- notification content
- cached values
- read models/projections
- backup files
- sync envelopes
- cloud provider records
- test/synthetic data
- historical documents or branches

## 12. Duplicate-creation guardrail

Creating a second component is a design error when it performs an already-owned responsibility.

Raise:

**🔴 DESIGN DRIFT / CONFLICT WARNING**

before adding a second database, repository, calculation engine, form framework, state authority, persistence path, shell, or provider-specific business implementation.

## 13. Open questions

1. Exact physical module/folder layout.
2. Exact repository interface placement.
3. Local database technology.
4. Transaction implementation.
5. Backup format/versioning details.
6. Sync conflict/outbox/inbox mechanics.
7. OCR extraction schema and adapter interface.
8. Notification/native adapter interface.
9. Exact Work screen/workflow set.

These are design decisions still to be reviewed; they do not authorize parallel implementations.
