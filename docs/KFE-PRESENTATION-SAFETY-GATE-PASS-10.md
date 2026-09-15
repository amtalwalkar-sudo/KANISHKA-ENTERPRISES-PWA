# KFE — Presentation Safety Gate — Stage 10

**Status:** WORKING DESIGN — NOT FROZEN

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

## Permanent Change Gate

A permanent removal of an ERP capability, business rule, authoritative field, or persisted data must not be inferred from a normal UI/UX instruction.

If a permanent change is proposed, KFE must first identify:

1. What is being removed.
2. What owns it.
3. What depends on it.
4. The effect on calculations, history, reconstruction, persistence and workflows.
5. Whether the change is reversible.

The implication must be explained to the user briefly and in simple language before proceeding.

## Core Principle

> **Presentation can subtract visibility, never authority.**

> **Capability removal and data deletion are different operations and require different safety controls.**
