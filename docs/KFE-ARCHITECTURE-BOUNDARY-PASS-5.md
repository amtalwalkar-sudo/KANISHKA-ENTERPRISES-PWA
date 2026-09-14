# KFE — Architecture Boundary — Pass 5

**Status:** WORKING DESIGN — NOT FROZEN

## Purpose

Pass 5 converts the Pass 4 ownership matrix into a clean logical architecture without starting production implementation.

The goal is to define boundaries clearly enough that implementation cannot accidentally create duplicate owners, persistence paths, state authorities, or provider-specific business logic.

## 1. Active product scope

KFE has exactly three active product areas:

- Work
- Performance
- Admin

There is no Timeline product area. Historical Timeline material is not an architectural input for the new build.

## 2. Clean dependency direction

```text
PRESENTATION
    ↓
APPLICATION
    ↓
DOMAIN
    ↓
REPOSITORY CONTRACT
    ↓
PERSISTENCE
    ↓
ONE AUTHORITATIVE LOCAL DATABASE
```

Infrastructure adapters sit at the outside boundary and provide replaceable capabilities such as native APIs, OCR/AI, notifications, backup storage, synchronization transport and network access.

A provider must never become the owner of KFE business meaning.

## 3. Product-area mapping

```text
KFE
├── Work
│   ├── Domain
│   ├── Application
│   └── Presentation
│
├── Performance
│   ├── Domain / calculation definitions
│   ├── Application read models / use cases
│   └── Presentation
│
└── Admin
    ├── Domain rules for managed records
    ├── Application commands / read models
    └── Presentation
```

These are logical ownership boundaries, not separate applications or duplicated technical stacks.

## 4. Authoritative data flow

For a business record:

```text
USER / EXTERNAL INPUT
        ↓
PRESENTATION INPUT
        ↓
APPLICATION USE CASE
        ↓
DOMAIN VALIDATION / RULES
        ↓
REPOSITORY CONTRACT
        ↓
PERSISTENCE TRANSACTION
        ↓
ONE AUTHORITATIVE LOCAL DATABASE
```

Read flow:

```text
AUTHORITATIVE DATABASE
        ↓
REPOSITORY
        ↓
APPLICATION READ MODEL
        ↓
PRESENTATION
```

Presentation state, caches and projections may exist, but none replaces the authoritative record.

## 5. Work data capture

Work owns operational collection and lifecycle semantics.

Ride Capture follows the provider-independent boundary:

```text
SCREENSHOT
   ↓
OCR / MULTIMODAL EXTRACTION ADAPTER
   ↓
KFE EXTRACTION CONTRACT
   ↓
KFE VALIDATION
   ↓
REVIEW / CONFIRMATION
   ↓
WORK APPLICATION USE CASE
   ↓
WORK DOMAIN RULES
   ↓
AUTHORITATIVE PERSISTENCE
```

The OCR/AI provider may be replaced without changing Work business meaning.

## 6. Calculations

Business calculations belong to their authoritative domain/calculation owner.

Performance displays results; it does not create a competing calculation engine.

Derived values must remain reconstructable from authoritative persisted records.

Examples include revenue, cost, profit, break-even, maintenance allocation, ride-derived operational measures and dead KM where applicable.

## 7. Forms and validation

There is one universal form architecture.

Forms collect and present data; they do not become a second business-rule engine.

Validation is placed according to responsibility:

- presentation validation: input shape/usability
- application validation: command/use-case preconditions
- domain validation: business invariants/rules

The same authoritative record flow serves CREATE and EDIT.

Corrections follow:

`Edit → Validate → Recalculate → Save`

## 8. Persistence boundary

There is one authoritative local database per runtime environment.

Repository contracts isolate application/domain meaning from the selected database technology.

Development/test isolation may use a separate environment, but a single runtime must never contain competing databases or stores for the same authority.

## 9. Backup and restore

Backup/restore is one KFE capability behind an infrastructure/provider boundary.

The backup representation must contain everything required to reconstruct the authoritative KFE dataset safely.

Restore must not create a second database or merge competing authorities silently. Replacement/restore semantics must be explicit and validated.

Exact file representation and transaction mechanics remain open design questions.

## 10. Synchronization

Sync is one architecture behind an infrastructure boundary.

The authoritative local dataset remains the local application authority. Sync transports changes between authorized runtimes while preserving identity, idempotency, conflict handling and recoverability.

Exact protocol, outbox/inbox mechanics and conflict policy remain open design questions.

## 11. Provider independence

The following remain replaceable adapters:

- OCR/AI provider
- cloud backup provider
- sync backend/provider
- notification provider
- native/platform implementation
- network/external services

Provider names must not enter domain rules, business calculations or product meaning.

## 12. Recovery invariant

KFE must be recoverable by reconstruction from authoritative persisted state.

No hidden UI state, provider state, cache, notification payload or temporary extraction object may become necessary for authoritative recovery.

## 13. Explicitly rejected architecture

Do not create:

- second shell
- second database
- second repository for the same authority
- second calculation engine
- second form system
- second state authority
- feature-specific persistence path
- provider-specific business logic
- Timeline module
- parallel Work implementation
- hidden fallback architecture

## 14. Open questions before architecture freeze

1. Exact physical folder/module boundaries.
2. Exact Application ↔ Repository contract placement.
3. Local database technology.
4. Backup representation and safe restore transaction.
5. Sync protocol, change log/outbox and conflict semantics.
6. OCR extraction contract and adapter interface.
7. Notification/native adapter contract.
8. Exact Work screen/workflow set.
9. Exact cross-domain calculation ownership for each financial/operational metric.

These are controlled design questions. They do not authorize parallel implementations.

## 15. Pass 5 result

Pass 5 establishes the clean logical architecture and data-flow boundary required before physical implementation design.

It does not freeze technology choices and does not start production implementation.
