# KFE 2.0 E2E Certification Pipeline

## Purpose

This pipeline is the automated browser-certification foundation for the KFE 2.0 PWA. It is deliberately separate from business-rule remediation: the pipeline establishes repeatable evidence before the complete 14-item end-to-end audit begins.

## Current gate

1. Checkout repository state.
2. Install Node 20 dependencies.
3. Build the production PWA.
4. Install Chromium and OS browser dependencies.
5. Start the PWA in CI.
6. Execute the Playwright certification suite.
7. Publish the HTML report and JUnit results as CI artifacts.
8. Preserve browser diagnostics on failure.

## Certification suite growth

The `tests/e2e/` suite will be expanded during the 14-item end-to-end audit. Tests must verify user-visible behavior rather than implementation details and should cover, where applicable:

- screen reachability
- every actionable control
- form presence and required validation
- save/update/correction flows
- persistence across reload
- calculation outputs against authoritative domain contracts/golden vectors
- cross-module effects
- error handling
- responsive/mobile behavior relevant to the production PWA

## CI policy

- Pull requests targeting `main` run the certification gate.
- Pushes to `main` run the certification gate.
- Manual dispatch is available for deliberate re-certification.
- CI runs Playwright with one worker for reproducibility.
- Certification failures block the certification decision; they are not converted to warnings.
- The suite must not weaken or bypass existing KFE governance/foundation gates.

## Scope boundary

This pipeline does not itself certify the physical Android phone. After the repository reaches a green automated certification state, the final stage is manual PWA testing on the target phone/browser.

## Evidence

Each CI run provides the test log, Playwright HTML report, JUnit results, and failure diagnostics. This creates an auditable trail for the later 14-item certification report.
