import fs from 'node:fs';
const required=['js/core/record.js','js/core/effective-date.js','js/core/referential-integrity.js','js/core/idempotency.js','js/core/audit.js','js/core/backup.js','js/core/restore.js','js/core/dependency-graph.js','js/core/calculation-version.js','js/core/data-confidence.js','js/core/transaction.js','js/core/hardened-db.js','js/core/idb-v3-contract.js','js/core/contracts.js'];
const read=p=>fs.readFileSync(p,'utf8');
const checks=[
 ['authoritative record contract',/user_id/.test(read('js/core/record.js'))&&/created_at/.test(read('js/core/record.js'))&&/updated_at/.test(read('js/core/record.js'))&&/synced/.test(read('js/core/record.js'))&&/is_deleted/.test(read('js/core/record.js'))],
 ['UUID generation',read('js/core/record.js').includes('crypto.randomUUID()')],
 ['effective dating',read('js/core/effective-date.js').includes('effective_from')&&read('js/core/effective-date.js').includes('effective_to')],
 ['referential integrity',read('js/core/referential-integrity.js').includes('validateReferences')],
 ['idempotency',read('js/core/idempotency.js').includes('operationId')],
 ['audit/correction history',read('js/core/audit.js').includes('CORRECTION')],
 ['versioned backup/restore',read('js/core/backup.js').includes('kfe_backup_v2')&&read('js/core/restore.js').includes('restoreKfeSnapshot')],
 ['directional dependency graph',read('js/core/dependency-graph.js').includes('topologicalOrder')&&read('js/core/dependency-graph.js').includes('Circular')],
 ['calculation version registry',read('js/core/calculation-version.js').includes('createCalculationVersionRegistry')],
 ['data confidence states',read('js/core/data-confidence.js').includes('dataConfidenceState')&&read('js/core/data-confidence.js').includes('UNKNOWN')&&read('js/core/data-confidence.js').includes('INSUFFICIENT_DATA')],
 ['atomic transaction boundary',read('js/core/transaction.js').includes("'readwrite'")&&read('js/core/transaction.js').includes('abort')],
 ['canonical hardened database',read('js/core/hardened-db.js').includes('DB_VERSION=3')&&read('js/core/hardened-db.js').includes('idempotency')&&read('js/core/hardened-db.js').includes('audit')],
 ['repository uses hardened database',read('js/core/repository.js').includes("./hardened-db.js")],
 ['backup replacement is atomic',read('js/core/backup.js').includes('.clear()')&&read('js/core/backup.js').includes('runAtomicTransaction')],
 ['foundation registry',read('js/core/contracts.js').includes('FOUNDATION_CONTRACTS')],
 ['no business domain implementations',!fs.existsSync('js/domain')],
 ['no UI business calculations',!read('src/App.vue').includes('calculate')&&!read('src/main.js').includes('/domain/')]
];
let failed=required.filter(p=>!fs.existsSync(p)).length;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed++;}
if(failed)process.exitCode=1;
