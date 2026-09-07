# KFE 2.0 Presentation Boundary

## Purpose

This document freezes the KFE 2.0 presentation-layer boundary so the UI can be redesigned without changing ERP behavior.

## Frozen below Presentation

The following layers are not to be changed as part of presentation cleanup unless a real contract defect is demonstrated:

- Domain rules and state transitions
- Application services and orchestration
- Repository contracts and persistence
- IndexedDB/local database behavior
- Financial calculations and allocation rules
- Fuel, Expenses, Revenue, Loans, Maintenance, Compliance behavior
- Work lifecycle semantics, including Break handling
- Performance functionality
- Timeline functionality
- Admin functionality
- Existing application command contracts

## Presentation may change

- Vue component markup
- Layout and responsive structure
- CSS and visual design
- Navigation presentation
- Spacing, typography, cards, buttons, and information hierarchy
- Accessibility attributes and presentation-only selectors
- Presentation-specific state projection
- Browser/UI tests that assert obsolete DOM structure

## Work presentation contract

The clean Work canvas uses the authoritative application/presentation APIs and must not recreate business logic in the template.

Required operational states remain defined by the authoritative Work contract. Work supports business and personal scope and Break handling; presentation must expose only the transitions and controls authorized by the current application contract.

Legacy swipe controls, swipe-bar components, scenic-shell presentation, and obsolete Work draft-form wrappers are not part of the clean Work presentation unless explicitly restored by the current contract.

## Performance / Timeline / Admin

These modules are functionally frozen. Their existing calculations, data loading, actions, and workflows must remain intact. Presentation cleanup may change only their layout, styling, responsiveness, and navigation presentation.

## Test rule

A UI test must assert semantic behavior or the current presentation contract, not historical DOM structure. A failure caused only by a deleted legacy component, class, wrapper, or selector is a presentation-test mismatch and should be corrected in the test rather than restoring obsolete UI.

## Change rule

Before modifying a non-presentation file during UI cleanup, demonstrate that the failure is caused by an actual application/domain contract defect. Do not alter protected business logic merely to satisfy a legacy UI assertion.
