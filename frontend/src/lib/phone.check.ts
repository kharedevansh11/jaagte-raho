// Run: node --experimental-strip-types src/lib/phone.check.ts
import assert from 'node:assert/strict'
import { fromE164, toE164 } from './phone.ts'

assert.equal(toE164('+91', '98765 43210'), '+919876543210')
assert.equal(toE164('+91', '098765-43210'), '+919876543210')
assert.equal(toE164('+91', '919876543210'), '+919876543210')
assert.equal(toE164('+91', '98765'), null)
assert.equal(toE164('+1', '4155550123'), '+14155550123')
assert.deepEqual(fromE164('+919876543210'), { prefix: '+91', number: '98765 43210' })
console.log('phone ok')
