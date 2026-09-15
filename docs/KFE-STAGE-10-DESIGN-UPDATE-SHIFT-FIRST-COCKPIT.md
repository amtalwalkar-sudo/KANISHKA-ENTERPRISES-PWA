# KFE Stage 10 Design Update — Shift-First Cockpit

**Status:** WORKING DESIGN — NOT FROZEN

## Purpose

This document records the current holistic Stage 10 presentation decisions. It updates the driver-facing experience without creating a second lifecycle, data authority, repository, database, calculation engine, or tracking architecture.

## 1. Shift-First Driver Flow

KFE does not require separate driver-facing Start Day or End Day actions.

- `Start Shift` is the driver-facing operational entry action.
- If no Financial Day is active, the first valid Start Shift establishes the day boundary.
- The Financial Day becomes financially active only after the shift contains at least one valid recorded trip.
- Additional shifts and trips may belong to the same Financial Day.
- `End Shift` closes the operational work period.
- Financial Day is calculated and reconstructed from authoritative shift and trip records.
- No separate End Day action is required for the driver.

The Financial Day remains a valid reporting and business concept. It is not deleted; only redundant manual controls are removed from the cockpit.

## 2. Driver Cockpit Direction

The Work Cockpit follows the working `Uber + ERP` direction:

- professional driver-app feel rather than a data-entry dashboard
- one obvious primary action
- current operational state always visible
- relevant metrics shown without overwhelming the driver
- secondary actions available but subordinate
- state-dependent screens with a complete navigation loop
- no lifecycle bypass through navigation

The current three-part presentation foundation remains:

1. Driver Cockpit — Work
2. Metrics — Performance
3. Admin — management, correction, and configuration

## 3. Shift Start Entry

The Start Shift flow includes:

1. last known odometer prefilled
2. editable current odometer
3. automatic movement-gap calculation
4. mandatory allocation of any gap to Personal or Dead KM
5. optional personal toll and parking details when Personal is selected
6. driver selection of the available location-tracking mode, where enabled
7. confirmation before the shift begins

The shift cannot begin while an unresolved odometer gap remains.

## 4. Personal Movement

KFE does not require a separate Personal Trip Start or Personal Trip End lifecycle.

Personal movement is handled through odometer-gap allocation at the appropriate operational boundary. If the driver allocates movement to Personal, optional personal toll and parking details may be recorded there.

Personal KM and personal costs remain separately visible and are excluded from business profitability calculations. They are not deleted or hidden from the ERP.

## 5. Business, Personal, and Dead KM

The vehicle movement record remains continuous, while attribution remains distinct:

- Business ride KM
- Dead / unallocated KM
- Personal KM

Dead KM remains business-side for cost attribution. Personal KM and personal costs remain separately identifiable. The system must not create separate competing mileage or expense authorities.

## 6. Trip and Shift Completion

Business Trip End may capture:

- end odometer
- validated or confirmed ride distance
- fare/revenue
- optional toll
- optional parking
- whether toll was included in fare or excluded from fare
- whether parking was included in fare or excluded from fare

End Shift may capture or confirm:

- current odometer
- shift movement
- revenue
- applicable toll and parking
- business/personal/dead movement summary
- business and personal cost separation

All entries use the standard entry, validation, calculation, confirmation, repository, and persistence path.

## 7. Location Tracking Boundary

GPS tracking is not expanded into a separate Stage 10 design system here.

The current technical direction remains:

- location session begins at Shift Start
- location session ends at Shift End
- Ping mode and Continuous GPS are both intended to be available from launch
- the driver may choose the mode for the shift
- both modes feed the same location-evidence and dead-KM reconstruction path
- manual shift-start and shift-end odometers remain authoritative for total vehicle movement

Detailed Android/Capacitor background execution, permissions, battery restrictions, foreground-service behaviour, and OEM handling remain implementation notes for the later technical phase.

## 8. Navigation and Safety

State-dependent cockpit screens must not become dead ends.

Every operational state must provide:

- a deliberate exit path
- a deliberate return path
- a valid next-state path where applicable
- access to relevant information and permitted Metrics/Admin areas

Navigation freedom does not permit invalid lifecycle actions. For example, an active trip must be ended before the shift can be ended.

## 9. Design Boundary

This is a working Stage 10 presentation update. It does not freeze the visual design, exact screen layout, colors, navigation placement, tracking controls, or final form composition.

The update removes redundant driver-facing day controls while preserving the Financial Day concept, historical reconstruction, ERP coverage, and one-authority architecture.

> **Shift is the driver-facing operational boundary. Financial Day is a calculated business/reporting concept.**
