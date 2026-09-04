# KFE 2.0 CI Governance — Frozen

## Purpose

KFE uses two validation modes:

1. **Full CI** — the canonical release/freeze gate. It validates the complete application from foundation through browser/runtime verification.
2. **Incremental CI** — the normal development gate after a domain boundary has been frozen. It starts at the earliest validation boundary affected by the changed files and runs every downstream boundary through final verification.

## Non-negotiable rule

Incremental CI may skip only **upstream boundaries proven unaffected by the change**. It must never skip a downstream boundary. A previous green result is not reused as proof for a changed boundary.

If changed files cannot be safely classified, Incremental CI must fall back to Full CI.

## Domain-scoped CI principle

**CI runs are domain-scoped by default.** The active CI run must remain within the currently active/frozen domain and its required downstream validation boundaries. CI must not expand implementation scope into unrelated domains merely because an unrelated check fails.

**Holistic/Full CI may only be initiated when the user explicitly requests a holistic/full CI run**, except where the governance rules above independently require Full CI (for example, an uncertain change classification, shared infrastructure/architecture change, CI governance change, domain freeze, merge, or final release/deployment verification). When Full CI is required by governance, it is a validation requirement, not permission to implement unrelated domain changes.

Unrelated-domain failures must be classified and recorded; they do not authorize scope expansion or changes to unrelated domains.

## Engineering speed principle

KFE must be developed as quickly as technically possible **without weakening correctness, data integrity, architecture, testing, CI, or deployment verification**.

CI efficiency means removing unnecessary validation work, not removing necessary evidence. Incremental CI is the mechanism for avoiding unrelated upstream work while preserving every affected downstream guarantee. Full CI remains the authority at freeze, merge, and release boundaries.

## Universal domain rule

Every KFE domain follows the same lifecycle:

`Audit → Clean replacement → Domain contract → Persistence contract → Application/UI contract → Integration → Incremental CI → Full CI at freeze → Freeze`

Once a domain is frozen, later domain work must not silently alter its frozen contract. If a change crosses a frozen boundary, the affected boundary and all downstream checks run again.

## Boundary order

The current master validation chain is ordered as:

`foundation → governance → architecture → domain/lifecycle → work/geolocation → administrator → persistence/recovery → UI shell → application boundaries → real persistence → runtime syntax/domain → runtime identity/service-worker → browser integration → resilience/offline → final state sync → final build`

This order is the canonical dependency direction for future modules.

## Change classification

Classify changes using repository paths, not commit-message guesses.

- `.github/**`, `package.json`, lockfiles, build/config files, `index.html`, service worker, shared infrastructure, shared domain/application utilities, or unknown paths → **Full CI**.
- `js/domain/<module>.*`, `js/application/<module>*`, module repositories/tests, module UI/tests, and module persistence/tests → start at the earliest boundary touched by that module and run forward.
- Pure test-contract changes are still validated from the boundary they describe; they do not justify skipping the implementation boundary.

## Vehicle example

Vehicle and Driver are currently being rebuilt/frozen as the first clean domain. A Vehicle-only change should not make the developer wait for unrelated upstream foundation checks when those boundaries are unchanged. It must still run the Vehicle/Driver boundary, persistence, UI shell, application, runtime, browser, resilience, synchronization, and final build checks that depend on it.

## Full CI remains mandatory

Run Full CI:

- before declaring a domain frozen,
- before merging a domain freeze,
- after shared infrastructure/architecture changes,
- after CI governance changes,
- when classification is uncertain,
- and for final release/deployment verification.

## Do not weaken contracts

A failure caused by a stale assertion must be corrected at the contract, not bypassed. A genuine regression must stop the incremental chain at the failing boundary until fixed.

## Operational memory

This document is intentionally committed to the repository so future KFE work can use the same CI policy without relying on conversation memory. It is the authoritative development rule for incremental versus full validation.
