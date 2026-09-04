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

## Three-screen driver rule

The driver's normal working day must be possible entirely inside exactly these three primary screens:

1. **Work** — operational work session, odometer activity, business/personal KM, break handling and fuel entry.
2. **Performance** — current business position, running cost and driver-facing operating targets.
3. **Timeline** — chronological activity history with Day, Week and Long-term horizons.

Fuel can be added directly from Work. Break handling is part of the frozen Work-session business contract. Trip planning is intentionally not part of the driver workflow.

**Admin is back-office only.** It is not required for a normal driver working day. Admin is the administrative command center for Vehicle, Driver, Finance, Compliance, Maintenance, Loans and Settings.

## Admin contract

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
- View Timeline

Month View contains Month Overview, Profitability, Break-even, Insight, Weekly rows and Month Timeline. Month → Week → Day navigation is two taps from the month view, and the selected day must open the canonical Timeline with that day as the authoritative viewing context. Finance is derived/read-only and exposes six tiles: Revenue, Business Cost, Profit, Profit/KM, Cost/KM and Break-even.

Management is grouped as:

- BUSINESS: Vehicle, Driver
- FINANCE: one combined read-only Finance dashboard
- OPERATIONS: Compliance, Maintenance, Loans
- SYSTEM: Settings

Admin must use the same canonical Timeline as the driver. Admin may enter an authorized correction flow, but never edits derived financial numbers directly.

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

The KFE Master CI treats this contract as a mandatory production-screen gate. Existing architecture, domain, application-boundary, persistence, browser, accounting/business-rule and resilience gates remain authoritative. Future screen-specific browser/E2E suites should be added to the Master CI rather than creating a weaker isolated path.
