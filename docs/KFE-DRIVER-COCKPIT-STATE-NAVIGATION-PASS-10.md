# KFE — Driver Cockpit State-Dependent Navigation — Stage 10

**Status:** WORKING DESIGN — NOT FROZEN

## Purpose

The Driver Cockpit is a state-dependent presentation of the authoritative Work lifecycle. It guides the driver toward the appropriate operational action without turning the lifecycle into a sequence of locked screens.

## Foundational model

The cockpit may move through a lifecycle such as:

`Day Not Started → Start Day → Day Active → Start Shift → Shift Active → Start Trip → Trip Active → End Trip → Shift Active → End Shift → Day Active → End Day → Day Complete`

The Work domain/application remains authoritative for lifecycle state and valid transitions. The presentation only reflects that state and presents the appropriate context and actions.

## Complete navigation rule

Every state-dependent cockpit screen must remain navigable.

From every state, the driver must have a deliberate path to:

- exit/return to the appropriate cockpit context;
- relevant previous information;
- current details;
- permitted actions;
- permitted Metrics access;
- permitted Admin access; and
- the valid next lifecycle action, where applicable.

A screen must never become a dead end merely because the driver is currently in a particular Work state.

## Lifecycle protection

Navigation freedom must not become lifecycle freedom.

The driver may navigate away from an active Trip screen, for example, but navigation cannot bypass the authoritative lifecycle rules. If End Trip is required before End Shift, the application must enforce that rule regardless of which screen the driver reaches.

When a requested transition is currently invalid, the UI should guide the driver toward the required preceding action rather than simply trapping the user or silently changing state.

## Loop requirement

The cockpit is designed as a **fully navigable operational state loop**, not a one-way sequence of locked screens.

Every state must have:

1. a deliberate entry path;
2. a deliberate exit/return path;
3. relevant information access;
4. permitted cross-area navigation;
5. a valid next-state action where applicable; and
6. clear guidance for invalid transitions.

## Architecture boundary

```text
Authoritative Work State
        ↓
Application Read Model / Use Case
        ↓
State-Dependent Driver Cockpit
        ↓
Driver Action / Navigation
        ↓
Application
        ↓
Domain Validation / Lifecycle Rules
        ↓
Repository Contract
        ↓
Persistence
```

The cockpit must not create its own lifecycle state, private store, duplicate business rules, or alternative persistence path.

## Core principle

> **The Driver Cockpit guides the driver through the correct state, but never locks the driver into a screen.**

> **Navigation freedom must not become lifecycle freedom.**
