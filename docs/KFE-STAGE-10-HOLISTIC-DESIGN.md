# KFE Stage 10 — Complete Holistic Presentation + UI/UX Design

**Status:** COMPLETE — FREEZE READY — USER FREEZE APPROVAL REQUIRED

## 1. Purpose

Stage 10 defines the complete presentation and UI/UX design for the active KFE ERP without changing business authority, domain rules, application orchestration, repository contracts, persistence, calculations, or authoritative data.

Stage 10 is holistic. It covers the complete presentation system first; implementation begins only after the design is frozen.

## 2. Product Scope

KFE has exactly three active product areas:

1. **Work** — operational work, sessions, trips, vehicle movement, ride capture and related real-world workflows.
2. **Performance** — business position, operating interpretation, metrics and reporting.
3. **Admin** — configuration, correction, back-office management and controlled ERP maintenance.

There is **no Timeline product area**.

Historical Timeline material is reference evidence only and must not be recreated.

## 3. Permanent Exclusions

The following are permanently excluded from current and future KFE architecture unless explicitly reopened by a new design decision:

- OCR
- OCR engines or providers
- screenshot OCR
- AI/machine extraction from screenshots
- OCR-specific contracts or adapters
- Timeline as a product area
- multiple shells
- multiple databases
- duplicate stores or persistence paths
- duplicate calculation engines
- presentation-owned business authority
- provider-specific domain logic
- feature-specific private persistence
- parallel Work implementations

Screenshots may exist only as optional source evidence. They never become machine-extracted business authority.

## 4. Presentation Architecture

There is one presentation system:

```text
ONE PRESENTATION SYSTEM
├── Shell
├── Navigation
├── Layout
├── Theme / visual language
├── Universal Forms
├── Shared Components
└── Product Screens
    ├── Work
    ├── Performance
    └── Admin
```

Presentation consumes application-layer commands and read models. It does not reach directly into domain, repositories, persistence, infrastructure, IndexedDB or browser storage.

Presentation may change without changing authoritative business behavior.

## 5. Shell

The shell is neutral and presentation-only.

Primary destinations are:

**Work | Performance | Admin**

The default landing experience is the **Work Driver Cockpit**, because the driver's primary task is operational execution.

The shell contains:

- Header
- Main viewport
- Persistent bottom navigation
- Contextual action area where required
- Reserved space for persistent controls

The bottom navigation remains visually and structurally independent from the business modules.

Future presentation destinations may be added, removed, renamed, reordered or regrouped without creating duplicate business authority.

## 6. Navigation Principles

Navigation freedom must not become lifecycle freedom.

Every screen/state must provide:

- a deliberate entry path
- a deliberate exit path
- a return path to the relevant parent/context
- a valid next-action path
- access to permitted information without unnecessarily locking the driver into a state screen

A state-dependent screen must never become a dead end.

The driver can navigate to relevant history, current details, Performance and permitted Admin functions while lifecycle actions remain governed by Work application/domain rules.

Navigating elsewhere cannot bypass lifecycle rules.

## 7. Work Presentation — Driver Cockpit

The Work Cockpit is intentionally driver-oriented and should feel like a professional driver application rather than an accounting ERP form.

Conceptual structure:

```text
┌─────────────────────────────┐
│           HEADER            │
├─────────────────────────────┤
│        WORK / CONTEXT       │
│                             │
│       CURRENT STATE         │
│     Relevant live metrics   │
│                             │
│     PRIMARY ACTION AREA     │
│                             │
│    Secondary Work actions   │
├─────────────────────────────┤
│ Work │ Performance │ Admin  │
└─────────────────────────────┘
```

The exact visual styling is implementation detail, but the interaction hierarchy is authoritative for Stage 10.

## 8. Work Lifecycle

The driver-facing lifecycle is simplified to operational actions:

```text
NO ACTIVE SHIFT
      ↓
START SHIFT
      ↓
SHIFT ACTIVE
      ↓
START TRIP
      ↓
TRIP ACTIVE
      ↓
END TRIP
      ↓
SHIFT ACTIVE
      ↓
END SHIFT
      ↓
NO ACTIVE SHIFT
```

There is no separate driver-facing Start Day or End Day action.

Financial Day is activated by the first valid trip and is reconstructed/available for reporting from authoritative records.

## 9. Start Shift Gate

Start Shift is an operational entry point, not a long ERP form.

The gate exposes:

