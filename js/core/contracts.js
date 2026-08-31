// KFE infrastructure contract registry. Business domains are intentionally absent.
export const FOUNDATION_CONTRACTS=Object.freeze({
  authoritativeRecord:'js/core/record.js',
  configuration:'js/core/effective-date.js',
  referentialIntegrity:'js/core/referential-integrity.js',
  idempotency:'js/core/idempotency.js',
  audit:'js/core/audit.js',
  backupRestore:'js/core/backup.js',
  dependencyGraph:'js/core/dependency-graph.js',
  calculationVersions:'js/core/calculation-version.js',
  dataConfidence:'js/core/data-confidence.js',
  atomicTransactions:'js/core/transaction.js',
  operationalTelemetry:'js/services/operational-telemetry.js'
});