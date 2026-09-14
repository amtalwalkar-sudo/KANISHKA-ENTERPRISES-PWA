# KFE — MD Consolidation Pass 5

**Status:** WORKING DESIGN — NOT FROZEN

## Purpose

Pass 5 follows the Pass 4 ownership matrix and defines the logical architecture and authoritative data flows for the clean rebuild.

## Scope correction retained

KFE has exactly three active product areas:

- Work
- Performance
- Admin

There is no Timeline product area. No Timeline architecture is carried forward.

## Consolidation result

The clean rebuild now has one logical dependency direction:

`Presentation → Application → Domain → Repository Contract → Persistence → One Authoritative Local Database`

External/platform capabilities remain replaceable infrastructure adapters.

## Key boundaries

### Work
Work owns operational collection and lifecycle semantics, including the provider-independent Ride Capture flow. The historical Work UI is not restored.

### Performance
Performance interprets authoritative business facts and presents results. It does not create alternate financial or operational authorities.

### Admin
Admin manages authoritative records through application commands/read models and the universal form boundary. It does not own persistence or business meaning.

### Persistence
One authoritative local database exists per runtime environment. Repository access is the sole persistence boundary for application/domain behavior.

### Providers
OCR/AI, cloud, sync, notifications, native APIs and other external services remain adapters. Provider choice must not enter business meaning.

### Recovery
Authoritative persisted state remains sufficient to reconstruct KFE. Caches, UI state, notifications, OCR output and provider payloads are not authoritative.

## Anti-duplication result

The architecture explicitly rejects:

- multiple shells
- multiple databases
- duplicate repositories
- duplicate calculation engines
- duplicate form systems
- duplicate state authorities
- parallel persistence paths
- provider-specific business logic
- Timeline architecture
- parallel Work implementations
- hidden fallback architectures

## Remaining controlled questions

Physical module/folder structure, repository-contract placement, database technology, backup/restore mechanics, sync mechanics, OCR adapter contract, notification/native boundary, exact Work screen set, and precise calculation ownership remain open until separately validated.

These are not permission to implement competing alternatives.

## Pass 5 conclusion

Pass 5 establishes the logical architecture boundary. It does not freeze implementation technology and does not begin production implementation.
