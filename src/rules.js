export const orderStates = [
  'Awaiting confirmation',
  'Confirmed',
  'In progress',
  'Ready for collection',
  'Collected',
  'Cancelled',
]
export function today(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}
export function addDays(date, days) {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
export function slots(date) {
  if (!date) return []
  const day = new Date(`${date}T12:00:00Z`).getUTCDay()
  if (day === 0) return []
  return Array.from(
    { length: day === 6 ? 12 : 16 },
    (_, i) =>
      `${String(9 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`,
  )
}
export function collectionError(
  date,
  time,
  custom,
  blocked = [],
  now = new Date(),
) {
  if (!date || !time) return 'Choose a collection date and time.'
  if (date < addDays(today(now), custom ? 7 : 1))
    return custom
      ? 'Custom cakes require at least seven days’ notice.'
      : 'Choose a collection date from tomorrow onwards.'
  if (blocked.includes(date))
    return 'The bakery is unavailable on this date. Choose another date.'
  if (!slots(date).includes(time))
    return 'Choose a collection slot within bakery hours. Sundays are closed.'
  return ''
}
export function cartTotal(cart, catalogue) {
  const cents = cart.reduce((n, item) => {
    const p = catalogue.find((p) => p.id === item.id)
    return n + (p?.active ? Math.round(p.price * 100) * item.quantity : 0)
  }, 0)
  return cents / 100
}
export function depositAmount(total) {
  return Math.round(Math.round(total * 100) / 2) / 100
}
export function outstandingAmount(order) {
  return (
    Math.max(0, Math.round(order.total * 100) - Math.round(order.paid * 100)) /
    100
  )
}
export function paymentState(order) {
  return order.paid >= order.total
    ? 'Fully paid'
    : order.paid >= depositAmount(order.total) && order.type === 'Custom'
      ? 'Deposit paid'
      : 'Awaiting payment'
}
export function canTransition(order, next) {
  if (next === order.status) return true
  if (['Cancelled', 'Collected'].includes(order.status)) return false
  if (next === 'Cancelled') return true
  const expected = {
    'Awaiting confirmation': 'Confirmed',
    Confirmed: 'In progress',
    'In progress': 'Ready for collection',
    'Ready for collection': 'Collected',
  }
  if (expected[order.status] !== next) return false
  if (
    next === 'Confirmed' &&
    (order.paid <
      (order.type === 'Custom' ? depositAmount(order.total) : order.total) ||
      !order.slotApproved)
  )
    return false
  if (next === 'Collected' && order.paid < order.total) return false
  return true
}
export function quoteExpired(quote, now = new Date()) {
  return (
    !quote.expiresAt || now.getTime() >= new Date(quote.expiresAt).getTime()
  )
}
export function validateImage(file) {
  return !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    ? 'Choose a JPG, PNG or WebP image.'
    : file.size > 2 * 1024 * 1024
      ? 'Choose an image smaller than 2 MB.'
      : ''
}
