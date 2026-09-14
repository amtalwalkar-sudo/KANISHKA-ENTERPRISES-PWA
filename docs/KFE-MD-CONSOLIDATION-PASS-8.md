# KFE MD Consolidation — Pass 8

**Status:** Working consolidation record

## Purpose

Pass 8 establishes contract placement and validation ownership so physical modules do not accidentally duplicate business authority.

## Scope

- Work — active
- Performance — active
- Admin — active
- Timeline — excluded
- OCR — permanently excluded

## Result

Contracts are assigned by responsibility:

- Domain → business meaning, invariants and calculations
- Application → use cases, orchestration, commands and read models
- Repository → persistence capability contracts
- Persistence → database/transaction/repository implementations
- Infrastructure → replaceable platform/external adapters
- Presentation → UI interaction and display contracts only

Validation is explicitly separated into presentation, application, domain and persistence concerns. A business rule must have one authoritative implementation.

## Guardrail

A database schema, provider SDK, notification payload, backup file, sync envelope or read model cannot become a second business authority.

## Next step

Review the contract boundaries and then define the minimum physical module skeleton required for implementation. No production feature implementation begins merely because the skeleton is defined.
