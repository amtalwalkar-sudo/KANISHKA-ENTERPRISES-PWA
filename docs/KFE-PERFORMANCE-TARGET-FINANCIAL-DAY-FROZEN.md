# KFE Performance Target & Financial-Day Rule

**Status: FROZEN — 2026-09-13**

## Purpose

This document freezes the authoritative KFE rule connecting Performance targets to the Work module's financial-day model.

## Frozen Rule: Work Financial Day Is Authoritative

KFE Performance must **not independently define a working day, target day, or OFF day**.

The authoritative source is the existing KFE Work financial-day rule:

**Day → Shift → Ride**

Performance consumes the financial-day result produced by Work.

If another KFE rule, calculation, UI assumption, or future implementation conflicts with this rule, **this rule is authoritative and the conflicting rule must be corrected/removed rather than weakening this rule**.

## Driver Monthly Target

The driver tells management the desired monthly target amount **above the dynamic KFE break-even**.

Management records that amount as the driver's monthly target input.

Example:

- Dynamic KFE break-even: ₹60,000
- Driver's requested monthly target above break-even: ₹20,000
- Combined monthly driver revenue target: ₹80,000

The driver's ₹20,000 input is a planning/target value. It does not alter actual revenue, expenses, break-even costs, or historical ERP data.

## One Driver-Facing Number

The driver should receive **one operational number only: TARGET**.

The driver-facing target is derived from:

**Dynamic KFE break-even + driver's monthly target above break-even = monthly driver target**

Performance may expose the underlying calculations to management, but the driver-facing experience should not require the driver to understand break-even, forecasts, cost categories, or other internal calculations.

## Dynamic Break-even

KFE break-even is dynamic and uses **actual + forecast** economics:

- actual validated revenue and expenses accumulated so far;
- forecast remaining-month costs and operating activity;
- fixed expenses;
- dynamic/variable expenses;
- other KFE-recognized costs required by the business calculation.

The forecast is used for planning and target calculation and does not modify real ERP data.

## Daily Target

The monthly driver target is converted into a current daily target using the remaining **KFE financial days**, not calendar days by default.

Conceptually:

**Remaining monthly driver target ÷ remaining financial days = current daily TARGET**

The exact daily target is recalculated as actual validated revenue and financial-day status change.

## OFF-Day Behavior

When the driver takes an OFF day under the KFE Work rules:

- the date does not become a KFE financial day;
- no daily TARGET is consumed for that date;
- the monthly driver target does not decrease merely because the driver was OFF;
- the remaining target is redistributed across the remaining KFE financial days.

Performance must not independently count an OFF calendar date as a target day.

Likewise, Performance must not independently decide that a date is OFF. It must consume the financial-day status established by Work.

## Protection Against Drift

The following interpretations are explicitly rejected:

- treating every calendar day as an automatic KFE working/target day;
- dividing monthly target by calendar days regardless of Work financial-day status;
- creating a separate Performance definition of OFF day;
- reducing the driver's monthly target merely because an OFF day occurred;
- counting an OFF day as a missed target day.

Any future requirement that conflicts with the frozen Work financial-day rule must be raised as a **DESIGN DRIFT / CONFLICT WARNING** and must not silently override this rule.

## Scope

This freeze covers the relationship between:

- KFE dynamic break-even;
- driver's monthly target above break-even;
- combined monthly driver target;
- daily driver TARGET;
- Work financial-day status;
- OFF-day handling.

It does not freeze unrelated Performance UI styling, chart design, or future accounting formulas that have not yet been explicitly agreed.
