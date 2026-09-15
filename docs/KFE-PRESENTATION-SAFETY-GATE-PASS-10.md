# KFE — Presentation Safety Gate — Stage 10

**Status:** WORKING DESIGN — NOT FROZEN

## Purpose

This document protects KFE while the presentation architecture and later UI/UX are designed. It prevents presentation decisions from silently changing ERP capability, business meaning, authoritative data, persistence, or historical integrity.

The rule is simple: **design the user-facing experience freely, but never use the presentation layer as an accidental authority for ERP changes.**

## Presentation Non-Destructive Rule

The Presentation layer cannot permanently delete ERP capabilities, authoritative data, business rules, calculations, fields, or persistence requirements.

Presentation changes may:

- Show
- Hide
- Move
- Collapse
- Expand
- Reorder
- Rename presentation labels
- Change navigation location
- Change layout
- Change visual treatment
- Make contextual
- Restore something previously hidden

Therefore, when discussing Shell/UI/UX design, "delete" means remove from the current presentation unless the user explicitly initiates a separate product/domain/data change.

## Capability Removal vs Data Deletion

KFE must keep these operations separate:

- Hide "Loan Payment" → presentation change.
- Remove Loan Payment from a form → presentation change.
- Stop supporting Loan Payments → product/domain change.
- Delete an actual historical Loan Payment record → data/lifecycle operation with its own protected rules.

These operations must never be mixed together.

## Three-Way Change Classification

Every meaningful requested change should first be classified as one or more of these distinct categories:

### 1. Presentation change

Changes how existing ERP capability is exposed to the user.

**Authority:** Presentation.

### 2. Capability / product change

Changes what KFE supports or what a business concept means.

Examples: add Vehicle Sold capability, stop supporting Loan Payments, introduce a new lifecycle state, change a business rule.

**Authority:** Domain/Application/product design as appropriate.

### 3. Data / lifecycle change

Changes an actual authoritative business record or its lifecycle state.

Examples: mark a vehicle as sold, correct a historical record, void/cancel a record, protected deletion where permitted.

**Authority:** Domain/Application through the authoritative repository/persistence path.

**These three categories must never be silently conflated.**

## Authority Resolution Gate

Before implementing a meaningful change, determine:

1. What exactly is changing?
2. Is it presentation, capability, data/lifecycle, application workflow, domain rule, persistence, or infrastructure?
3. Which layer owns that responsibility?
4. Does an authoritative owner already exist?
5. Does another implementation already perform the same responsibility?
6. Does the request require a new capability, or only a new presentation of an existing capability?

**One responsibility → one owner → one authoritative source → one implementation path.**

A presentation request must never create a second business rule, store, repository, calculation, persistence path, or authority merely because the UI needs to represent something.

## Dependency Impact Gate

Before a consequential permanent change, identify what depends on the thing being changed.

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

The depth of analysis should match the impact. Minor presentation changes do not require unnecessary architectural ceremony.

## Historical Integrity Protection

Historical business records must remain reconstructable even when current configuration, lifecycle state, presentation, or supported capabilities change.

A lifecycle change such as **Vehicle Sold** changes the vehicle's current state; it does not erase its historical Work, trips/rides, odometer, fuel, maintenance, loan, revenue, or other authoritative history.

Historical records must not become invalid merely because the current UI or current configuration changes.

## No Silent Semantic Change Gate

Presentation labels may change without changing business meaning.

The underlying business semantics must not change silently.

For example, changing the label "Sold" to "Unavailable" does not automatically mean the domain meaning of Vehicle Sold has changed. If the requested change alters business meaning, it must be treated as a capability/domain change and evaluated at the owning layer.

> **Labels may change. Business semantics may not silently change.**

## No Orphan Capability Gate

Every authoritative capability introduced into KFE must have an intentional path through the architecture:

`Domain capability → Application operation → Authoritative record/state → Repository → Persistence → Read model → Presentation`

Likewise, every user-facing action must map intentionally to an application operation and business meaning.

No capability should exist only as an isolated UI element, and no UI action should exist without a defined business/application purpose.