- last known odometer, prefilled where available
- current odometer
- calculated odometer gap
- required allocation only when a gap exists
- Personal or Dead KM allocation when required
- optional personal toll/parking/details when Personal is selected
- confirmation of resolved opening movement

If there is no gap, no allocation is required.

A shift cannot proceed with an unresolved opening odometer discrepancy.

## 10. Start Trip

Start Trip is deliberately minimal.

The driver chooses exactly one operator from this ordered list:

1. Uber
2. One way
3. Rapido
4. Ola
5. Savaari

The Start Trip screen does not require driver entry of:

- pickup
- drop
- fare
- distance
- toll
- parking
- odometer
- trip time

Start time is system-generated.

The active trip timer is displayed as:

`HH:MM:SS`

## 11. Operator Carry-Forward

After the first trip, the selected operator becomes the default convenience selection for subsequent trips.

The default may carry forward across days.

The carried-forward value is never authoritative by itself.

Before **every** trip, the current/default operator must be visually obvious so the driver can verify it before starting the ride.

The driver can change the operator for the individual trip.

The operator saved on the committed trip record is the authoritative business value.

A carried-forward default must never silently overwrite a previously committed trip.

## 12. Start / End Trip Persistent Control

Start Trip and End Trip use the same persistent swipe bar.

The bar is positioned immediately above the bottom navigation and has reserved viewport space. Content must never render behind it.

Before a trip:

`SWIPE TO START`

After successful Start Trip:

- the bar changes to `SWIPE TO END`
- the active `HH:MM:SS` timer appears
- the state change confirms successful start

After successful End Trip:

- the bar returns to `SWIPE TO START`
- the state change confirms successful end

The state transition provides confirmation and protects against accidental double submission.

## 13. End Trip

End Trip is intentionally simple.

The driver does not enter trip details at End Trip.

The application closes the active trip through the authoritative lifecycle path and reconstructs/captures required downstream information from existing authoritative sources and application rules.

## 14. Trip Mistake Recovery

A driver mistake must not create an uncorrectable fake business record.

A Start Trip action creates a committed business trip only after successful application processing.

If a trip was started accidentally, it can be recovered through controlled cancellation/void/correction lifecycle rules.

A mistaken operator classification can be corrected through End Shift review or the appropriate controlled correction path.

Correction flow:

`Review → Edit → Validate → Recalculate → Save`

Corrections must preserve lifecycle integrity and auditability. They must not bypass domain/application authority or create parallel records.

## 15. End Shift

End Shift provides a controlled review before closing the operational period.

The review may expose:

- shift start/end
- start/end odometer
- total vehicle KM
- business ride KM
- dead KM
- personal KM
- trip list
- operator classification
- revenue
- business toll
- business parking
- relevant business costs
- personal movement/cost information where applicable
- warnings requiring correction

The driver can correct permitted mistakes before final confirmation.

After successful End Shift, the shift becomes a completed historical operational record and remains reconstructable from authoritative persisted state.

## 16. Personal Movement

There is no separate Start Personal Trip or End Personal Trip lifecycle.

Personal movement is identified through odometer reconciliation/allocation.

When an odometer gap is allocated to Personal, the UI may expose optional:

- personal movement details
- toll
- parking
- other permitted personal context

Personal movement and personal costs are displayed separately in the appropriate read/reporting surfaces.

Personal KM and personal costs are excluded from business financial calculations.

## 17. Business / Personal / Dead KM

Vehicle movement is continuous physical movement.

The authoritative total vehicle movement is:

`End Odometer − Start Odometer`

Movement is attributed between:

- Business Ride KM
- Personal KM
- Dead KM

The dead-mile model is residual and should minimize driver reconciliation.

Conceptually:

`Dead KM = Authoritative Vehicle KM − Validated Business Ride KM − Validated Personal KM`

GPS/routing can assist reconstruction and estimation but does not replace authoritative odometer records.

## 18. GPS / Location Presentation

Location collection begins with Shift Start and ends after Shift End.

The design supports:

- Start Shift location stamp
- Start Trip location stamp
- End Trip location stamp
- End Shift location stamp
- periodic location pings
- optional higher-detail/continuous location mode

Both periodic and continuous modes may be available from launch. The driver can select the mode at shift start where the implementation exposes that choice.

Location is evidence for reconstruction and operational context, not the authoritative vehicle-KM source.

Driver should not normally reconcile dead mileage manually.

