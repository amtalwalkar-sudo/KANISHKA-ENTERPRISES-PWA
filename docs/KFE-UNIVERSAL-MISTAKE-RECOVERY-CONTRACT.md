# KFE 2.0 — Universal Mistake & Recovery Contract

**Status:** Frozen foundation contract  
**Scope:** All driver-facing PWA interactions  

## Purpose

KFE must make the safest recovery path the easiest path while preserving authoritative ERP history.

## 1. Universal decision rule

```text
DRIVER MISTAKE
      |
      v
Has it been committed?
   /          \
 NO            YES
 |              |
CANCEL      Can it be safely
            reversed now?
             /      \
           YES       NO
            |         |
          UNDO   CORRECTION
             \      /
              \    /
               v  v
        VALID AUTHORITATIVE STATE
```

### Cancel — before commitment

Cancel means **nothing happened**. Any multi-step form or pending action must be abandonable without changing authoritative state.

Required for forms/actions such as odometer entry, Fuel, Maintenance, historical entries, loan payments, and trip completion details.

`EDIT → REVIEW → CANCEL → NO STATE CHANGE`

A partially completed form must never accidentally commit because the driver navigated away.

### Undo — immediately after commitment

An immediately completed action may expose Undo while reversal is safe. Undo reverses the **complete logical action**, not an arbitrary UI field.

Examples include starting a personal/business trip or saving a Fuel entry.

### Correction — after downstream consequences

Once subsequent operations depend on an event, do not silently erase or rewrite it. Create a correction/reversal that produces the corrected authoritative state while preserving the original historical event and audit trail.

Examples include an odometer used by later trips, completed trips, financial transactions, and maintenance records already used in calculations.

## 2. Navigation contract

Simple navigation tabs (`Work`, `Status`, `Timeline`, `More`) are harmless navigation only.

Navigation must **never commit, cancel, terminate, or mutate domain state accidentally**.

No Undo is required for ordinary navigation.

## 3. Form contract

```text
FORM → EDIT → REVIEW
             ├─ CANCEL → discard / no state change
             └─ SAVE → commit → optional safe UNDO
```

A future draft policy may choose discard, confirmation, or temporary draft preservation. None may create an accidental commit.

## 4. Swipe contract

Before the swipe threshold: **no domain action**.

At threshold: provide clear confirmation feedback identifying the action.

After completion: execute the application command exactly once. If safely reversible, expose Undo; otherwise use Correction.

Swipes must not be used as an accidental destructive shortcut.

## 5. Destructive actions

Deletion/reset operations require explicit confirmation before commitment.

```text
REQUEST DELETE/RESET
        ↓
CONFIRM
        ↓
COMMIT
        ↓
UNDO / RECOVERY where safe
```

System-wide Reset Data requires the strictest confirmation and recovery policy.

## 6. Odometer contract

Odometer entry remains editable before confirmation. If the delta requires allocation, the driver classifies Business and Personal KM before the operation is committed.

Once an operation has started, its odometer becomes part of authoritative operational history. A later mistake is corrected rather than silently deleted or rewritten.

The continuous-odometer invariant remains mandatory.

## 7. Trip contract

Trip start may be immediately undone while no downstream operation depends on it.

Trip end is a completion workflow: capture required completion details, then commit. Immediate safe mistakes may be undone; once downstream activity exists, use correction rather than rewriting history.

## 8. Financial record contract

Financial records are conservative. An immediate safe reversal may use Undo. Once a transaction participates in reports, allocations, settlements, or other downstream calculations, use correction/reversal and preserve the original event.

## 9. Universal design checklist

Every new driver-facing tab, form, button, swipe, or workflow must answer:

1. What can the driver accidentally do?
2. Can they cancel before commitment?
3. Can they undo immediately afterward?
4. When does Undo become unsafe?
5. What correction mechanism exists afterward?
6. Does recovery preserve authoritative history?
7. Can navigation ever accidentally change domain state?

## 10. Architectural rule

Recovery belongs at the appropriate application/domain boundary, not as ad-hoc UI-only mutation. UI controls may initiate Cancel, Undo, or Correction, but authoritative state transitions and history preservation remain application/domain responsibilities.

**Frozen principle:**

> The easiest recovery should always be the safest recovery.
