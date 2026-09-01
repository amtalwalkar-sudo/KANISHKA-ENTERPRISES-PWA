import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const transaction=fs.readFileSync(path.join(root,'js/core/transaction.js'),'utf8');
const record=fs.readFileSync(path.join(root,'js/core/record.js'),'utf8');
const idempotency=fs.readFileSync(path.join(root,'js/core/idempotency.js'),'utf8');
const db=fs.readFileSync(path.join(root,'js/core/hardened-db.js'),'utf8');

assert.match(transaction,/Transaction operation must queue IndexedDB requests synchronously/);
assert.doesNotMatch(record,/Math\.random\(\)/);
assert.doesNotMatch(idempotency,/Math\.random\(\)/);
assert.doesNotMatch(db,/Math\.random\(\)/);
assert.match(db,/db\.onversionchange=\(\)=>\{db\.close\(\);dbPromise=null;\}/);
assert.match(db,/function ensureStores\(db\)/);
console.log('repository hardening contract: PASS');
