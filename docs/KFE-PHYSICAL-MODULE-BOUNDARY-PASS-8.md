# KFE — Contract Placement Boundary — Pass 8

**Status:** WORKING DESIGN — NOT FROZEN

## Purpose

Pass 8 resolves the next physical-boundary question: where contracts live and which layer owns each interface.

This pass does not create production modules or choose a database/provider.

## Governing rule

> A contract belongs with the responsibility it protects, not with the technology that implements it.

The implementation may change behind the contract without moving business ownership.

## Contract ownership

### Domain contracts
Domain owns contracts that express business meaning, invariants and calculations.

Examples:
- Work lifecycle rules
- business/personal scope rules
- trip/ride invariants
- odometer rules
- revenue/fuel/maintenance/loan business calculations

These contracts must not mention UI frameworks, browser storage, Capacitor, cloud vendors or transport protocols.

### Application contracts
Application owns use-case and orchestration contracts.

Examples:
- commands/actions
- use-case inputs and results
- application read models
- validation/precondition outcomes
- backup/restore application operations
- synchronization application operations

Application contracts coordinate domain and persistence; they do not redefine domain formulas.

### Repository contracts
Repository contracts define the persistence capabilities required by application/domain-facing code.

They describe operations against authoritative KFE records, not database-specific APIs.

No UI component may bypass these contracts to access the database.

### Persistence implementation contracts
Persistence owns implementation details for transactions, database adapters and repository implementations.

These must remain behind repository boundaries.

### Infrastructure contracts
Infrastructure boundaries cover replaceable platform/external capabilities such as:
- native platform services
- notifications
- backup storage
- synchronization transport
- network access

They cannot become business authorities.

## Read-model rule

Read models are application-facing representations derived from authoritative persisted records.

Performance and Admin may consume different read models for presentation needs, but those read models do not become separate data authorities.

## Validation ownership

Validation is split by meaning:

- presentation validation: input shape/usability only
- application validation: use-case preconditions and workflow checks
- domain validation: business invariants and business rules
- persistence validation: storage/integrity constraints

The same business rule must not be implemented independently in multiple layers.

## Error/result boundary

Failures should cross boundaries as explicit typed application/domain outcomes rather than UI-specific exceptions or database-provider errors becoming business semantics.

Infrastructure/provider failures remain infrastructure/application concerns and must not redefine domain meaning.

## Explicit non-ownership

The following never own business contracts:

- UI components
- notification payloads
- cached/read-model copies
- backup files
- sync envelopes
- database tables/stores
- provider SDKs
- native APIs
- historical documents

## Current open questions

1. Exact TypeScript module naming.
2. Exact location of shared domain primitives, if any.
3. Exact repository interface granularity.
4. Exact application read-model structure.
5. Exact backup/sync contract details.
6. Exact test/golden-vector placement.

No implementation freeze is implied by this pass.
