# KFE — Ownership Matrix — Pass 4

**Status:** WORKING DESIGN — NOT FROZEN
**Purpose:** Establish one authoritative owner for each KFE responsibility before implementation begins.

## 1. Scope

The current KFE product contains exactly three active product areas:

1. **Work**
2. **Performance**
3. **Admin**

There is no Timeline product area in the current KFE scope. Historical Timeline material is reference evidence only and must not be recreated.

## 2. Product-area ownership

| Product area | Authoritative responsibility | Domain authority | Application authority | Presentation authority |
|---|---|---|---|---|
| Work | Operational work/session/trip/ride-capture lifecycle and real-world collection | Work domain | Work use cases/workflows | New Work UI built from current contracts; old UI is not authoritative |
| Performance | Business-position interpretation and performance reporting | Performance calculation/rule definitions | Performance read models/use cases | Performance screens |
| Admin | Configuration and back-office management | Domain rules for each managed record | Admin commands/read models | Admin screens |

Product areas do not create separate databases, repositories, calculation engines, form systems, or persistence paths.

## 3. Cross-cutting ownership

| Responsibility | One authoritative owner | Notes |
|---|---|---|
| Business entities | Domain | Product-specific entities belong to their owning domain |
| Business rules/invariants | Domain | UI and infrastructure cannot redefine them |
| Calculations | Domain | One authoritative calculation definition per business calculation |
| Use cases/workflows/actions | Application | Orchestrates domain operations without becoming business-rule authority |
| Read models/projections | Application/Presentation boundary | Derived for presentation; never competing source of truth |
| Persistent business records | One authoritative local persistence authority | No duplicate stores for the same business authority |
| Database access | Persistence | Hidden behind repository/persistence boundary |
| Repository contracts | Application/Persistence boundary | Exact split remains a working design until frozen |
| UI state | Presentation | Must not become persisted business authority |
| Shell | One authoritative shell | No second shell or feature-specific shell |
| Layout system | One authoritative layout system | Feature screens reuse it |
| Forms | One authoritative universal form system | Business-specific fields sit within the shared form boundary |
| Validation | Authoritative domain/application validation according to rule type | No duplicate validation authority in UI |
| Backup/restore | One KFE backup/restore mechanism behind provider adapters | Complete recoverable KFE representation |
| Sync | One synchronization architecture behind provider adapters | Must preserve authoritative local records and idempotency |
| OCR/AI extraction | KFE extraction contract + replaceable infrastructure provider | Provider never owns business meaning |
| Notifications | One notification boundary | UI does not become a second notification system |
| Native/Android capability | Capacitor/native boundary | Provider/platform details stay outside domain |
| External cloud services | Infrastructure adapters | Replaceable; no business meaning owned externally |
| Testing/golden vectors | Contract/test layer appropriate to the responsibility | Tests enforce authority; they do not create parallel implementation paths |

## 4. Work ownership

Work is active and must not be interpreted as retired merely because the historical Work UI was removed.

Authoritative Work responsibilities include, where applicable:

- work/session lifecycle
- business/personal scope
- break handling
- trip/ride records
- ride capture and extraction workflow
- operational timestamps/events
- odometer-related operational facts
- validated ride-derived inputs used by downstream calculations

The old Work presentation implementation is historical evidence. A clean Work UI is a future implementation task under the same authoritative Work domain/application contracts.

## 5. Performance ownership

Performance is an interpretation/reporting surface over authoritative records.

Performance must not create alternate business records for revenue, cost, profit, break-even, fuel, maintenance, loans, or other financial facts.

Where a value is a business calculation, its authoritative definition remains in the appropriate domain/calculation owner. Performance consumes the resulting application-owned read model.

Personal use remains excluded from business financial calculations according to the current specification.

## 6. Admin ownership

Admin is the back-office management surface.

Admin presentation does not own business rules or persistence. It invokes application commands/read models for:

- Vehicle
- Driver
- Finance read-only views
- Renewals
- Maintenance
- Loans
- Settings

Each managed record type has one authoritative application-bound form boundary and one persistence path.

## 7. Persistence authority

KFE has one authoritative local database per runtime environment.

Development/test isolation is allowed for safety, but a single runtime must never contain competing databases or stores representing the same KFE authority.

Backup, restore, and sync must operate through the authoritative persistence boundary rather than introducing parallel data authorities.

## 8. Data-authority rule

For every important business fact:

```text
ONE BUSINESS FACT
      ↓
ONE AUTHORITATIVE RECORD
      ↓
ONE PERSISTENCE PATH
      ↓
MULTIPLE READ PROJECTIONS ONLY WHEN NEEDED
```

OCR extraction, forms, UI state, notifications, projections, caches, backup representations, and sync payloads may carry representations of a fact, but none becomes a competing authority.

## 9. Provider boundaries

Providers are adapters only.

```text
KFE DOMAIN
    ↓
KFE APPLICATION / CONTRACT
    ↓
INFRASTRUCTURE ADAPTER
    ↓
PROVIDER
```

This applies to OCR/AI, cloud storage, synchronization, notifications, Android/native APIs, and future external services.

## 10. Explicit non-owners

The following are never authoritative owners of KFE business meaning:

- UI components
- browser storage APIs directly
- notification payloads
- OCR provider output before KFE validation
- cloud provider records
- sync transport payloads
- cached/read-model data
- historical documents
- historical branches
- test fixtures/synthetic data

## 11. Rejected duplicate patterns

Do not create:

- second shell
- second database
- duplicate store authority
- duplicate repository
- duplicate calculation engine
- duplicate form system
- duplicate state authority
- duplicate validation path
- feature-specific persistence path
- provider-specific business path
- hidden fallback implementation
- Timeline module or Timeline architecture

## 12. Open design questions before freeze

The following remain to be validated before this matrix can become frozen:

1. Exact physical folder/module boundaries for Domain, Application, Presentation and Persistence.
2. Exact repository-contract placement between Application and Persistence.
3. Exact local database technology.
4. Exact backup representation and restore transaction strategy.
5. Exact sync protocol/outbox/inbox mechanics.
6. Exact OCR extraction contract and provider adapter shape.
7. Exact notification/native adapter boundary.
8. Exact Work presentation screen set and workflow layout.

These are design questions, not invitations to create parallel implementations.

## 13. Pass 4 conclusion

Pass 4 moves KFE from document-family consolidation toward explicit responsibility ownership.

The key scope correction is:

> **Work + Performance + Admin are the active KFE product areas. There is no Timeline product area.**

The old Work UI is not restored. Work remains active at the product/domain/application level and receives a clean presentation implementation later from the current contracts.

The matrix is **FREEZE READY only after the remaining ownership questions are reviewed and explicitly approved**.
