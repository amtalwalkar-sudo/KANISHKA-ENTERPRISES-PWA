# KFE — Physical Persistence Boundary — Pass 11

**Status:** WORKING DESIGN — NOT FROZEN

## Purpose

Translate the authoritative data and field contracts into a physical persistence boundary without allowing the database, storage provider, or ORM to become the business architecture.

## Governing rule

**ONE AUTHORITATIVE LOCAL DATABASE PER RUNTIME → ONE PERSISTENCE PATH → MULTIPLE REPOSITORY QUERIES/READ MODELS AS NEEDED.**

## Physical boundary

The physical database is an implementation of KFE persistence. Domain and application code must not depend on database-specific APIs, table names, provider SDKs or storage details.

Conceptual flow:

`Domain/Application → Repository Contract → Persistence Repository → Transaction → Local Database`

## Store ownership

Every authoritative record family has one physical persistence owner. No product area may create a private database, parallel store, shadow repository or feature-specific persistence path.

Work, Performance and Admin therefore share the same authoritative persistence authority.

## Transactions

An authoritative business mutation must complete atomically across the records that constitute one business operation. Partial writes must not leave KFE in a state that cannot be reconstructed from persisted authority.

Transaction boundaries belong to the application operation/persistence boundary, not to individual UI actions or screens.

## Reconstruction

KFE must be recoverable from authoritative persisted state. Caches, read models, notifications and temporary UI state may be discarded and rebuilt.

## Schema responsibility

Physical schema definitions must enforce storage integrity, relationships, uniqueness and required persistence constraints. Business meaning remains owned by the domain.

The schema must not become a second copy of business rules merely because a constraint can be expressed at the database layer.

## Identity

Stable KFE record IDs remain the business identity. Database-generated row identifiers must not replace or redefine them.

## Lifecycle and history

Persistence must support the lifecycle semantics defined by the field-level contracts, including correction/void/deactivation semantics where applicable. Historical records must not be silently overwritten when the domain requires preservation.

## Migration

Schema changes require explicit versioned migrations. A migration must preserve authoritative data and must be reconstructable/testable. No ad-hoc runtime schema mutation.

## Backup and restore

Backup/restore operates against the authoritative persistence boundary. A backup is a recoverable representation of KFE authority, not a second live database authority.

Restore must validate the reconstructed dataset before making it authoritative on the target runtime.

## Future sync

Sync metadata may be stored with authoritative persistence when required, but sync transport/envelopes remain infrastructure/application concerns. Cloud data never becomes a competing local authority.

## Provider independence

The physical database technology is not part of domain/business contracts. Replacing the database or storage provider must not require rewriting business rules or product-area logic.

## Explicit non-owners

- Presentation/UI
- Work/Performance/Admin screens
- form state
- notification payloads
- caches
- read models
- backup files
- cloud records
- sync envelopes
- provider SDK objects
- native APIs
- database-specific APIs outside persistence

## Physical decisions still open

1. Exact local database technology.
2. Exact table/store layout.
3. Index strategy.
4. Exact repository implementation structure.
5. Migration mechanism/version format.
6. Backup file format and encryption policy.
7. Sync metadata fields and conflict protocol.
8. Test database/isolation strategy.

These are implementation choices behind the boundary and should be selected once the implementation gate confirms that they do not introduce duplicate authority.
