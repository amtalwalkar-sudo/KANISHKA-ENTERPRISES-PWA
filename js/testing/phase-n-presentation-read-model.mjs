import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DATA} from '../domain/shared.js';
import {dashboardReadModel,performanceReadModel,presentationError} from '../application/read-models.js';

// kfe.js is intentionally a thin public export boundary after application segregation.
// Inspect the implementation facade for implementation-specific wiring invariants.
const publicSource=fs.readFileSync(new URL('../application/kfe.js',import.meta.url),'utf8');
const appSource=fs.readFileSync(new URL('../application/kfe-application-facade.js',import.meta.url),'utf8');
const modelSource=fs.readFileSync(new URL('../application/read-models.js',import.meta.url),'utf8');
assert.equal(modelSource.includes("../core/hardened-db.js"),false);
assert.equal(publicSource.includes("../core/hardened-db.js"),false);
assert.equal(appSource.includes("../core/hardened-db.js"),false);
assert.equal(appSource.includes('getStatus'),false);
assert.equal(appSource.includes('getPerformance'),true);
const actual={dataConfidenceState:DATA.ACTUAL,value:{netProfitPaise:100}};
const projected={dataConfidenceState:DATA.PROJECTED,value:200};
const model=dashboardReadModel({profitabilityResult:actual,tomorrowTargetResult:projected,alerts:['x']});
assert.equal(model.dataConfidenceState,DATA.PROJECTED);
assert.equal(model.profitability,actual);
assert.deepEqual(model.alerts,['x']);
assert.notEqual(model.alerts,undefined);
const insufficient=dashboardReadModel({profitabilityResult:{dataConfidenceState:DATA.INSUFFICIENT_DATA}});
assert.equal(insufficient.dataConfidenceState,DATA.INSUFFICIENT_DATA);
assert.equal(dashboardReadModel({}).dataConfidenceState,DATA.UNKNOWN);
const error=presentationError(new Error('offline'));
assert.equal(error.dataConfidenceState,DATA.UNKNOWN);
assert.equal(error.error,'offline');
console.log('PASS presentation models do not access storage directly');
console.log('PASS dashboard read model preserves authoritative results');
console.log('PASS confidence state propagates without inventing certainty');
console.log('PASS missing presentation data is UNKNOWN');
console.log('PASS presentation errors remain explicit');
console.log('PASS Status application wiring is removed');
console.log('PASS Performance application wiring is present');
console.log('PASS Phase N presentation/read-model contract');
