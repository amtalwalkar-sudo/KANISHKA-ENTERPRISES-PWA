# KFE Stage 10 — Holistic Design Updates

**Status:** WORKING DESIGN — NOT FROZEN
**Branch:** `pwa`

This document records the current holistic Stage 10 presentation and workflow decisions. It is a design consolidation artifact, not an implementation file and not a replacement for the frozen KFE architecture.

## 1. Driver-facing day and shift flow

KFE does not require separate driver-facing **Start Day** or **End Day** actions.

- **Start Shift** is the driver-facing operational entry action.
- If no Financial Day is active, the first valid Start Shift establishes the day boundary.
- The Financial Day becomes financially active only after at least one valid trip is recorded.
- Additional shifts and trips may belong to the same Financial Day.
- **End Shift** closes the operational work period.
- Financial Day is reconstructed/calculated from authoritative shift and trip records.

Therefore:

> Start Shift is the operational action; Financial Day is a calculated business/reporting concept.

## 2. Driver Cockpit direction

The Work Cockpit follows the working **Uber + ERP** direction:

- driver-first, mobile-first experience
- large and obvious primary action
- current operational state always visible
- relevant metrics shown without making the screen feel like an accounting dashboard
- secondary actions available but not dominant
- state-dependent content with no dead ends
- navigation freedom without bypassing lifecycle rules

The three presentation areas remain:

1. **Driver Cockpit** — Work operations
2. **Metrics** — Performance interpretation and reporting
3. **Admin** — management, configuration, and correction

These are presentation modes over the same authoritative ERP, not separate data systems.

## 3. State-dependent cockpit

The cockpit reflects authoritative Work state and presents the next valid action.

Typical flow:

`No active shift → Start Shift → Shift Active → Start Trip → Trip Active → End Trip → Shift Active → End Shift`

Every state must provide:

- a deliberate exit path
- a return path to relevant information
- a valid next-state path where applicable
- access to permitted Metrics/Admin destinations

Navigation cannot bypass domain/application lifecycle validation.

## 4. Start Shift entry gate

Start Shift includes:

- last known odometer, prefilled
- current odometer, editable
- calculated movement gap
- mandatory allocation of any gap to **Personal** or **Dead KM**
- optional Personal toll and parking when Personal is selected
- driver-selected location mode, when enabled by the final technical design

The shift starts only after the required odometer gate is resolved.

There is no separate Personal Trip Start/End lifecycle.

## 5. Personal movement

Personal movement before Day/Shift activity is handled through odometer-gap allocation. GPS does not need to run before Shift Start for this purpose.

When a gap is allocated to Personal:

- Personal KM remains recorded and visible
- optional personal toll and parking may be entered
- personal movement and personal costs are shown separately on appropriate read-model/presentation surfaces
- personal costs remain excluded from business P/L

When a gap is allocated to Dead KM:

- the movement remains business-side for cost attribution
- no artificial personal-trip record is created

## 6. Trip completion

Business Trip End includes:

- end odometer
- ride distance
- fare/revenue
- optional toll
- optional parking
- separate inclusion decision for toll and parking:
  - included in fare
  - excluded from fare
  - not applicable/none

This prevents double counting while preserving the actual cost information.

## 7. Continuous movement and classification

Vehicle movement, fuel, and maintenance remain continuous at the authoritative vehicle level.

Presentation and reporting distinguish:

- Business ride KM
- Dead KM
- Personal KM
- Business costs
- Personal costs

Dead KM remains business-side for cost attribution. Personal KM and personal costs remain separately identifiable and excluded from business profitability calculations.

There is one movement/cost authority, not separate business and personal calculation systems.

## 8. GPS design boundary

GPS implementation is intentionally deferred to the later technical implementation stage.

Current presentation context only:

- location session is associated with the active shift
- Start Shift and End Shift are the operational boundaries
- GPS/event evidence and periodic or continuous collection must feed the existing authoritative reconstruction path
- GPS must not create a competing odometer or persistence authority

The exact Android/Capacitor tracking implementation, background execution, permissions, battery handling, foreground service, and OEM behaviour remain later technical work and are not frozen here.

## 9. Preservation and extensibility

These changes simplify the driver-facing experience without deleting ERP capability:

- Financial Day remains available for reporting and reconstruction
- Personal movement and personal costs remain available
- all authoritative records remain reconstructable
- future navigation destinations can be added without creating duplicate data authority
- the design remains evolvable until explicitly frozen

## Core principle

> One operational action for the driver where possible; complete ERP meaning and history underneath; no duplicate authority; no silent capability loss.
