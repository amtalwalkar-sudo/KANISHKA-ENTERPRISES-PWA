# KFE — Physical Module Boundary — Pass 7

**Status:** WORKING DESIGN — NOT FROZEN

## Purpose

Pass 7 translates the approved logical ownership model into a physical module/folder boundary without starting production implementation.

The physical structure must express ownership rather than create new ownership.

## Active product scope

KFE contains exactly three active product areas:

1. Work
2. Performance
3. Admin

There is no Timeline product area.

OCR is permanently excluded from KFE. No OCR engine, provider, extraction pipeline, OCR contract or OCR fallback may be introduced.

## Governing physical rule

> ONE RESPONSIBILITY → ONE MODULE OWNER → ONE AUTHORITATIVE PATH.

A folder or module is not created merely because a feature needs access to something. New modules require a distinct responsibility that is not already owned elsewhere.

## Proposed logical-to-physical structure

```text
src/
├── presentation/
│   ├── shell/
│   ├── layouts/
│   ├── forms/
│   ├── work/
│   ├── performance/
│   └── admin/
│
├── application/
│   ├── work/
│   ├── performance/
│   ├── admin/
│   ├── backup-restore/
│   └── sync/
│
├── domain/
│   ├── work/
│   ├── performance/
│   ├── vehicle/
│   ├── fuel/
│   ├── maintenance/
│   ├── loans/
│   ├── revenue/
│   └── shared-rules/
│
├── repository/
│   └── contracts/
│
├── persistence/
│   ├── database/
│   ├── transactions/
│   └── repositories/
│
└── infrastructure/
    ├── native/
    ├── notifications/
    ├── backup-storage/
    ├── sync-transport/
    └── network/
```

This is a boundary proposal, not permission to create all directories immediately.

## Ownership rules

### Presentation
Owns rendering, navigation, screen state, form interaction and display formatting.

Presentation does not own business rules, calculations, authoritative records or direct database access.

### Application
Owns use cases, commands, orchestration and application-level validation/preconditions.

Application does not duplicate domain rules or create alternate persistence paths.

### Domain
Owns business meaning, entities, invariants and authoritative business calculations.

A business calculation belongs to exactly one authoritative domain/calculation owner.

### Repository
Owns contracts through which application/domain-facing code accesses persistence capabilities.

There must not be competing repository interfaces for the same authoritative responsibility.

### Persistence
Owns database access, transactions and reconstruction of authoritative persisted state.

There is one authoritative local database per runtime environment.

### Infrastructure
Owns replaceable platform/external adapters only.

Infrastructure must not contain KFE business meaning.

## Product-area rule

Work, Performance and Admin are product areas, not independent technical stacks.

They may have feature-specific presentation/application/domain modules, but they share the same authoritative persistence and repository architecture.

## Explicit exclusions

Do not create:

- second shell
- second database
- second repository for the same authority
- second calculation engine
- second form system
- feature-specific database/store
- feature-specific persistence path
- provider-specific business module
- OCR/AI module
- Timeline module
- parallel Work implementation
- hidden fallback module

## Open physical-design questions

1. Exact names for the physical folders.
2. Whether shared-rules needs a physical module or remains distributed within owning domains.
3. Exact Application ↔ Repository contract placement.
4. Exact persistence repository implementation arrangement.
5. Exact testing/golden-vector folder boundary.
6. Whether backup/restore and sync are application modules or cross-cutting application services with infrastructure adapters.
7. Exact Work screen set.

These remain design questions. No production module should be created solely to resolve them before review.
