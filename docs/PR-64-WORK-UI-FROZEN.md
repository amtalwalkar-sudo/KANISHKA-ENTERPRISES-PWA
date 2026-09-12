# PR #64 — Work Workflow UI

Status: **FROZEN / IMPLEMENTATION READY**

## Core UX principle
The Work screen must immediately answer: **What state am I in, and what should I do next?**

## Frozen interaction model
- Persistent Shift control at the top center.
- Shift control uses a toggle-like presentation while remaining governed by the existing lifecycle rules.
- Shift OFF + Day ON presents START SHIFT.
- Shift ON + Trip OFF presents END SHIFT.
- END SHIFT is unavailable while a Trip is active.
- Persistent Trip action sits immediately above the bottom navigation.
- Shift ON + Trip OFF presents START TRIP.
- Trip ON presents END TRIP.
- The Trip action keeps the same physical position, touch area, interaction pattern and visual hierarchy.
- Day Start/End is contextual/secondary and does not occupy the permanent primary-action area.
- Bottom navigation remains Work / Performance / Admin.
- The diagnostic bug overlay is a development overlay, not navigation.

## Driver-friendly requirements
- Glance-first state presentation.
- Large touch targets and minimal typing.
- Primary controls remain easy to reach.
- Clear Day / Shift / Trip state hierarchy.
- Clear feedback about what happens next.
- Useful elapsed Trip information.
- Reassuring, non-technical GPS states.
- Calm offline presentation.
- Automatic retry/recovery where appropriate.
- Consistent driver-facing terminology.
- Immediate processing feedback and protection against repeated taps.
- Correct state reconstruction after app restart.
- Meaningful empty states.
- Accessible text, contrast and non-color-only status communication.
- No UUIDs or internal accounting/movement/provider terminology in the driver-facing workflow.

## Workflow states to present
1. Day OFF / Shift OFF
2. Day ON / Shift OFF
3. Day ON / Shift ON / Trip OFF
4. Day ON / Shift ON / Trip ON
5. CNG Refueling overlay

## Explicit boundary
UI/UX only. This PR does not change Day → Shift → Trip lifecycle rules, Trip boundary authority, GPS architecture, odometer authority, movement accounting, revenue reconciliation, routing, persistence/schema, `hasCompletedBusinessTrip`, zero-trip Shift behavior, End Day eligibility, provider architecture, or OCR architecture.
