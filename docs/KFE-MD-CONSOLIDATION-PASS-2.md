# KFE MD Consolidation — Pass 2

**Status:** Working consolidation record  
**Branch:** `kfe-md-consolidation-pass2`  
**Purpose:** Record the second GitHub-side sorting/consolidation pass without turning historical material into new architecture authority.

## Pass 2 rules applied

1. Keep one authoritative document/contract per responsibility.
2. Remove references to documents already consolidated/deleted.
3. Resolve direct documentation conflicts against the active presentation boundary and current clean-baseline direction.
4. Preserve historical evidence rather than copying it into the active architecture.
5. Do not freeze new architecture decisions during consolidation.

## Changes

### 1. Screen contract — corrected stale Timeline references

`docs/KFE-SCREEN-CONTRACT.md` contained `View Timeline` and month-level Timeline presentation references even though `docs/KFE-PRESENTATION-BOUNDARY.md` explicitly states that Work and Timeline presentation surfaces were removed from the current shell.

**Resolution:** remove the retired Timeline presentation references while retaining month-aware activity as a presentation concept that is derived from authoritative records.

This prevents the screen contract from accidentally restoring the retired Timeline UI.

### 2. Universal form standard — corrected deleted-contract reference

`docs/KFE-UNIVERSAL-FORM-STANDARD.md` still referred to the deleted `KFE-UNIVERSAL-MISTAKE-RECOVERY-CONTRACT.md`.

**Resolution:** all recovery references now point to the single canonical `KFE-UNIVERSAL-FORM-ACTION-RECOVERY-RULES-FROZEN.md` contract created by Pass 1 consolidation.

### 3. Architecture boundary — retained

The provider-neutral `js/ARCHITECTURE.md` produced by Pass 1 is retained. It is a working reference, not a competing or frozen architecture.

### 4. Specification and presentation authority — retained

The following remain active authorities:

- `spec/KFE-SPECIFICATION.md` — current business/specification authority.
- `docs/AI-ENGINEERING-CONTRACT.md` — engineering/governance contract.
- `docs/KFE-PRESENTATION-BOUNDARY.md` — presentation boundary.
- `docs/KFE-SCREEN-CONTRACT.md` — current production screen contract.
- `docs/KFE-UNIVERSAL-FORM-STANDARD.md` — universal form contract.
- `docs/KFE-UNIVERSAL-FORM-ACTION-RECOVERY-RULES-FROZEN.md` — frozen recovery authority.
- `js/pwa/RESILIENCE.md` — PWA resilience boundary.

### 5. Historical documents — not promoted

Audit documents, phase validation documents, PR64 implementation notes, and other historical material remain evidence/history. They are not copied into the active architecture merely because they contain useful wording.

PR64-specific decisions such as production/development data isolation and the Performance financial-day rule remain useful extracted knowledge, but they require placement into their appropriate authoritative business/domain contracts before implementation. They are not silently promoted to architecture authority by this pass.

## Explicit conflict resolved

**🔴 DESIGN DRIFT / CONFLICT WARNING — RESOLVED**

The Screen Contract's retired Timeline navigation conflicted with the Presentation Boundary's clean-shell rule. The Presentation Boundary and clean-baseline direction are authoritative for the current presentation surface, so the stale Timeline references were removed rather than restoring Timeline.

## Pass 2 result

The active documentation set now has:

- one recovery authority;
- one form standard pointing to that authority;
- one clean presentation boundary;
- one screen contract consistent with the presentation boundary;
- one provider-neutral working architecture reference;
- one specification authority;
- historical documents kept as evidence rather than competing active specifications.

The Master Blueprint remains **WORKING / NOT FROZEN**.

## Next pass candidates

- Audit `FOUNDATION-AUDIT`, `IMPLEMENTATION-AUDIT`, and `PHASE-I-N-VALIDATION-AUDIT` for requirements that are still absent from the active contracts.
- Consolidate Timeline/future-capability wording without reviving retired UI.
- Review financial/business contracts for duplicate ownership of calculations.
- Continue identifying historical implementation details that should be deleted rather than carried forward.
