# KFE 2.0 — End-to-End PWA Wiring Audit

**Audit date:** 2026-09-04  
**Repository:** `amtalwalkar-sudo/KANISHKA-ENTERPRISES-PWA`  
**Audited ref:** `main` at `422cf8b599655f60ad72458d147f526871adbfd5`  
**Audit branch:** `audit/kfe-2.0-end-to-end-wiring`

## 1. Audit objective

This audit was requested as a single, methodical end-to-end wiring audit of the complete KFE 2.0 PWA. The required questions are:

1. Does every production screen render and have a reachable path?
2. Does every visible action/tap/button have a real handler and meaningful outcome?
3. Is every required ERP form present for the current single-vehicle scope?
4. Does every calculation have the required authoritative inputs and a traceable application/domain path?
5. Do business/personal separation, lifecycle, allocation/amortization, loan, profitability and other frozen rules remain intact?
6. Does persistence remain behind application/repository boundaries?
7. Is presentation decoupled sufficiently from business logic, persistence and shell/theme concerns?
8. Can the visual system be changed centrally rather than rewriting business code?
9. Is there executable browser evidence for every production screen, not merely static source evidence?

## 2. Audit method — six passes

### Pass 1 — Production surface inventory

Inspected the application shell, UI contract, module registry and production Vue components. The declared current modules include Vehicle, Work, Fuel, Expenses, Revenue, Loans, Renewals/Compliance, Maintenance, Basic Profitability and Dashboard. Historical Entries and Settings are also declared current presentation surfaces. The application shell exposes Work, Performance, Timeline and Admin as the four primary driver/back-office destinations.

**Result:** 🟢 Primary shell inventory is explicit.  
**Result:** 🟡 Current UI/application route vocabulary is not perfectly aligned: the application module registry uses route `Renewals`, while the UI contract and `App.vue` use `Compliance`. This is a contract/wiring consistency defect even where the visible screen exists.

### Pass 2 — Screen and action wiring

Inspected `App.vue` and the production component surfaces for navigation, form events, save events, edit events, back/close behavior and cross-module actions.

**Result:** 🟢 Major application event boundaries exist for Vehicle, Maintenance, Compliance, Loans, Money modules, Historical Entries and Timeline editing.

**Result:** 🔴 The Admin Finance tiles are rendered as `<button>` elements but have no click handler or action. They are therefore interactive-looking dead controls. They should either be non-interactive presentation tiles or have a defined action.

**Result:** 🔴 Admin Week → Day buttons all invoke the same `selectDay()` implementation, and `selectDay()` only opens the generic Timeline. The selected day is not passed through. The documented Month → Week → Day navigation is therefore not actually implemented as a day-specific path.

**Result:** 🟡 Several money-history surfaces are placeholders rather than real history read models. Expense History and Revenue History in `MoneyModuleView.vue` only show explanatory text. They do not render authoritative historical records.

### Pass 3 — Form completeness and persistence paths

Inspected current production forms and their application events.

#### Vehicle

Present: create, edit, retirement, sale, lifecycle dates/odometer, acquisition information and driver linkage.  
**Status:** 🟢 Form coverage is substantial and application-bound.

#### Driver

Present: create/edit, licence data, assignment/reassignment and deactivation.  
**Status:** 🟢 Form coverage is substantial and application-bound.

#### Work

Present: day start, business shift, business trip, personal trip, trip close, personal-trip close, shift close, day close, odometer allocation and revenue/toll/parking inputs.  
**Status:** 🟢 Core operational path is wired.  
**Important frozen-contract issue:** the current screen contract explicitly says no break workflow is part of the current driver contract, while the domain/accounting contracts preserve break handling. This is a specification/contract mismatch that must be resolved before calling the Work contract fully complete.

#### Fuel

Quick Fuel is available from Work and the authoritative form carries business scope.  
**Status:** 🟢 Core authoritative entry path exists.  
**Gap:** the broader Fuel module/history surface is not a complete editable history UI; correction is routed through Timeline.

#### Expenses

Entry form exists with category, date, amount, description and reference.  
**Status:** 🟢 Entry boundary exists.  
**Gap:** history UI is placeholder-only.

#### Revenue

Entry form exists with amount/date and is routed to application recording.  
**Status:** 🟢 Entry boundary exists.  
**Gap:** history UI is placeholder-only.

#### Fixed Expenses

Domain/application/persistence foundation exists and lifecycle tests are green.  
**Status:** 🟢 Business foundation verified; however no equivalent first-class current Admin UI form for fixed-expense lifecycle management was found in the production screen inventory. This means the underlying ERP capability exists but its administrative entry/edit surface is not visibly complete.

#### Maintenance

Present: date, vehicle context, odometer, category, description, amount, receipt/reference and optional Work Session ID.  
**Status:** 🟢 Required record fields are present.  
**Gap:** maintenance history is currently explanatory placeholder content rather than an authoritative list/read model with edit/correction affordances.

#### Compliance / Renewals