Android/Capacitor foreground-service, permission, battery and lifecycle details remain implementation notes rather than presentation rules.

## 19. Work Supporting Screens

Work presentation must provide access to operational information without making the driver navigate through ERP complexity for routine actions.

Supporting Work views include, as required by the current contracts:

- current shift/operational status
- trip history
- trip details
- shift review
- shift history
- odometer/movement review
- business/personal/dead movement interpretation
- correction paths

These are presentation representations of existing authoritative records, not new authorities.

## 20. Performance

Performance is the interpretation/reporting surface over authoritative ERP records.

It must not accept manually entered financial results.

Performance can present:

- current business position
- revenue
- business cost
- profit
- Profit/KM
- Cost/KM
- Margin
- break-even
- target/reference metrics
- running cost interpretation
- daily/weekly/monthly views
- historical operational interpretation
- driver-facing relevant metrics

Month → Week → Day is a presentation navigation hierarchy, not a separate product area.

Performance calculations remain owned by their appropriate domain/application boundaries.

## 21. Performance Financial Separation

Today's Running Cost is an ERP-calculated financial metric.

Current frozen definition:

`Fuel + KM-based Maintenance Allocation`

with personal use excluded.

Daily Target is driver-only operational/reference information. It does not change Revenue, Business Cost, Profit or Break-even and is never an accounting input.

Financial screens are read/interpretation surfaces. They do not allow users to type calculated financial results directly.

## 22. Admin

Admin is the controlled back-office management surface.

Admin presentation includes:

### Business

- Vehicle
- Driver

### Finance

- combined read-only Finance dashboard

### Operations

- Renewals
- Maintenance
- Loans

### System

- Settings

Admin may contain correction/edit flows where authorized, but those actions must use the same application/domain/repository boundaries as Work.

Admin does not create a second persistence path.

## 23. Admin Home

Admin Home presents:

- CURRENT STATE — vehicle, connection, current driver, odometer
- ATTENTION — actionable warnings only
- INSIGHT — human-readable interpretation
- PROFITABILITY — Profit/KM, Cost/KM, Margin and position
- BREAK-EVEN — Break-even, Current and Remaining
- Month View
- Finance
- Management

Admin is management-oriented, not a second operational cockpit.

## 24. Universal Forms

KFE has one universal form system.

All authoritative record types use one application-bound form boundary.

CREATE and EDIT use the same authoritative record flow.

Forms must consistently support, where applicable:

- required fields
- optional fields
- units
- defaults
- validation
- warnings
- confirmation
- cancel/close
- edit
- controlled delete/soft-delete
- void/cancel lifecycle
- historical protection
- save state
- loading/busy state
- error state
- success confirmation

Presentation collects values; application validates workflow/preconditions; domain enforces business invariants; persistence enforces storage integrity.

## 25. Entry-Point Rule

Every operational entry point must have one clear purpose.

The intended path is:

`User Action → Presentation Entry → Application Operation → Domain Validation → Repository → Persistence → Read Model → Presentation`

A presentation shortcut must not bypass this path.

## 26. Screen State Model

Every production screen must intentionally handle:

- initial/loading
- ready
- empty
- active
- success
- validation failure
- recoverable error
- blocked-by-state
- offline/unavailable dependency
- correction/edit state
- completed/historical state

The user must understand what happened and what can be done next.

## 27. Scroll / Viewport Rules

Each screen must deliberately define:

- fixed/non-scrolling regions
- scrolling content regions
- persistent controls
- safe bottom spacing
- keyboard/input behavior
- loading and error placement

Persistent bottom navigation and the persistent Start/End Trip swipe bar reserve their own viewport space.

No content may accidentally sit behind persistent controls.

## 28. Responsive / Mobile-First Rules

KFE is mobile-first.

Presentation must remain usable on:

- phone portrait
- phone landscape where supported
- larger screens/tablet layouts where applicable

Responsive changes may rearrange presentation but must not change business semantics or authoritative data.

## 29. Visual Language

The Work experience should feel operational and driver-friendly.

Performance should feel analytical and readable.

Admin should feel controlled, structured and management-oriented.

The visual system remains one coherent KFE theme while allowing product areas to communicate different purposes through hierarchy, not separate design systems.

Global theme changes may intentionally propagate. Accidental style propagation is rejected.

## 30. Change Isolation

Presentation changes must remain isolated by responsibility.

Examples:

