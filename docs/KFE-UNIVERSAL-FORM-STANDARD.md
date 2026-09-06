# KFE 2.0 — Universal Driver-Centric Form Standard

**Status:** Frozen foundation contract
**Scope:** All driver-facing PWA forms and interactive form controls

## Core directive

No active form control may become hidden, clipped, covered, or unreachable because of shell chrome, viewport size, orientation, scrolling, font scaling, or the virtual keyboard.

## Existing foundation to preserve

KFE already has a separate Universal Mistake & Recovery Contract. This form standard does not replace it. Cancel, Undo, correction, confirmation, and authoritative domain-state rules remain governed by that contract.

KFE also already has reusable draft infrastructure. It must be reused rather than replaced with screen-specific draft implementations.

## Universal layout rules

- Shared form controls use at least 52px touch targets.
- Mobile form fields stack in one column.
- Form containers provide safe-area bottom clearance.
- Form containers must not depend on fixed heights that can clip content.
- Fixed shell headers, bottom navigation, FABs, notifications, and overlays must not obscure active controls or submission actions.
- Active controls must remain reachable when conditional fields appear.

## Keyboard and viewport rules

- Use the dynamic visual viewport when available.
- Keep a live `--kfe-viewport-height` and `--kfe-keyboard-inset` available to shared UI.
- Focused controls are automatically scrolled into a reachable position.
- Focused controls receive scroll margins that account for shell chrome and keyboard space.

## Form resilience rules

- Existing KFE form-draft recovery is installed globally at application startup.
- Native constraint validation is checked during editing and on invalid submission, without replacing domain-specific validation.
- Invalid controls receive accessible inline feedback and are brought into view.
- Numeric, telephone, email, and similar controls receive conservative `inputmode`/`autocomplete` hints when the form has not explicitly supplied them.

## Exceptions

`data-form-type="compact"` is a dynamic exception for compact auth/PIN/OTP/search-like UI. It bypasses shared layout/scroll enforcement but retains the applicable recovery behavior.

Search/header search and canvas/signature controls are not forced into the normal single-column/input rules.

## Mistake recovery

Do not invent UI-only deletion or reversal logic. Immediate Undo and later Correction remain application/domain responsibilities. A form may preserve an unsaved draft, but draft restoration must never create an authoritative domain mutation.

## Building rule

Before adding or changing a driver-facing form:

1. Reuse the shared form infrastructure.
2. Do not create a second keyboard/viewport system.
3. Do not add screen-specific bottom-clearance hacks when a shared rule can solve the issue.
4. Preserve existing business validation and domain commands.
5. Mark legitimate compact/search/canvas exceptions explicitly.
6. Verify the active form remains reachable at small viewports, with the keyboard open, and with shell chrome present.

**Frozen principle:**

> If a form control is active, the driver must be able to see it, reach it, edit it, and submit or cancel it.
