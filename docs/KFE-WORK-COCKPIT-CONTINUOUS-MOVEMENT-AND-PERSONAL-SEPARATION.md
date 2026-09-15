# KFE — Work Cockpit: Continuous Movement & Personal Separation

**Stage:** 10 — Working Design
**Status:** WORKING DESIGN — NOT FROZEN

## Purpose

Define how the Work Cockpit represents continuous vehicle movement while keeping business, dead, and personal movement visually and financially separated.

## Continuous Vehicle Movement

Vehicle movement remains one continuous odometer-based record. Fuel and maintenance calculations continue across the vehicle's movement history; they do not restart when movement changes between business, dead, and personal classification.

```text
Continuous Vehicle Movement
          |
     Odometer history
          |
    +-----+-----+
    |     |     |
 Business Personal Dead
   KM      KM      KM
```

## Movement Attribution

- Business KM remains business movement.
- Dead KM remains business-side movement for cost attribution.
- Personal KM remains separately identified personal movement.
- Personal movement does not become a separate operational Shift/Trip lifecycle merely to account for kilometres.

The authoritative vehicle movement record remains continuous. Classification is applied to the relevant movement segments.

## Cost Attribution

Fuel and maintenance remain continuously calculated at vehicle/movement level and are then attributed according to movement classification.

### Business side

Business movement includes:

- Business KM
- Dead KM

Therefore the fuel and maintenance costs attributable to dead KM remain on the business side.

### Personal side

Personal KM and its attributable costs remain separately identifiable:

- Personal fuel cost
- Personal maintenance allocation
- Personal toll
- Personal parking

Personal costs remain visible in KFE but are excluded from business P/L according to the established business/personal financial rules.

## Work Cockpit Interaction

The driver does not need separate **Start Personal Trip** or **End Personal Trip** lifecycle buttons merely to account for personal kilometres.

When an odometer boundary reveals a movement gap, the driver allocates the gap as:

- Personal KM, or
- Dead KM.

If Personal KM is selected, optional personal-movement details such as toll and parking may be entered through the appropriate entry flow.

The driver is not forced through an additional Personal Trip lifecycle before continuing the normal Work lifecycle.

## Visual Separation

The Work Cockpit may keep the interaction simple while other presentation surfaces separately display:

- Business movement and costs
- Dead KM and its business-side costs
- Personal movement and personal costs

This is a presentation separation only. It does not create duplicate data authority or separate persistence paths.

## Core Principle

> **One continuous vehicle movement record; separate business/personal attribution; dead KM remains on the business side; personal movement and personal costs remain separately visible and financially isolated.**
