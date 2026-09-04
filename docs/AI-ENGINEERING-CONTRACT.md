# KFE 2.0 AI Engineering Contract

## Authority
The KFE 2.0 specification under `spec/` is the authoritative engineering contract for current behavior. Existing frozen business rules, existing contracts, and approved golden vectors are not to be reinterpreted by implementation work.

## No invention
If required behavior is not specified, implementation must stop with `SPECIFICATION GAP`. No AI-assisted change may invent business rules, financial formulas, persistence semantics, workflow transitions, or future capability behavior.

## Traceability
Business behavior changes must be traceable as:

`SPECIFICATION -> CONTRACT -> TEST -> IMPLEMENTATION`

Financial calculation changes additionally require a deterministic golden vector.

## Architecture guardrails
Current dependency direction is:

`Presentation -> Application -> Domain -> Repository Contracts -> Infrastructure -> Local Database -> Future Integrations`

Forbidden reverse dependencies and direct persistence/business-calculation access from presentation are CI failures.

## Frozen scope
Current scope is a single-vehicle ERP. GPS, cloud sync, Google Drive backup, multiple vehicles, multiple drivers, fleet management, advanced reporting, predictive analytics, machine learning, and KFE Advisor remain future capabilities unless the specification is explicitly changed.

## Engineering optimization principle
KFE development must be made as fast as technically possible **without weakening correctness, data integrity, architecture, testing, CI, or deployment verification**.

Speed must come from eliminating unnecessary work, not from removing guarantees. Prefer:

- dependency-aware incremental validation over unnecessary full reruns during ordinary development;
- batch implementation of coherent domain changes over piecemeal edits;
- root-cause fixes over repeated symptom patches;
- authoritative single sources of truth over duplicated logic;
- reuse of proven contracts and infrastructure over rebuilding unaffected components;
- early detection of specification, architecture, persistence, and integration defects;
- Full CI at domain freeze, merge, and release boundaries.

A shorter process is acceptable only when it removes work that is **provably unnecessary**. It is not acceptable when it reduces evidence needed to establish correctness.

## CI authority
Existing validation gates must not be weakened, skipped, deleted, or rewritten to make a change pass. Deployment is permitted only after all mandatory governance and existing gates pass.

## Failure protocol
When a governance gate fails:

1. Stop.
2. Identify the exact rule, contract, file and test involved.
3. Report the root cause.
4. Fix only within the approved specification.
5. Never bypass the gate.

## Specification changes
Changing a frozen business rule is a specification change first. The specification, affected contracts, golden vectors, tests, implementation and traceability must change together.
