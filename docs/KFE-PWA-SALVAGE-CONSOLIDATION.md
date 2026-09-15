# KFE — PWA Salvage & Consolidation

**Status:** WORKING CONSOLIDATION — `pwa` branch

## Purpose

This document records the salvage boundary for rebuilding KFE from the historical PWA and local project material. The old implementation is evidence, not architectural authority.

## Sources reviewed / carried forward

- Frozen KFE Master Blueprint and Pass 1–12 architecture decisions.
- Historical PWA implementation and documentation on `KANISHKA-ENTERPRISES-PWA`.
- Local-project material available in the KFE project/library, including the frozen implementation baseline, legacy HTML/JS implementation, business-logic spreadsheet, and prior specifications.
- Existing Android/Capacitor material is retained as salvage evidence for the later Stage 15 infrastructure work.

## Salvage method

1. Preserve validated business nouns, requirements, rules, calculations and lifecycle concepts.
2. Preserve useful implementation knowledge only when it fits the frozen architecture.
3. Consolidate duplicate concepts into one authoritative owner.
4. Reject historical implementation structure when it conflicts with the new architecture.
5. Mark obsolete or conflicting material as historical; do not recreate it.

## Permanent exclusions

- OCR and screenshot extraction: permanently excluded.
- Timeline as a product area: excluded.
- Multiple shells, stores, databases, repositories, calculation engines or form systems: excluded.
- UI-owned business rules: excluded.
- Provider-specific domain/application logic: excluded.
- Parallel persistence authorities: excluded.

## Salvaged business areas

- Work/day/shift lifecycle.
- Business and personal activity classification.
- Trip/ride records and operator/status/revenue facts.
- Odometer and vehicle movement.
- Fuel/refuelling and efficiency concepts.
- Maintenance and maintenance provisions.
- Loans, amortization, payments and EMI provision.
- Compliance and validity/expiry handling.
- Revenue and profitability interpretation.
- Target/reference concepts.
- Vehicle and driver lifecycle.
- Backup/restore, offline resilience and future sync requirements.
- Android/Capacitor capability requirements for later infrastructure work.

## Important reconciliation

Historical material contains older OCR, Timeline and implementation-specific architecture. Those items are not carried forward. The frozen Master Blueprint governs the consolidation.

The result is not a cleaned-up copy of the old PWA. It is a new KFE model reconstructed from validated evidence.
