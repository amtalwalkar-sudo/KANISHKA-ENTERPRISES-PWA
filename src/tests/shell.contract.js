import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const app = await readFile(new URL('../App.vue', import.meta.url), 'utf8')
const router = await readFile(new URL('../router/index.js', import.meta.url), 'utf8')
const shellService = await readFile(new URL('../application/shell/shellService.js', import.meta.url), 'utf8')

assert.match(app, /<router-view/)
assert.match(app, /bottom-nav/)
assert.match(app, /ShellService/)
assert.doesNotMatch(app, /useShiftTripStore/)
assert.doesNotMatch(app, /initializeCanonicalStorage/)
assert.match(router, /path: '\/'/)
assert.match(router, /path: '\/performance'/)
assert.match(router, /path: '\/admin'/)
assert.doesNotMatch(router, /ride-capture|RideCapture/i)
assert.match(shellService, /initializeCanonicalStorage/)
assert.match(shellService, /store\.initialize\(\)/)
console.log('Shell contract passed: global frame, navigation, readiness boundary and route set are intact.')
