# KFE — Presentation Safety Gate — Stage 10

**Status:** WORKING DESIGN — NOT FROZEN
**Branch:** `pwa`

## Purpose

This safety gate governs the future KFE shell, UI and UX design phase. It prevents presentation changes from accidentally deleting ERP capability, authoritative business meaning, calculations, data requirements or persistence requirements.

## Core Rule

> **Presentation can subtract visibility, never authority.**

The Shell, UI and UX have no authority to permanently delete ERP capabilities, authoritative data, business rules, calculations, fields, lifecycle requirements or persistence requirements.

## What Presentation May Do

A presentation change may:

- Show
- Hide
- Move
- Collapse
- Expand
- Reorder
- Rename a presentation label
- Change navigation location
- Change layout
- Change visual treatment
- Make content contextual
- Restore something previously hidden

These are reversible presentation decisions.

## Meaning of "Delete" During UI/UX Design

If the user says to delete, remove or get rid of something while designing the Shell/UI/UX, the default interpretation is:

> **Remove it from the current user-facing presentation, not from KFE itself.**

The underlying ERP capability remains available and may be returned to the presentation later.

## Permanent Removal Gate

Permanent removal is not a Shell/UI/UX operation.

If something is proposed for permanent removal from KFE, the change must leave the presentation layer and be evaluated at the appropriate owning layer, such as Application, Domain or Persistence, depending on what is being removed.

Before such a change, KFE must identify:

- What owns the capability.
- What authoritative record is affected.
- What calculations depend on it.
- What workflows depend on it.
- What history/reconstruction depends on it.
- What persistence requirements depend on it.
- What other screens or reports depend on it.

Only then can a permanent product/data/architecture change be considered.

## Simple Implication Warning

When a requested hide/remove action has a meaningful ERP implication, the assistant must explain it briefly and in simple language before applying the presentation change.

Examples:

> ⚠️ **Impact:** This is needed for fuel-cost calculation. Safe option: hide it from the screen and keep it in ERP.

> ⚠️ **Impact:** This is display-only. Hiding it has no ERP impact.

> ⚠️ **Impact:** This action is required to close a shift. Safe option: move it to the Shift menu instead of removing the capability.

The explanation should remain short and practical.

## ERP Capability Preservation

The complete ERP capability set is established first. During UI/UX design, the presentation may then be simplified by hiding, moving, grouping, collapsing or contextualizing items.

A cleaner screen must never be achieved by silently deleting an ERP requirement.

## Data Deletion Is Separate

Presentation hiding is also distinct from deletion of an actual stored business record.

Examples:

- Hide Loan Payment from a screen → presentation change.
- Remove Loan Payment from a form → presentation change.
- Stop supporting Loan Payments → product/domain change.
- Delete an actual historical Loan Payment record → protected data/lifecycle operation.

These must never be treated as the same operation.

## Design-Phase Safety Principle

> **The UI may change aggressively and remain reversible; authoritative ERP capability may not be destroyed by a presentation decision.**

This gate applies when actual Shell/UI/UX design begins and remains in force throughout presentation iteration.
