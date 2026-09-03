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

1. **Work — Do + Record**: operational lifecycle, trips, breaks, and fuel entry. Work owns the current operational flow and must not be overloaded with historical record management.
2. **Performance — Know + Decide**: current business position and authoritative operating metrics. Performance is read-only and does not own transaction forms.
3. **Timeline — See + Review + Correct History**: chronological journey/activity history, horizons, locations, fuel categories, outstation journeys, and contextual entry points for correcting historical records.

**Timeline remains a read-only presentation surface.** Its edit action is only an entry point to the authoritative application form. Timeline itself never validates, calculates, creates, replaces, or persists a business record.

**More is administrative/back-office only.** It may retain owner/admin modules such as Vehicle, Maintenance, Compliance, Loans, configuration, and historical administration, but the driver must not need More for a normal working-day operation.

Trip planning is intentionally not part of the driver workflow contract.

## Authoritative form rule

Every driver-editable record type has **one authoritative form**. The same form supports both:

- **CREATE mode** — create a new authoritative record.
- **EDIT mode** — load an existing authoritative record and update that same record.

Every authoritative form must provide:

- Validation
- Save/create
- Update/edit
- Busy/loading and cancellation behavior where applicable
- Application-boundary persistence

A presentation surface may open an authoritative form, but it must not implement a second competing form for the same record type.

The initial driver-editable record types covered by this rule are:

- Work Session
- Business Trip
- Personal Trip
- Break
- Fuel
- Revenue
- Expense

Historical correction from Timeline therefore follows this path:

`Timeline event → authoritative form in EDIT mode → application validation → update existing record → read models recalculate from authoritative data`

It must **not** become:

`Timeline → duplicate edit logic → replacement record`

The rule preserves KFE's existing business logic, allocation rules, financial calculations, soft-delete behavior, and read-model architecture. Updating a record must cause downstream read models to consume the updated authoritative record; the form must never duplicate or override those calculations.

## CI enforcement

The KFE Master CI treats this contract as a mandatory production-screen gate. A screen is not complete merely because it renders or because one browser path passes. Its applicable contract evidence must be covered by automated validation before the screen is accepted.

Some items are conditional by design:

- Delete/soft-delete is required when the screen owns a deletable record.
- Edit is required when the screen supports editing.
- Cross-module effects are required when the screen changes data consumed by another module.
- Resilience/offline behavior must be proven for the screen's supported offline behavior.

The contract is additive: existing architecture, domain, application-boundary, persistence, browser, accounting/business-rule, and resilience gates remain authoritative. This contract does not replace or weaken them.

## Required evidence model

For each production screen, the implementation/testing work must be traceable to the checklist above. The Master CI gate verifies that the contract definition remains intact and that the existing validation stages that provide its evidence are executed.

Future screen-specific browser/E2E suites should be added to the Master CI rather than creating an isolated, weaker validation path.