Present: renewal type, cost, validity start and validity end.  
**Status:** 🟢 Basic entry boundary exists.  
**Gap:** current-validity and renewal-history surfaces are placeholders rather than authoritative read models.

#### Loans

Present: a prepayment calculator input form and presentation surfaces for payment history/amortization.  
**Status:** 🔴 Current production UI does not expose a complete loan creation/loan lifecycle/payment-entry form. The visible payment-history and amortization surfaces are placeholders.

**Critical wiring defect:** the prepayment form emits a calculation request object, but `App.vue` routes calculation requests to `openModuleAction()`. That handler only has a special implementation for Fuel history and otherwise navigates string actions. The loan prepayment object is not handled by a corresponding application calculation call. The UI therefore presents a prepayment workflow whose authoritative calculation is not actually wired through from the save action.

#### Dashboard / Profitability

Read-only financial presentation is present and calculations are kept outside Vue.  
**Status:** 🟢 Architectural direction is correct.  
**Gap:** browser-level evidence for all dashboard/profitability states is absent from the current CI coverage.

#### Historical Entries

A unified correction form boundary exists for authoritative records.  
**Status:** 🟢 Correction architecture exists; runtime coverage still needs a dedicated browser suite.

#### Settings

Theme, backup, restore, reset and About are present and contract-defined.  
**Status:** 🟢 Current Settings contract is represented.  
**Status:** 🟢 Theme is persisted through application settings rather than business/domain logic.

### Pass 4 — Business-rule and calculation integrity

The existing foundation preflight contains explicit executable checks for business/personal expense and revenue separation, authoritative fuel scope, Work KM and breaks, maintenance KM amortization, fixed-expense effective dating and zero-KM behavior, loan principal/interest allocation and prepayment caps, profitability, vehicle lifecycle/soft deletion and absence of Tax Reserve.

**Result:** 🟢 The frozen accounting invariants covered by the existing preflight remain represented and testable.

**Result:** 🟢 Fixed expense lifecycle compatibility regression coverage now explicitly accepts legacy `amount_paise` records as well as `monthly_amount_paise`, preventing the recently observed cross-layer field-shape failure.

**Result:** 🟡 Test coverage is stronger at domain/application level than at complete browser interaction level. A passing domain contract does not prove that a user can reach and execute the same calculation from the screen.

### Pass 5 — Architecture and UI decoupling

The current architecture keeps `App.vue` importing the application boundary and not repository/infrastructure/database modules. Existing preflight and clean-architecture contracts enforce this direction. The UI contract also explicitly prohibits business calculations in Vue presentation.

**Result:** 🟢 Presentation → application boundary is established.

**Result:** 🟢 Direct repository/infrastructure/database imports from production presentation are guarded against.

**Result:** 🟢 Loan calculations and financial calculations are explicitly intended to remain outside presentation.

**Result:** 🟡 The shell is not completely isolated from presentation styling. `App.vue` contains component-local shell/action styling, and individual components contain scoped layout/styling. The token layer centralizes the principal color/surface theme values, but a complete redesign still requires multiple presentation files.

### Pass 6 — Theme/design centralization and runtime evidence

`src/styles/ui-tokens.css` defines the primary background, surface, text, muted, border, accent, shadow and overlay tokens for System/Light/Dark. Settings changes the root theme attribute and persists the selected theme through the application boundary.

**Result:** 🟢 Business/domain behavior is not coupled to the theme implementation.

**Result:** 🟢 Theme switching is centralized at the root token layer.

**Result:** 🟡 The stronger requirement “replace the entire visual design with one command/file change” is not yet fully proven. The token layer centralizes theme primitives, but component layout, typography choices, dimensions and some visual properties remain distributed in component-scoped CSS and `App.vue` styling.

## 3. Browser/E2E evidence assessment

The current Master CI installs Chromium and runs a real browser flow for the Work Screen. It also runs offline/resilience validation and all major domain/application/persistence contracts.

**Critical audit conclusion:** the current CI does **not** contain a complete browser E2E suite that walks every production screen and every production action. Therefore no honest audit can currently declare “every tap/button works” solely from the existing CI result.

The current evidence supports:

- 🟢 Work: real browser integration coverage exists.
- 🟢 Domain/application/persistence: extensive executable contract coverage exists.
- 🟡 Performance: production component exists, but complete browser interaction coverage is not present.
- 🟡 Timeline: production component exists, but complete browser interaction/correction/horizon coverage is not present.
- 🟡 Admin: production component exists, but complete browser coverage is not present.
- 🟡 Vehicle/Driver/Maintenance/Compliance/Loans/Money/Financial/Settings: source-level wiring exists, but a dedicated browser matrix proving every control is not present.

## 4. Consolidated findings

