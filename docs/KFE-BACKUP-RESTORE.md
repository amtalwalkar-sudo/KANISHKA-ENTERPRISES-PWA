# KFE 2.0 Backup & Restore Contract

## Scope

This document is the implementation contract for the frozen KFE 2.0 Backup & Restore scope. The implementation is provider-independent and local-first. Cloud synchronization is not part of this scope.

## Layer 1 — Local protection and portable migration

- KFE maintains one current encrypted recovery package in a separate IndexedDB database (`kfe-backup`).
- The recovery package contains the canonical KFE repository snapshot across the current KFE stores, including soft-deleted records where they exist in the repository.
- Successful repository mutations trigger a serialized refresh of the current recovery package. Idempotency-only mutations are excluded from refresh triggering.
- Device-local encryption uses AES-GCM with a device-generated non-extractable key persisted in the backup database.
- Portable `.kfe` packages use AES-GCM with a PBKDF2-SHA-256 derived key, a random salt, and a 210,000-iteration derivation count.
- Payloads are gzip-compressed when the browser supports `CompressionStream`; otherwise the package records `compression: "none"`.
- The checksum is SHA-256 over the canonical plaintext snapshot before compression/encryption.
- The package is versioned as `kfe-backup-package-v1` and uses MIME type `application/vnd.kfe.backup+json`.
- Restore validates the package before mutation, creates a single pre-restore safety copy, decrypts and verifies integrity, imports transactionally, clears transient outbox/idempotency state, and rebuilds the current local recovery package afterward.
- Failed validation/decryption/integrity checks do not import the candidate snapshot.
- Portable restore is sufficient for phone-to-phone migration: the receiving phone imports the package using the shared passphrase and then rebuilds its own device-local recovery copy.

## Layer 2 — Cloud-provider abstraction

The core exposes a provider contract with `put`, `get`, `list`, and `remove` operations and contract version `1.0.0`. A memory adapter is used only for certification. No cloud vendor is selected or integrated by this scope, and no synchronization/conflict algorithm is implemented.

## Restore safety boundary

`outbox` and `idempotency` are transient operational state rather than business history. They are intentionally cleared during restore so stale pending operations from the source device cannot be replayed on the restored dataset.

## Certification

The provider/package contract test verifies the provider interface, CRUD behavior, deterministic canonicalization, and package-version rejection. The browser certification verifies:

1. clean startup creates a current local recovery package;
2. business-data mutation refreshes that package;
3. local payload is encrypted and does not expose plaintext business values;
4. portable export is encrypted and does not expose plaintext business values;
5. wrong-passphrase restore is rejected;
6. valid restore is transactional and reconstructs the expected business data;
7. a pre-restore safety copy exists;
8. stale outbox/idempotency state is cleared;
9. corrupted portable payload is rejected without changing restored business data;
10. a second browser context can independently restore the portable package and rebuild local protection;
11. the provider abstraction passes its contract test.

The dedicated GitHub Actions workflow runs build, provider/package certification, and the Playwright browser certification.