- background change → background only unless intentionally global
- bottom navigation change → navigation presentation only
- Work layout change → must not change Performance/Admin
- header change → must not change viewport/business behavior
- one form change → must not alter unrelated forms
- global theme change → may intentionally propagate

No presentation change may silently alter business rules or persistence.

## 31. Navigation and Lifecycle Safety

A driver may navigate back to relevant information and forward to valid next actions.

However, navigation cannot bypass lifecycle rules.

Example:

If a trip is active, the driver may navigate to permitted information and Performance, but End Shift remains unavailable until the active trip is correctly handled according to Work lifecycle rules.

State-dependent UI guides the user; the application/domain remains the authority.

## 32. Correction and Historical Integrity

Corrections use controlled edit/recalculate/save paths.

A correction must:

1. identify the authoritative record
2. validate the requested change
3. apply the change through the application boundary
4. recalculate/reconstruct affected read models
5. preserve required audit/history semantics
6. prevent duplicate or contradictory records

Historical records must not be silently rewritten merely to satisfy presentation requirements.

## 33. ERP Capability Coverage Rule

Stage 10 is non-destructive.

The presentation may simplify, hide, group, move or reorganize capabilities, but it must not silently delete ERP capability.

Before Stage 10 is frozen, every ERP capability must map to:

`Domain capability → Application operation → Authoritative record/state → Repository → Persistence → Read model → Presentation`

If a capability has no presentation path, it must be deliberately classified as one of:

- background/system capability
- automatic calculation
- controlled Admin-only capability
- read-only interpretation
- intentionally hidden implementation detail

No capability may disappear accidentally.

## 34. Screen Completion Gate

Every production screen must prove:

- UI renders
- required elements are reachable
- valid input succeeds where applicable
- invalid input fails correctly
- loading/busy state works
- cancel/close works
- persistence occurs where applicable
- reload/reconstruction recovers state
- edit works where applicable
- delete/soft-delete works where applicable
- application boundary is respected
- repository boundary is respected
- business invariants hold
- cross-module effects are correct
- offline/resilience behavior is respected

Browser/E2E tests validate semantic behavior and current presentation contracts, not obsolete DOM structure.

## 35. Presentation Safety Gate

Before changing a non-presentation layer because of a UI problem, prove that the failure is caused by a genuine contract defect.

Do not modify domain, application, repository or persistence merely to satisfy an obsolete UI selector or historical screen structure.

## 36. One Authority Rule

Presentation is never authoritative for business facts.

One business fact has:

`ONE AUTHORITATIVE RECORD → ONE PERSISTENCE PATH → MULTIPLE READ REPRESENTATIONS ONLY WHEN NEEDED`

Work, Performance and Admin are different presentation modes over the same ERP authority.

## 37. Provider Independence

Presentation must not depend on a specific cloud, database, backup, sync, AI, OCR or external provider.

Provider-specific implementation belongs behind infrastructure/application boundaries.

## 38. Offline / Recovery Presentation Requirements

The UI must make important offline/recovery states understandable.

It should communicate:

- saved locally
- pending sync where applicable
- backup state where applicable
- unavailable remote dependency
- recoverable failure

Offline presentation must never imply that a remote provider is the authoritative source when the authoritative local ERP record exists.

## 39. Accessibility / Usability

Controls must have clear labels and state feedback.

Primary actions must be visually dominant without requiring precise interaction.

Swipe actions require a non-swipe accessible equivalent where platform/accessibility requirements demand it.

Validation and errors must be understandable without relying only on color.

## 40. Stage 10 Implementation Boundary

Stage 10 ends with the design, not the implementation.

The next implementation phase must use this holistic design as the presentation contract.

Termux/local implementation is not the place to rediscover menus, screens, field coverage, navigation or ERP capability. Implementation may identify genuine contract defects, but those return to design deliberately rather than causing silent drift.

## 41. Explicit Non-Goals

Stage 10 does not:

- create a second shell
- create a second database
- create presentation-specific business logic
- introduce OCR
- introduce Timeline
- create duplicate forms
- create duplicate calculation engines
- create provider-specific business authority
- resurrect the old Work UI
- make screenshots authoritative

## 42. Final Stage 10 Principle

> **Start from 100% ERP capability coverage, then organize and simplify the presentation without deleting ERP capability.**

The resulting KFE experience should be simple for the driver while retaining the complete ERP underneath:

**Work for action. Performance for interpretation. Admin for control. One shell. One presentation system. One authority. No duplication. No silent drift.**
