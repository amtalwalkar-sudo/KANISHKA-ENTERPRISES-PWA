# KFE — Domain Model / Business Nouns — Pass 2

**Status:** WORKING CONSOLIDATION — derived from frozen architecture and salvaged PWA/local material

## 1. Governing rule

> ONE BUSINESS FACT → ONE AUTHORITATIVE RECORD → ONE PERSISTENCE PATH → MULTIPLE READ REPRESENTATIONS ONLY WHEN NEEDED.

The domain model defines business meaning. It does not define database tables, UI screens, repository implementations, or Capacitor APIs.

## 2. Active product scope

KFE has exactly three active product areas:

- **Work** — operational work/session/trip/ride facts and real-world collection.
- **Performance** — interpretation, calculations, reporting and business-position views.
- **Admin** — configuration and administrative management.

There is no Timeline product area.

## 3. Authoritative domain record families

### Vehicle

Owns vehicle identity, lifecycle, configuration references and vehicle-related history. Vehicle changes must preserve historical records.

### Driver

Owns driver identity, lifecycle and assignment relationships. Driver information is not duplicated inside every business record as a second authority.

### Work Session

Owns an operational work-session lifecycle, including start/end and the authoritative relationship between work activity and the session.

### Break

Owns breaks occurring within the applicable work session.

### Trip / Ride

Owns operational trip/ride facts:

- identity
- operator
- status
- business/personal classification where applicable
- pickup/drop information
- start/end timestamps
- duration
- ride distance where a validated ride distance exists
- fare/revenue fact or applicable cancellation state
- relationship to the work session
- optional source evidence

A screenshot is never the business authority and never triggers machine extraction.

### Odometer Reading

Owns authoritative odometer observations. Vehicle movement calculations are reconstructed from authoritative odometer readings rather than treating UI summaries as authority.

### Fuel Entry

Owns actual refuelling records, including applicable odometer, amount, price/unit and quantity information. Derived efficiency and cost metrics belong to calculations, not duplicate fuel records.

### Maintenance Entry

Owns actual maintenance events/costs. Maintenance provisions and allocations are derived financial interpretations, not replacement maintenance records.

### Loan

Owns loan identity, principal, rate, schedule, amortization state, payment history and prepayment state. Loan calculations are defined in the business-calculation stage.

### Revenue Record

Owns revenue facts that are not already authoritative as part of a trip/ride. Revenue interpretation must not create duplicate copies of ride revenue.

### Configuration

Owns effective-dated business configuration and administrative settings. Configuration is not a second authority for operational facts.

## 4. Work domain relationships

```text
Vehicle / Driver
      │
      ▼
Work Session
  ├── Breaks
  ├── Trips / Rides
  └── Odometer observations

Trips / Rides ──→ Revenue facts where applicable
Odometer ───────→ Vehicle movement calculations
Fuel ────────────→ Fuel calculations
Maintenance ─────→ Maintenance calculations
```

These relationships are conceptual. Physical schema and foreign-key structure remain a later persistence decision.

## 5. Business / personal scope

Work records may distinguish business and personal activity where the business rule requires it.

Personal activity is not silently converted into business revenue or business operating cost. Performance calculations apply the applicable frozen financial rules.

## 6. Salvaged lifecycle concepts

Historical PWA material contains Day Start/End, Shift Start/End, business trip start/end and personal-trip concepts. These are salvaged as lifecycle evidence and must be reconciled into the single Work domain rather than recreated as separate feature stores or domains.

## 7. Salvaged KM / odometer principles

Historical material contains both GPS trip-distance concepts and odometer-based vehicle movement. The authoritative model is:

- odometer observations establish total vehicle movement;
- validated ride/trip distance is a separate operational fact when available;
- derived dead KM is calculated from authoritative vehicle movement minus validated ride KM;
- personal KM is handled according to the applicable Work/business rules;
- derived KM figures are not stored as competing authoritative facts.

The exact calculation contracts are Stage 3 work.

## 8. Salvaged financial concepts

The old project contains established concepts for:

- revenue
- fuel cost
- maintenance
- loans/EMI
- compliance
- provisions
- break-even
- profit/loss
- profit per KM
- profit per hour
- daily/shift/month/year interpretation
- target/reference values

These are retained as business requirements/evidence. They do not create separate financial databases or duplicate expense/revenue systems.

## 9. Performance domain

Performance does not own copies of Work, Fuel, Maintenance, Loan or Vehicle records.

Performance reconstructs business-position views from authoritative domain records and approved calculation rules.

Examples of derived interpretations include:

- revenue
- applicable costs/obligations
- available profit
- break-even
- profit per KM
- profit per hour
- daily/shift/month/year summaries
- target/reference indicators

These are derived representations unless a later explicit decision makes a particular value an authoritative business record.

## 10. Admin domain

Admin manages configuration and administrative records such as vehicle/driver configuration and effective-dated settings. Admin does not become a second owner of Work or financial facts.

## 11. Shared value concepts

The domain may use shared value concepts for:

- money
- distance
- duration
- date/time
- business/personal classification
- identity and lifecycle metadata
- effective dates

These concepts are shared definitions, not shared data stores.

## 12. Permanent exclusions

The domain model contains no:

- OCR domain
- AI extraction domain
- screenshot extraction pipeline
- Timeline product/domain
- Ride Capture product/domain separate from Work
- UI entities as business authority
- database entities masquerading as domain definitions
- Capacitor domain
- sync provider domain
- backup provider domain
- duplicate calculation authority

## 13. Authority boundary

```text
PRESENTATION
    ↓
APPLICATION
    ↓
DOMAIN  ← business meaning / invariants / calculations
    ↓
REPOSITORY CONTRACT
    ↓
PERSISTENCE
    ↓
ONE AUTHORITATIVE LOCAL DATABASE
```

Capacitor, Android, backup providers, sync transport and external providers remain below the business/application meaning boundary.

## 14. Stage 2 outcome

The core KFE business nouns are now consolidated into one ownership model:

1. Vehicle
2. Driver
3. Work Session
4. Break
5. Trip / Ride
6. Odometer Reading
7. Fuel Entry
8. Maintenance Entry
9. Loan
10. Revenue Record
11. Configuration

Performance is an interpretation/derived domain surface rather than a duplicate record authority.

The next stage is **Stage 3 — Business Calculations**, where the salvaged calculations are reconciled into one authoritative calculation ownership model.
