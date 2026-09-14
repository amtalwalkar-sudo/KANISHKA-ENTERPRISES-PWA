# KFE 2.0 Architecture Boundary — Working Reference

**Status:** Working architectural reference; not frozen.  
**Authority:** The Master Blueprint governs consolidation and ownership. This file must not introduce a competing architecture.

## Clean dependency direction

```text
Presentation
     ↓
Application
     ↓
Domain
     ↓
Repository Contracts
     ↓
Persistence / Infrastructure
     ↓
ONE AUTHORITATIVE LOCAL DATABASE
```

Infrastructure adapters may connect the local application to platform capabilities and future external services, but providers do not own KFE business meaning.

## Foundation contracts

1. Authoritative records carry stable identity and lifecycle metadata appropriate to the domain.
2. Configuration is effective-dated where historical behavior depends on configuration history.
3. Referential integrity is explicit; orphan references are not authoritative.
4. Idempotency prevents duplicate submission of the same logical operation.
5. Correction/void/restore history preserves authoritative history rather than silently rewriting it.
6. Backup/restore uses a validated, versioned, complete KFE backup representation and safe replacement semantics.
7. Derived state remains reconstructable from authoritative persisted state.
8. Calculation versions may identify a calculation definition without making infrastructure the owner of business formulas.
9. Infrastructure validation remains separate from domain business rules.
10. Calculation outputs must expose an appropriate data-confidence state where required by the domain.
11. Related persistence writes use explicit atomic transaction boundaries where supported.

## Business isolation

Business formulas are not owned by the foundation or UI. Work, Fuel, Expenses, Maintenance, Loans, Revenue and other domains own their own validated calculations through the Domain/Application boundaries.

The UI never becomes the business source of truth. Presentation consumes application-owned read models and commands.

## Persistence authority

KFE must have one authoritative local database **per runtime environment**. Production and development/test environments may be isolated from one another for safety, but neither environment may contain competing databases for the same application authority.

The exact local database technology is an implementation decision behind the persistence boundary. IndexedDB/Dexie may be used, but the business/domain/application layers must not depend on that provider choice.

## Backup / sync / provider independence

Backup, restore, synchronization, OCR/AI, notifications, cloud storage, and other external capabilities are adapters behind explicit KFE boundaries.

No provider name is part of the business architecture. A provider may be replaced without changing KFE business meaning.

## Recovery

Recovery follows the authoritative persisted-state principle:

> KFE must be recoverable by reconstruction from authoritative persisted state.

Restart recovery, process-death recovery, backup consistency, restore safety, atomic operations, calculation reconstruction, provider-failure isolation, network recovery, and sync retry/idempotency must all preserve this principle.

## Historical integrity

Configuration changes are effective-dated where required. Calculation results carry appropriate version/confidence metadata. Restore/recovery rebuilds derived state from authoritative records rather than trusting cached or duplicated calculations.

## Architecture guardrail

If a proposed component creates a second shell, database, repository, calculation engine, form system, state authority, persistence path, or provider-specific business path, stop and raise:

**🔴 DESIGN DRIFT / CONFLICT WARNING**