| ID | Area | Finding | Severity | Classification |
|---|---|---|---|---|
| E2E-01 | Admin Finance | Six finance tiles are `<button>` controls with no action handler | High | 🔴 FAIL |
| E2E-02 | Admin Week/Day | Day buttons do not preserve selected day; all open generic Timeline | High | 🔴 FAIL |
| E2E-03 | Loans | Prepayment UI request is not wired to an authoritative calculation result | Critical | 🔴 FAIL |
| E2E-04 | Loans | No complete loan create/payment lifecycle form is exposed in current production UI | High | 📋 MISSING |
| E2E-05 | Maintenance | History is placeholder-only | Medium | 🟡 GAP |
| E2E-06 | Compliance | Current validity/history are placeholder-only | Medium | 🟡 GAP |
| E2E-07 | Money | Expense/Revenue history are placeholder-only | Medium | 🟡 GAP |
| E2E-08 | Fixed Expense | Lifecycle foundation exists but first-class Admin entry/edit surface is not evident | High | 📋 MISSING |
| E2E-09 | Routing contract | Registry uses `Renewals`, UI uses `Compliance` | Medium | ⚠️ ARCHITECTURE |
| E2E-10 | Work | Break handling exists in domain/accounting tests but current screen contract says no break workflow | High | ⚠️ CONTRACT CONFLICT |
| E2E-11 | Browser coverage | Only Work has explicit real browser screen flow; no complete all-screen/action matrix | Critical | 📋 MISSING |
| E2E-12 | Design system | Theme tokens are centralized, but full design/layout remains distributed across components | Medium | 🟡 GAP |

## 5. ERP calculation input completeness

| Calculation domain | Required authoritative inputs | Current assessment |
|---|---|---|
| Business KM | Work/odometer + business/personal allocation | 🟢 Present |
| Personal KM | Work/personal-trip odometer allocation | 🟢 Present |
| Fuel cost | Date, odometer, amount, scope | 🟢 Present |
| Operating maintenance cost | Maintenance amount + KM dimension/allocation | 🟢 Domain present; 🟡 history UI gap |
| Fixed cost/KM | Effective lifecycle + monthly amount + business KM | 🟢 Domain present; 🟡 Admin entry UI gap |
| Revenue | Amount + business date/scope | 🟢 Present |
| Business expenses | Category/date/amount/scope | 🟢 Present |
| Loan EMI | Principal/rate/term/EMI + payment schedule | 🟢 Domain; 🔴 incomplete UI lifecycle |
| Loan principal/interest | Amortization schedule/payment data | 🟢 Domain; 🔴 incomplete UI evidence |
| Prepayment | Outstanding principal + prepayment amount/date | 🟢 Domain; 🔴 UI calculation wiring incomplete |
| Compliance validity | Type/cost/start/end | 🟢 Entry; 🟡 read-model/history gap |
| Profitability | Revenue, fuel, maintenance allocation, fixed overhead, loan principal/interest, other business costs | 🟢 Domain/application |
| Break-even | Business cost/profitability inputs | 🟢 Domain/application |
| Personal-use exclusion | Scope + authoritative source records | 🟢 Covered by accounting invariants |

## 6. Architecture verdict

**Business logic:** 🟢 substantially uncoupled from Vue.  
**Persistence:** 🟢 application/repository boundaries are enforced.  
**Financial calculation ownership:** 🟢 outside presentation.  
**Theme primitives:** 🟢 centralized.  
**Complete visual redesign by one command:** 🟡 not yet fully achieved/proven.  
**Complete screen/action runtime proof:** 🔴 not yet achieved.

## 7. Overall verdict

### KFE 2.0 is NOT yet entitled to a blanket “all screens, all taps, all buttons, all forms are working” PASS.

The underlying ERP foundation is considerably stronger than the visible completeness suggests. The domain, application boundaries, persistence contracts, accounting invariants and Work browser flow are well guarded. However, the audit found several genuine presentation/wiring gaps and, more importantly, the current CI does not provide the browser evidence necessary to certify every production interaction.

### Current audit status: 🔴 NOT READY FOR FULL E2E PASS

This is an **audit result, not a feature expansion decision**. The findings above define the exact remediation backlog required before a future certification audit can honestly return a full green result.

## 8. Required remediation order

1. Fix the Loan prepayment end-to-end calculation wiring.
2. Resolve Admin Finance dead buttons.
3. Fix Admin Week → Day routing so the selected day is authoritative.
4. Resolve the `Compliance` vs `Renewals` route vocabulary mismatch.
5. Resolve the Work break contract conflict against the frozen specification.
6. Complete authoritative read models/history for Maintenance, Compliance, Expenses and Revenue where those screens promise history/validity.
7. Expose the required Fixed Expense lifecycle administration UI if fixed-expense management is part of the current ERP operating scope.
8. Complete the Loan lifecycle UI required by the frozen ERP scope.
9. Build one comprehensive browser E2E matrix covering every production screen, form, control, validation, navigation, persistence/reload and correction path.
10. Harden the design system so visual redesign is controlled from a single presentation/theme configuration without touching business/application code.
11. Run the full Master CI and perform a second certification audit.

## 9. Audit boundary

No business rule was invented or changed during this audit. The audit deliberately distinguishes existing executable evidence from claims that would require new browser tests. Future capabilities such as GPS, cloud sync, multi-vehicle/fleet management, predictive analytics and other deferred features remain outside current-scope certification.
