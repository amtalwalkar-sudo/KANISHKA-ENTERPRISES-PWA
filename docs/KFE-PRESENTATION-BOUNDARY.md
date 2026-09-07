# KFE 2.0 Presentation Boundary

## Purpose

This document freezes the KFE 2.0 presentation-layer boundary so active UI surfaces can be redesigned without changing ERP behavior.

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
- Admin functionality

## Presentation may change

- Vue component markup
- Layout and responsive structure
- CSS and visual design
- Navigation presentation
- Spacing, typography, cards, buttons, and information hierarchy
- Accessibility attributes and presentation-only selectors
- Presentation-specific state projection
- Browser/UI tests that assert obsolete DOM structure

## Clean presentation reset

Work and Timeline presentation surfaces have been removed from the current shell. Their presentation components, active navigation entries, screen-specific browser/UI contracts, and presentation API wiring are intentionally absent.

Their underlying domain/application capabilities are not treated as current presentation contracts. They can be rebuilt later from clean presentation boundaries without restoring obsolete components or selectors.

## Active Performance / Admin

Performance and Admin remain the active production presentation surfaces. Their calculations, data loading, actions, and application boundaries remain intact. Presentation cleanup may change only their layout, styling, responsiveness, and navigation presentation.

## Test rule

A UI test must assert semantic behavior or the current presentation contract, not historical DOM structure. A failure caused only by a deleted legacy component, class, wrapper, or selector is a presentation-test mismatch and should be corrected in the test rather than restoring obsolete UI.

## Change rule

Before modifying a non-presentation file during UI cleanup, demonstrate that the failure is caused by an actual application/domain contract defect. Do not alter protected business logic merely to satisfy a legacy UI assertion.
