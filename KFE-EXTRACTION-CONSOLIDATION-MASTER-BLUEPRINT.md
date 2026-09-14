# KFE — Extraction, Consolidation & Master Blueprint

**Status:** WORKING BLUEPRINT — FREEZE READY — AWAITING USER APPROVAL

## 1. Purpose

This document governs the clean rebuild of KFE. Historical repositories, branches, documents and code are **source material / evidence, not architectural authority**.

We extract validated requirements, rules, calculations and principles; resolve conflicts; remove duplicates; assign ownership; and build one new authoritative KFE.

## 2. Fundamental rule

> **ONE RESPONSIBILITY → ONE OWNER → ONE AUTHORITATIVE SOURCE → ONE IMPLEMENTATION PATH**

No responsibility may acquire a second owner merely because historical material contains another implementation.

## 3. Extraction rules

- Valid business requirement → preserve.
- Frozen business rule → preserve.
- Valid calculation → preserve under its authoritative owner.
- Valid architectural principle → preserve the principle, not the old implementation.
- Old implementation detail → do not automatically carry forward.
- Historical proposal/experiment → historical only unless explicitly accepted.
- Superseded decision → do not resurrect.
- Duplicate → consolidate into one authoritative concept.
- Conflict → mark **🔴 DESIGN DRIFT / CONFLICT WARNING** and resolve against explicit KFE decisions.

## 4. Historical priority

When sources conflict, priority is:

1. Explicit KFE decisions
2. Explicitly frozen decisions
3. Validated business requirements
4. Validated business rules
5. Validated calculations
6. Approved architectural principles

Unresolved conflicts remain open questions; they are never silently converted into architecture.

## 5. Consolidation flow

```text
HISTORICAL MATERIAL
      ↓
IDENTIFY → CLASSIFY → EXTRACT → VALIDATE
      ↓
RESOLVE CONFLICTS → REMOVE DUPLICATES → ASSIGN OWNERSHIP
      ↓
PLACE IN BLUEPRINT → STATUS
```

## 6. Active product scope

KFE currently contains exactly:

1. **Work** — operational work/session/trip/ride/real-world collection.
2. **Performance** — interpretation, reporting and business-position views.
3. **Admin** — configuration and administrative management.

There is **no Timeline product area**.

## 7. Permanent exclusions

**OCR is permanently excluded.** KFE has no OCR engine, OCR provider, screenshot-extraction pipeline, AI extraction contract or OCR fallback.

Screenshots, if retained, are optional source evidence only and never business authority.

The following are also rejected:

- multiple shells
- multiple databases
- duplicate stores
- duplicate repositories
- duplicate calculation engines
- duplicate form systems
- duplicate state authorities
- UI-owned business logic
- provider-specific domain logic
- parallel persistence paths
- hidden fallback implementations
- duplicate backup mechanisms
- duplicate sync mechanisms
- feature-specific private architectures
- parallel Work implementations
- historical code copied wholesale

## 8. Blueprint architecture

```text
KFE
│
├── PRESENTATION
│   ├── Shell
│   ├── Layouts
│   ├── Forms
│   ├── Work
│   ├── Performance
│   └── Admin
│
├── APPLICATION
│   ├── Use cases / actions / workflows
│   ├── Read models
│   ├── Backup / restore orchestration
│   └── Sync orchestration
│
├── DOMAIN
│   ├── Work
│   ├── Performance/business interpretation
│   ├── Vehicle
│   ├── Fuel
│   ├── Maintenance
│   ├── Loans
│   ├── Revenue
│   └── Shared business rules where genuinely shared
│
├── REPOSITORY CONTRACTS
│
├── PERSISTENCE
│   ├── Repositories
│   ├── Transactions
│   ├── Migrations
│   └── ONE AUTHORITATIVE LOCAL DATABASE PER RUNTIME
│
└── INFRASTRUCTURE
    ├── Native / Capacitor
    ├── Notifications
    ├── Backup storage
    ├── Sync transport
    └── Network / external providers
```

These are ownership boundaries, not permission to create every directory or a stack per product area.

## 9. Ownership

