# KFE — Shell Foundation — Stage 10

**Status:** WORKING DESIGN — NOT FROZEN

## Purpose

Establish the foundational presentation shell for the complete KFE ERP before detailed screen design.

The shell is intentionally **evolvable and replaceable**. Selecting a shell foundation does not hardcode the final visual design and does not create any new business/data authority.

## 1. Three Primary User Interaction Areas

KFE's foundational presentation is organized around three modes of interaction:

1. **Driver Cockpit** — operate the business during the working day.
2. **Metrics** — understand and interpret the business position.
3. **Admin** — manage, configure, correct, and maintain the ERP.

These are presentation modes over the existing KFE architecture, not three independent systems.

Conceptually:

`Driver Cockpit → Work presentation`

`Metrics → Performance presentation`

`Admin → Admin presentation`

All three consume the same underlying KFE application/domain/repository/persistence architecture.

## 2. Foundational Shell

Conceptual structure:

```text
KFE
│
├── Global Shell
│   ├── Header / global context
│   ├── Viewport
│   ├── Global feedback / overlays
│   ├── Theme / visual system
│   └── Responsive behaviour
│
├── Driver Cockpit
├── Metrics
└── Admin
```

The current primary navigation may present these three areas as the principal destinations. Navigation remains extensible under the existing Navigation Extensibility Rule.

The shell owns presentation composition only. It does not own business calculations, business rules, authoritative records, repositories, persistence, or domain state.

## 3. Driver Cockpit

The Driver Cockpit is the primary operational experience for the driver.

It is intended to support the activities that occur during actual vehicle operation and work:

- Start Day
- End Day
- Start / End Shift
- Start / End relevant work lifecycle
- Record breaks
- Start / end trips or rides
- Record business / personal movement
- Record ride details
- Record odometer
- Record revenue
- Record fuel
- Record toll
- Record parking
- Review and confirm entries
- Correct permitted entries
- See current operational state
- Complete / close applicable lifecycle actions

The cockpit should answer:

> **What is happening now, and what do I need to record or do next?**

## 4. Driver Cockpit Subscreen Principle

The Driver Cockpit is **not required to be one giant screen**.

It may contain multiple **subscreens / cockpit sections** that are organized around operational tasks and current state.

These subscreens are presentation-level subdivisions of the same Driver Cockpit. They do **not** create separate domains, stores, repositories, databases, calculation engines, or persistence paths.

A cockpit subscreen may be introduced, removed, reordered, renamed, collapsed, expanded, or reorganized as the UX evolves, provided the underlying ERP capability remains preserved.

Examples of possible cockpit subscreen groupings include:

```text
Driver Cockpit
├── Current Work / Today
├── Day / Shift
├── Trips / Rides
├── Odometer
├── Revenue
├── Fuel
└── Other operational entries/actions as required
```

**These are initial structural candidates, not frozen screen names.**

The final cockpit subscreens will be derived from the complete ERP capability map and then refined for the driver's actual workflow.

## 5. Metrics

Metrics is the interpretation surface of KFE.

It consumes authoritative ERP information and derived read models. It does not create duplicate facts.

Examples include:

- Revenue
- Actual expenses
- Set Aside
- Available Profit
- Revenue/hour
- Revenue/KM
- Profit/hour
- Profit/KM
- Total vehicle KM
- Business KM
- Personal KM
- Dead KM
- Fuel efficiency
- Fuel cost/KM
- Maintenance position
- Loan position
- Compliance position
- Recovery position
- Target/reference information
- Day / shift / month / year performance
- Historical comparisons and reconstruction

## 6. Admin

Admin is the controlled management surface for the ERP.

Examples include:

- Vehicle
- Driver
- Vehicle lifecycle
- Driver lifecycle
- Loan
- Loan payments
- Maintenance
- Compliance
- Configuration
- Effective-dated settings
- Target/reference configuration
- Controlled historical corrections where permitted
- Backup / restore management
- Sync management / status
- System/platform settings

## 7. Shared Authority

The three presentation areas do not own separate copies of the ERP.

```text
Driver Cockpit ─┐
Metrics         ├──→ ONE APPLICATION → ONE DOMAIN → ONE REPOSITORY → ONE LOCAL DB
Admin           ┘
```

A trip recorded from the Driver Cockpit is the same authoritative trip consumed by Metrics and managed through Admin where applicable.

A fuel record is not copied into a Metrics database.

A loan payment is not copied into a Performance store.

A vehicle record is not recreated inside the shell.

## 8. Evolvability

The selected shell foundation is **not hardcoded as permanent visual design**.

Later, KFE may intentionally change:

- header
- bottom navigation
- navigation style
- menus / submenus
- viewport composition
- background
- spacing
- typography
- cards / panels
- visual layers
- theme
- responsive behaviour
- cockpit subscreen arrangement
- metrics presentation
- admin presentation

Such presentation changes must remain isolated from domain, application, repository, persistence, authoritative data, calculations, and business rules.

## Core Principle

> **Three presentation modes. One ERP authority.**

> **Driver Cockpit operates the business. Metrics explains the business. Admin manages the business.**

> **Cockpit subscreens are presentation subdivisions, not separate ERP systems.**

> **The shell foundation is evolvable, not permanently hardcoded.**
