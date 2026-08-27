# KFE 2.0 hardened foundation

## Tier 1 — technical foundation
The repository contains infrastructure contracts only. No legacy business calculations or business formulas are authoritative.

```text
UI / UX Shell
      ↓
View Models
      ↓
Application
      ↓
Domain-specific engines (introduced only from the locked business handoff)
      ↓
Directional Calculation Dependency Graph
      ↓
Repository contracts
      ↓
Dexie / IndexedDB
      ↓
Outbox / Network Retry / Service Worker
      ↓
Future Supabase mirror
```

## Foundation contracts
1. Authoritative records: `id`, `user_id`, `created_at`, `updated_at`, `synced`, `is_deleted`.
2. Configuration: effective-dated configuration with `effective_from`, optional `effective_to`, and version.
3. Referential integrity: explicit relationship validation; no orphan references.
4. Idempotency: stable operation identity prevents duplicate submissions.
5. Audit/correction history: append-only correction/void/restore events.
6. Backup/restore: versioned `kfe_backup_v2` snapshots with validation and atomic replacement restore.
7. Dependency graph: directional DAG with cycle rejection and topological ordering.
8. Calculation version registry: domain/version identifiers without formulas.
9. Foundation validation: automated gates for all infrastructure contracts.
10. Data confidence: every future calculation result must carry `dataConfidenceState`.
11. Atomic transactions: related IndexedDB writes use explicit `readwrite` scopes and abort on failure.

## Business isolation
Business formulas are deliberately absent from the foundation. Future Work, Fuel, Expenses, Maintenance, Loans, Revenue and other domains own their own calculations. The UI never becomes the business source of truth, and the Dashboard only consumes published domain outputs.

## Historical integrity
Configuration changes are effective-dated. Calculation results carry calculation versions and data-confidence states. Restore/recovery rebuilds derived state from authoritative records rather than trusting cached calculations.
