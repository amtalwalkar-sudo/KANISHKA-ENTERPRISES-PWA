# KFE — Presentation Safety Gate — Stage 10

**Status:** WORKING DESIGN — NOT FROZEN

## Purpose

This document protects KFE while presentation architecture and later UI/UX are designed. It prevents presentation decisions from silently changing ERP capability, business meaning, authoritative data, persistence, or historical integrity.

The rule is simple: **design the user-facing experience freely, but never use the presentation layer as an accidental authority for ERP changes.**

## 1. Change Classification

Every meaningful requested change is first classified as one or more of these distinct categories.

### Presentation change

Changes how existing ERP capability is exposed to the user.

Examples:
- Show / hide
- Move / reorder
- Collapse / expand
- Rename presentation labels
- Change navigation location
- Change layout
- Change visual treatment
- Make contextual
- Restore something previously hidden

**Authority:** Presentation.

### Capability / product change

Changes what KFE supports or what a business concept means.

Examples:
- Add Vehicle Sold capability.
- Stop supporting Loan Payments.
- Introduce a new lifecycle state.
- Change a business rule.

**Authority:** Domain/Application/product design as appropriate.

### Data / lifecycle change

Changes an actual authoritative business record or its lifecycle state.

Examples:
- Mark a vehicle as sold.
- Correct a historical record.
- Void/cancel a record.
- Perform protected deletion where permitted.

**Authority:** Domain/Application through the authoritative repository/persistence path.

These categories must never be silently conflated.

For example:
- Hide “Loan Payment” → presentation change.
- Remove Loan Payment from a form → presentation change.
- Stop supporting Loan Payments → capability/product change.
- Delete an actual historical Loan Payment record → data/lifecycle operation.

## 2. Authority Resolution Gate

Before implementing a meaningful change, determine:

1. What exactly is changing?
2. Is it presentation, capability, data/lifecycle, application workflow, domain rule, persistence, or infrastructure?
3. Which layer owns that responsibility?
4. Does an authoritative owner already exist?
5. Does another implementation already perform the same responsibility?
6. Does the request require a new capability, or only a new presentation of an existing capability?

**One responsibility → one owner → one authoritative source → one implementation path.**

A presentation request must never create a second business rule, store, repository, calculation, persistence path, or authority merely because the UI needs to represent something.

## 3. Change Impact Gate

Before a consequential change, identify what depends on the thing being changed and whether the change is reversible.

At minimum consider:

- calculations
- workflows
- forms and validation
- reports/read models
- historical reconstruction
- persistence
- backup/restore
- future sync
- related lifecycle records
- other product areas
- reversibility / irreversibility

The depth of analysis should match the impact. Minor presentation changes do not require unnecessary architectural ceremony.

For consequential or permanent changes, KFE must identify:

1. What is being removed or changed.
2. What owns it.
3. What depends on it.
4. The effect on calculations, history, reconstruction, persistence and workflows.
5. Whether the change is reversible.
6. Whether existing authoritative records remain valid and reconstructable.
7. Whether backup/restore and future sync are affected.

If a change is irreversible, that fact and its implications must be made clear to the user briefly and in simple language before proceeding.

## 4. Semantic & Historical Integrity

### Business meaning cannot silently change

Presentation labels may change without changing business meaning.

For example, changing the label “Sold” to “Unavailable” does not automatically mean the domain meaning of Vehicle Sold has changed. If the requested change alters business meaning, it is a capability/domain change and must be evaluated at the owning layer.

> **Labels may change. Business semantics may not silently change.**

### Historical records remain reconstructable

Historical business records must remain reconstructable even when current configuration, lifecycle state, presentation, or supported capabilities change.

A lifecycle change such as **Vehicle Sold** changes the vehicle's current state; it does not erase its historical Work, trips/rides, odometer, fuel, maintenance, loan, revenue, or other authoritative history.

Historical records must not become invalid merely because the current UI or current configuration changes.

## 5. Capability & UI Traceability Gate

Every authoritative capability introduced into KFE must have an intentional path through the architecture:

`Domain capability → Application operation → Authoritative record/state → Repository → Persistence → Read model → Presentation`

Every user-facing field, action, confirmation, status, or control must also have an intentional business/application purpose:

`Presentation → Application operation/read model → Business meaning → Authoritative record`

Therefore:

- No capability may exist only as an isolated UI element.
- No UI action may exist without a defined business/application purpose.
- No UI element may create a hidden private state authority.
- No UI action may bypass the Standard Entry System where that pipeline applies.

This gate consolidates the former **No Orphan Capability Gate** and **No Orphan UI Rule**.

## 6. Presentation Non-Destructive Rule

The Presentation layer cannot permanently delete ERP capabilities, authoritative data, business rules, calculations, fields, or persistence requirements.

Presentation design may show, hide, move, collapse, expand, reorder, relabel, contextualize, or relocate existing capability without deleting its underlying ERP authority.

Therefore, when discussing Shell/UI/UX design, **“delete” means remove from the current presentation** unless the user explicitly initiates a separate capability/product or data/lifecycle change.

Permanent removal of an ERP capability, business rule, authoritative field, or persisted data must occur at its owning layer, not through ordinary UI/UX design.

## 7. ERP Coverage Rule

Adding, hiding, moving, or simplifying UI must not silently remove ERP-required capability.

Before presentation design is considered complete, verify two-way coverage:

`Business requirement → application operation → form → screen → user action`

and

`User action → application operation → business meaning → authoritative record`

Every authoritative business input, required decision, editable fact, lifecycle action, calculation, validation, confirmation, and required expense input must have an intentional user-facing path unless it is explicitly system-generated, derived, or otherwise intentionally non-user-entered.

UI/UX may simplify presentation, but simplification must not silently remove the underlying ERP capability.

## 8. Change Isolation

A presentation change must have the smallest reasonable scope and must not unintentionally alter unrelated presentation or business behavior.

Examples:

- Background change → background/theme scope only unless intentionally global.
- Bottom navigation change → navigation scope; forms and business logic unchanged.
- Work layout change → Performance/Admin unaffected.
- Header change → viewport and bottom navigation unaffected unless explicitly linked.
- One form change → unrelated forms unaffected.
- Global theme change → intentional global propagation is allowed.

Dependencies must be explicit rather than accidental.

## 9. Presentation Replacement / Evolution

The shell, navigation, layout, theme, forms, and screen composition may evolve or be replaced without requiring changes to domain rules, calculations, authoritative records, repository contracts, or persistence architecture.

KFE maintains one unified presentation system, not parallel presentation implementations.

This rule protects **independent evolution**. Change Isolation separately protects against **accidental propagation**.

## 10. Standard Entry Rule

New authoritative user-entered data must continue through the existing KFE Standard Entry System:

`INPUT → STANDARD ENTRY SYSTEM → Input/Shape Validation → Application Validation → Domain/Business Validation → Calculation/Normalization → Confirmation/Commit → Repository Contract → Persistence Transaction → ONE AUTHORITATIVE LOCAL DATABASE`

UI design may change how the user reaches this pipeline, but it cannot bypass it.

This is an existing cross-layer architecture rule; Stage 10 does not create a second entry architecture.

## 11. Information Architecture Rule

Business completeness comes first. User-directed organization comes second. Visual design comes third.

When something new is introduced:

1. Establish its business meaning.
2. Check whether the domain/application already supports it.
3. Identify affected workflows, calculations, history, persistence and reporting.
4. Confirm the authoritative record/state and application operation.
5. Then decide where and how it appears in the UI.

After ERP completeness is established, the user may direct how capabilities are organized across:

- header
- viewport
- bottom navigation
- menus
- submenus
- sections
- screens
- forms
- contextual actions
- fixed or scrollable layouts
- hidden/collapsed/expanded presentation

User-directed presentation is authoritative for **presentation organization**, but it does not override domain, application, persistence, or data authority.

## Core Principles

> **Presentation can subtract visibility, never authority.**

> **Capability removal and data deletion are different operations and require different safety controls.**

> **One responsibility → one owner → one authoritative source → one implementation path.**

> **Labels may change. Business semantics may not silently change.**

> **Historical state must remain reconstructable.**

> **No consequential change proceeds without identifying its owner and impact.**

> **No UI action bypasses the authoritative application and persistence path.**

> **No presentation simplification may silently delete ERP capability.**
