import assert from 'node:assert/strict'
import fs from 'node:fs'

const view = fs.readFileSync('src/views/WorkModuleView.vue', 'utf8')
const nav = fs.readFileSync('src/components/BottomNav.vue', 'utf8')

const expect = fragment => assert.ok(view.includes(fragment), `Missing Work UI contract fragment: ${fragment}`)

expect('START SHIFT')
expect('END SHIFT')
expect('START TRIP')
expect('END TRIP')
expect('trip-action-dock')
expect('bottom:calc(60px + env(safe-area-inset-bottom))')
expect('shift-toggle')
expect('End the active Trip before ending the Shift.')
expect('START DAY')
expect('END DAY')
expect('LOG CNG REFUELING')
expect('GPS')
expect('DAY ACTIVE')
assert.ok(nav.includes('Work') && nav.includes('Performance') && nav.includes('Admin'), 'Bottom navigation must remain Work / Performance / Admin')
assert.ok(!nav.includes('Diagnostic'), 'Diagnostic overlay must not become bottom navigation')

console.log('Phase 8 Work UI contract passed.')
