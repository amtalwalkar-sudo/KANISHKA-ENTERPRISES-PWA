# KFE Screen Contract

Every production screen must prove the following before it is considered complete:

- [ ] UI renders
- [ ] All required elements are reachable
- [ ] Valid input succeeds
- [ ] Invalid input fails correctly
- [ ] Busy/loading state works
- [ ] Cancel/close works
- [ ] Persistence occurs
- [ ] Reload recovers state
- [ ] Edit works
- [ ] Delete/soft-delete works where applicable
- [ ] Application boundary is respected
- [ ] Repository boundary is respected
- [ ] Business invariants hold
- [ ] Cross-module effects are correct
- [ ] Browser E2E succeeds
- [ ] Resilience/offline behavior succeeds

## Current product areas

KFE currently has exactly three active product areas:

1. **Work** — operational work, sessions, trips, ride capture and related workflows.
2. **Performance** — current business position, running cost and driver-facing operating interpretation.
3. **Admin** — back-office command center for Vehicle, Driver, Finance, Renewals, Maintenance, Loans and Settings.

There is no Timeline product area in KFE.

## Current presentation state

Performance and Admin are current production presentation surfaces.

Work is an active product area and its domain/application capabilities remain authoritative. The previous Work UI is not a current presentation contract and must not be resurrected from historical implementation. A new Work presentation must be built from the current Work contracts and Master Blueprint when implementation begins.

This distinction means **Work is active**, while its old UI is not authoritative.

## Presentation boundary

Active screens consume application-layer read models and commands. Presentation does not reach directly into domain, repository, infrastructure, IndexedDB or browser storage.

Admin must remain presentation-only. The UI consumes an application-layer read model and never reaches directly into domain, repository, infrastructure, IndexedDB or browser storage.

Admin Home is month-aware and contains:

- CURRENT STATE: vehicle, connection, current driver and odometer
- ATTENTION: actionable warnings only
- INSIGHT: human-readable interpretation
- PROFITABILITY position indicator, Profit/KM, Cost/KM and Margin
- BREAK-EVEN position indicator, Break-even, Current and Remaining
- Month View
- Finance
- Management

Month View contains Month Overview, Profitability, Break-even, Insight, Weekly rows and month-level activity derived from authoritative records. Month → Week → Day navigation is a presentation concept only and is not a separate product area or module.

Finance is derived/read-only and exposes six tiles: Revenue, Business Cost, Profit, Profit/KM, Cost/KM and Break-even.

Management is grouped as:

- BUSINESS: Vehicle, Driver
- FINANCE: one combined read-only Finance dashboard
- OPERATIONS: Renewals, Maintenance, Loans
- SYSTEM: Settings

## Financial separation rules

**Today's Running Cost** is an ERP-calculated financial metric. Its current frozen definition is Fuel plus KM-based Maintenance Allocation, with personal use excluded.

**Daily Target** is driver-only operational/reference data. It never changes Revenue, Business Cost, Profit or Break-even and is never an accounting input.

Personal KM is excluded from business financial calculations. Business calculations consume authoritative source records after business rules and allocation/amortization.

There is no generic Other Expenses domain and no Tax Reserve bucket.

## Authoritative form rule

Every authoritative record type has one application-bound form boundary. CREATE and EDIT use the same authoritative record flow. Presentation surfaces collect/display inputs only.

Corrections follow:

`Edit → Validate → Recalculate → Save`

Financial results are never manually entered into Finance, Profitability or Break-even views.

## CI enforcement

The canonical CI treats this contract as a production-screen gate. Existing architecture, domain, application-boundary, persistence, browser, accounting/business-rule and resilience gates remain authoritative. Future screen-specific browser/E2E suites should be added to the canonical CI rather than creating a weaker isolated path.

Presentation selectors and DOM structure are replaceable implementation details. CI must validate user-visible behavior and authoritative workflow contracts rather than preserving obsolete markup solely because an older UI used it.