## Reversibility Awareness Gate

For consequential changes, KFE should identify whether the change is reversible.

Examples:

- Hide a field → normally reversible.
- Move a menu item → normally reversible.
- Change a lifecycle state → requires defined correction/reversal rules.
- Delete historical data → potentially irreversible and therefore protected.
- Stop supporting a capability → major product/domain change.

If a change is irreversible, that fact and its implications must be made clear before proceeding.

## Permanent Change Gate

A permanent removal or semantic change of an ERP capability, business rule, authoritative field, or persisted data must not be inferred from a normal UI/UX instruction.

If a permanent change is proposed, KFE must first identify:

1. What is being removed or changed.
2. What owns it.
3. What depends on it.
4. The effect on calculations, history, reconstruction, persistence and workflows.
5. Whether the change is reversible.
6. Whether existing authoritative records remain valid and reconstructable.
7. Whether backup/restore and future sync are affected.

The implication must be explained to the user briefly and in simple language before proceeding.

## No Silent Product Change Through UI

The UI must never become the mechanism by which KFE accidentally changes the ERP itself.

For example:

> "Remove Vehicle Sold from this screen" = presentation change.

> "Remove Vehicle Sold from KFE" = capability/product change.

The second request must leave the presentation layer and be evaluated by the owning domain/application design.

## No Orphan UI Rule

Every UI field, action, confirmation, status, or control must have an intentional business/application purpose.

A UI element must map to:

`Presentation → Application operation/read model → Business meaning → Authoritative record`

A visual control must not create a hidden private state authority or bypass the Standard Entry System.

## Standard Entry Protection

New authoritative user-entered data must continue through the standard KFE entry path:

`INPUT → STANDARD ENTRY SYSTEM → Input/Shape Validation → Application Validation → Domain/Business Validation → Calculation/Normalization → Confirmation/Commit → Repository Contract → Persistence Transaction → ONE AUTHORITATIVE LOCAL DATABASE`

UI design may change how the user reaches this pipeline, but it cannot bypass it.

## Coverage Protection

Adding, hiding, moving, or simplifying UI must not silently remove ERP-required capability.

Before presentation design is considered complete, verify two-way coverage:

`Business requirement → application operation → form → screen → user action`

and

`User action → application operation → business meaning → authoritative record`

Every authoritative business input, required decision, editable fact, lifecycle action, calculation, validation, confirmation, and required expense input must have an intentional user-facing path unless it is explicitly system-generated, derived, or otherwise intentionally non-user-entered.

## Change Isolation

A presentation change must have the smallest reasonable scope and must not unintentionally alter unrelated presentation or business behavior.

Examples:

- Background change → background/theme scope only unless intentionally global.
- Bottom navigation change → navigation scope; forms and business logic unchanged.
- Work layout change → Performance/Admin unaffected.
- Header change → viewport and bottom navigation unaffected unless explicitly linked.
- One form change → unrelated forms unaffected.
- Global theme change → intentional global propagation is allowed.

Dependencies must be explicit rather than accidental.

## Presentation Replacement / Evolution

The shell, navigation, layout, theme, forms, and screen composition may evolve or be replaced without requiring changes to domain rules, calculations, authoritative records, repository contracts, or persistence architecture.

KFE maintains one unified presentation system, not parallel presentation implementations.

## Business Meaning Before Visual Design

When a user introduces something new, KFE should establish its business meaning before deciding its final visual placement.

Example:

> "Under Vehicles, add Vehicle Sold."

The correct sequence is:

1. Recognize Vehicle Sold as a vehicle lifecycle capability.
2. Check whether the domain/application already supports the required lifecycle concept.
3. Identify affected workflows, calculations, history, persistence and reporting.
4. Define or confirm the authoritative record/state and application operation.
5. Then decide where and how Vehicle Sold appears in the UI.

The UI should expose the ERP capability; it should not invent the ERP capability accidentally.

## User-Directed Information Architecture Remains Valid

After ERP completeness is established, the user may direct how capabilities are organized:

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