| Responsibility | Owner |
|---|---|
| Shell / layouts / screens / form interaction | Presentation |
| Presentation state | Presentation |
| Use cases / workflows / actions | Application |
| Business entities / invariants / rules | Domain |
| Authoritative calculations | Owning domain |
| Repository capability contracts | Repository boundary |
| Database access / transactions | Persistence |
| Authoritative persisted data | One local DB/runtime |
| Backup/restore orchestration | Application + persistence/infrastructure boundary |
| Sync orchestration | Application + persistence/infrastructure boundary |
| Native capability | Infrastructure/native boundary |
| External provider adapters | Infrastructure |

## 10. Data authority

> **ONE BUSINESS FACT → ONE AUTHORITATIVE RECORD → ONE PERSISTENCE PATH → MULTIPLE READ REPRESENTATIONS ONLY WHEN NEEDED.**

Authoritative record families include vehicle, driver, work session, break, trip/ride, odometer, fuel, maintenance, loan, revenue and configuration.

Performance summaries, dashboards, notifications, caches, read models, backups and sync envelopes are representations or transport artifacts, not alternate business authorities.

## 11. Write and read paths

```text
INPUT → PRESENTATION → APPLICATION → DOMAIN → REPOSITORY → PERSISTENCE → ONE LOCAL DB

ONE LOCAL DB → REPOSITORY → APPLICATION READ MODEL → PRESENTATION
```

No UI, notification, provider, backup, sync envelope or cache may bypass authoritative application/domain/persistence boundaries.

## 12. Provider independence

Database, backup, sync, native and external providers are replaceable implementation concerns.

KFE business/domain/application meaning must not depend on provider SDKs or cloud records.

## 13. Forms and validation

One universal form system owns presentation form behavior.

Validation ownership is separated:

- Presentation → input shape/usability.
- Application → workflow/precondition checks.
- Domain → business invariants/rules.
- Persistence → storage integrity constraints.

The same business rule must not be independently implemented in multiple layers.

## 14. Persistence and recovery

KFE uses one authoritative local database per runtime and one persistence path per business fact.

Authoritative mutations are atomic. Schema changes use explicit versioned migrations. Backup/restore operates through the persistence boundary. Future sync may transport changes but never creates a competing local authority.

> **KFE must be recoverable by reconstruction from authoritative persisted state.**

## 15. Historical boundary

Old repositories, branches, specifications, UI implementations, database designs and provider experiments remain evidence only. They become active only after explicit extraction, validation and placement into this blueprint.

## 16. Change rule

If new work appears not to fit the blueprint, stop first and determine whether it is:

- a missing requirement
- a missing responsibility
- a new architectural concern
- an implementation detail
- obsolete material
- duplication of an existing responsibility

Conflicts with accepted decisions require **🔴 DESIGN DRIFT / CONFLICT WARNING**.

## 17. Implementation gate

Before creating any component, answer:

1. What responsibility does it own?
2. Who already owns that responsibility?
3. Is another component already doing it?
4. What is its authoritative data source?
5. Which boundary owns it?
6. Is its contract defined?
7. Is the decision accepted or still open?
8. Does it create a duplicate path?
9. Does it introduce provider lock-in?
10. Can it be replaced without changing KFE business meaning?

If unclear, do not implement yet.

## 18. Current implementation readiness

Passes 9–11 established the authoritative data model, field-level contract principles and physical persistence boundary.

Pass 12 confirms the architecture is **FREEZE READY — AWAITING USER APPROVAL**.

The exact database technology, physical schema, indexes, migration tooling, backup format/provider, sync conflict mechanics, native adapters and remaining exact field types are implementation selections behind these boundaries; they are not competing architectures.

## 19. Freeze rule

```text
WORKING → REVIEWED → COMPLETE ENOUGH → FREEZE READY → USER APPROVAL → FROZEN
```

Nothing becomes frozen automatically. Explicit user approval is required.

## 20. Rebuild principle

We are not cleaning up the old KFE. We are using the old KFE as evidence to build a new, clean KFE.

Historical material does not determine the new shape.

## Final principle

> **No duplicates. No competing authorities. No silent drift. No OCR. No Timeline. One responsibility, one owner, one authoritative source, one implementation path.**
