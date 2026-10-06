import test from 'node:test'
import assert from 'node:assert/strict'
import {
  depositAmount,
  outstandingAmount,
  collectionError,
  slots,
  cartTotal,
  canTransition,
  paymentState,
  quoteExpired,
  validateImage,
  today,
} from '../src/rules.js'
const now = new Date('2026-10-06T10:00:00Z')
test('South African midnight controls collection dates', () =>
  assert.equal(today(new Date('2026-10-05T23:00:00Z')), '2026-10-06'))
test('custom requests reject short notice, Sundays, after-hours and blocked dates', () => {
  assert.match(collectionError('2026-10-10', '10:00', true, [], now), /seven/)
  assert.match(collectionError('2026-10-18', '10:00', true, [], now), /Sundays/)
  assert.match(collectionError('2026-10-13', '17:00', true, [], now), /hours/)
  assert.match(
    collectionError('2026-10-13', '10:00', true, ['2026-10-13'], now),
    /unavailable/,
  )
  assert.equal(collectionError('2026-10-13', '10:00', true, [], now), '')
})
test('Saturday slots finish before closing and Sunday has no slots', () => {
  assert.equal(slots('2026-10-17').at(-1), '14:30')
  assert.deepEqual(slots('2026-10-18'), [])
})
test('cart uses current catalogue prices and excludes unavailable items', () =>
  assert.equal(
    cartTotal(
      [
        { id: 1, price: 1, quantity: 2 },
        { id: 2, quantity: 3 },
      ],
      [
        { id: 1, price: 360, active: true },
        { id: 2, price: 100, active: false },
      ],
    ),
    720,
  ))
test('confirmed bookings require approved slot and verified payment', () => {
  const custom = {
    type: 'Custom',
    total: 1000,
    paid: 499,
    status: 'Awaiting confirmation',
    slotApproved: true,
  }
  assert.equal(canTransition(custom, 'Confirmed'), false)
  assert.equal(canTransition({ ...custom, paid: 500 }, 'Confirmed'), true)
  assert.equal(
    canTransition({ ...custom, paid: 500, slotApproved: false }, 'Confirmed'),
    false,
  )
  assert.equal(
    canTransition({ ...custom, type: 'Standard', paid: 500 }, 'Confirmed'),
    false,
  )
})
test('handover requires full payment and terminal orders cannot reopen', () => {
  assert.equal(
    canTransition(
      { total: 1000, paid: 500, status: 'Ready for collection' },
      'Collected',
    ),
    false,
  )
  assert.equal(
    canTransition(
      { total: 1000, paid: 1000, status: 'Ready for collection' },
      'Collected',
    ),
    true,
  )
  assert.equal(canTransition({ status: 'Cancelled' }, 'Confirmed'), false)
  assert.equal(canTransition({ status: 'Collected' }, 'In progress'), false)
})
test('payment summary distinguishes deposit and full settlement', () => {
  assert.equal(
    paymentState({ type: 'Custom', total: 1000, paid: 500 }),
    'Deposit paid',
  )
  assert.equal(
    paymentState({ type: 'Custom', total: 1000, paid: 1000 }),
    'Fully paid',
  )
  assert.equal(
    paymentState({ type: 'Standard', total: 1000, paid: 500 }),
    'Awaiting payment',
  )
})
test('expired quotes and unsupported or oversized uploads are rejected', () => {
  assert.equal(quoteExpired({ expiresAt: '2026-10-06T10:00:00Z' }, now), true)
  assert.equal(quoteExpired({ expiresAt: '2026-10-09T10:00:00Z' }, now), false)
  assert.match(validateImage({ type: 'text/html', size: 10 }), /JPG/)
  assert.match(
    validateImage({ type: 'image/png', size: 3 * 1024 * 1024 }),
    /2 MB/,
  )
  assert.equal(validateImage({ type: 'image/jpeg', size: 100 }), '')
})

test('odd-cent quotes split into a rounded deposit and exact remaining balance', () => {
  assert.equal(depositAmount(123.45), 61.73)
  assert.equal(outstandingAmount({ total: 123.45, paid: 61.73 }), 61.72)
  assert.equal(
    cartTotal([{ id: 1, quantity: 3 }], [{ id: 1, price: 0.1, active: true }]),
    0.3,
  )
})
