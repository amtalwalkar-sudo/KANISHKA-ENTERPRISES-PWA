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
