import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { addDays, today, slots } from '../../src/rules.js'

const password = 'IntegrationOnly123!'
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5qkAAAAASUVORK5CYII=',
  'base64',
)
const product = {
  name: 'Integration cake',
  description: 'A bakery test product',
  category: 'Cakes',
  price: 361.01,
  size: '20 cm',
  servings: '12–16',
  active: true,
  image: '',
}
function collection(days = 9) {
  let date = addDays(today(), days)
  while (!slots(date).length) date = addDays(date, 1)
  return { date, time: '10:00' }
}
async function successful(response, status = 204) {
  expect(response.status(), await response.text()).toBe(status)
  return response
}
async function login(request, email = 'admin@integration.test') {
  await successful(
    await request.post('/api/Auth/login', { data: { email, password } }),
    200,
  )
}
async function register(request, email) {
  await successful(
    await request.post('/api/Auth/register', {
      data: {
        fullName: 'Integration Customer',
        email,
        phoneNumber: '0821234567',
        password,
        confirmPassword: password,
      },
    }),
    201,
  )
  await login(request, email)
}
async function snapshot(request) {
  const response = await request.get('/api/website')
  await successful(response, 200)
  return response.json()
}

test('Admin confirms product deletion; other roles cannot delete; historical orders and photographs survive', async ({
  browser,
  playwright,
  baseURL,
}) => {
  const adminContext = await browser.newContext({ baseURL })
  const customer = await playwright.request.newContext({ baseURL })
  const staff = await playwright.request.newContext({ baseURL })
  const guest = await playwright.request.newContext({ baseURL })
  const admin = adminContext.request
  try {
    const suffix = Date.now()
    const name = `Delete cake ${suffix}`
    const { image: _image, ...productFields } = product
    await login(admin)
    await successful(
      await admin.post('/api/website/products/upload', {
        multipart: {
          ...productFields,
          name,
          active: 'true',
          price: String(product.price),
          file: { name: 'cake.png', mimeType: 'image/png', buffer: png },
        },
      }),
    )
    const saved = (await snapshot(admin)).products.find((p) => p.name === name)
    await register(customer, `delete-buyer-${suffix}@integration.test`)
    await successful(
      await admin.post('/api/Auth/staff', {
        data: {
          fullName: 'Deletion test staff',
          phoneNumber: '0821234567',
          email: `delete-staff-${suffix}@integration.test`,
          password,
          confirmPassword: password,
        },
      }),
      201,
    )
    await login(staff, `delete-staff-${suffix}@integration.test`)
    for (const [client, status] of [
      [guest, 401],
      [customer, 403],
      [staff, 403],
    ])
      await successful(
        await client.delete(`/api/website/products/${saved.id}`),
        status,
      )
    const details = {
      submissionId: randomUUID(),
      name: 'Integration Customer',
      phone: '0821234567',
      ...collection(),
      items: [{ id: saved.id, quantity: 1 }],
    }
    await successful(
      await customer.post('/api/website/orders', { data: details }),
    )
    const order = (await snapshot(customer)).orders[0]
    const page = await adminContext.newPage()
    await page.goto('/')
    await page.getByRole('button', { name: 'Products', exact: true }).click()
    const row = page.getByRole('article').filter({ hasText: name })
    await row
      .getByRole('button', { name: 'Delete product', exact: true })
      .click()
    const dialog = page.getByRole('dialog')
    await expect(
      dialog.getByRole('heading', { name: 'Delete product?' }),
    ).toBeVisible()
    await expect(dialog).toContainText(
      'Existing orders and their history will be kept.',
    )
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect(row).toBeVisible()
    expect(
      (await snapshot(admin)).products.some((p) => p.id === saved.id),
    ).toBe(true)
    await row
      .getByRole('button', { name: 'Delete product', exact: true })
      .click()
    await dialog
      .getByRole('button', { name: 'Delete product', exact: true })
      .click()
    await expect(dialog).toHaveCount(0)
    await expect(row).toHaveCount(0)
    for (const client of [admin, customer, staff, guest])
      expect(
        (await snapshot(client)).products.some((p) => p.id === saved.id),
      ).toBe(false)
    for (const client of [admin, customer]) {
      const historical = (await snapshot(client)).orders.find(
        (o) => o.id === order.id,
      )
      expect(historical.total).toBe(order.total)
      expect(historical.items[0].name).toBe(name)
      expect(historical.items[0].image).toBe(saved.image)
      expect(historical.history).toEqual(order.history)
    }
    expect((await guest.get(saved.image)).status()).toBe(200)
    await successful(
      await customer.post('/api/website/orders', {
        data: { ...details, submissionId: randomUUID() },
      }),
      409,
    )
    await successful(
      await admin.put(`/api/website/products/${saved.id}`, {
        data: { ...product, active: true },
      }),
      404,
    )
    await successful(
      await admin.post('/api/ProductImages/upload', {
        multipart: {
          productId: String(saved.id),
          isPrimary: 'true',
          file: { name: 'cake.png', mimeType: 'image/png', buffer: png },
        },
      }),
      404,
    )
    await successful(await admin.delete(`/api/website/products/${saved.id}`))
  } finally {
    await adminContext.close()
    await customer.dispose()
    await staff.dispose()
    await guest.dispose()
  }
})

test('real HTTP standard order, private proof, permissions, payment and handover', async ({
  playwright,
  baseURL,
}) => {
  const admin = await playwright.request.newContext({ baseURL }),
    customer = await playwright.request.newContext({ baseURL }),
    other = await playwright.request.newContext({ baseURL })
  try {
    await login(admin)
    await successful(
      await admin.post('/api/website/products', { data: product }),
    )
    const p = (await snapshot(admin)).products.at(-1)
    await register(customer, `standard-${Date.now()}@integration.test`)
    await register(other, `other-${Date.now()}@integration.test`)
    const details = {
      submissionId: randomUUID(),
      name: 'Integration Customer',
      phone: '0821234567',
      ...collection(),
      instructions: '',
      items: [{ id: p.id, quantity: 2 }],
      total: 0.01,
    }
    await successful(
      await customer.post('/api/website/orders', {
        data: { ...details, items: [{ id: p.id, quantity: -1 }] },
      }),
      400,
    )
    await successful(
      await customer.post('/api/website/orders', { data: details }),
    )
    await successful(
      await customer.post('/api/website/orders', { data: details }),
    )
    expect((await snapshot(customer)).orders).toHaveLength(1)
    let order = (await snapshot(customer)).orders[0]
    expect(order.total).toBe(722.02)
    expect(order.history[0].at).toMatch(/Z$/)
    expect((await snapshot(other)).orders).toHaveLength(0)
    await successful(
      await other.post(`/api/website/orders/${order.id}/cancel`),
      404,
    )
    await successful(
      await customer.patch(`/api/website/orders/${order.id}/status`, {
        data: { status: 'Confirmed' },
      }),
      403,
    )
    await successful(
      await admin.patch(`/api/website/orders/${order.id}/status`, {
        data: { status: 'Confirmed' },
      }),
      409,
    )
    await successful(
      await admin.post(`/api/website/orders/${order.id}/approve-slot`),
    )
    for (const file of [
      {
        name: 'fake.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('not a PDF'),
      },
      {
        name: 'large.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.concat([
          Buffer.from('%PDF-1.4'),
          Buffer.alloc(5 * 1024 * 1024),
        ]),
      },
    ]) {
      await successful(
        await customer.post(`/api/website/orders/${order.id}/proof`, {
          multipart: { reference: 'INVALID', file },
        }),
        400,
      )
    }
    expect((await snapshot(customer)).orders[0].payments).toHaveLength(0)
    const pdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type /Catalog>>endobj\n%%EOF')
    await successful(
      await customer.post(`/api/website/orders/${order.id}/proof`, {
        multipart: {
          reference: `REF-${Date.now()}`,
          file: { name: 'proof.pdf', mimeType: 'application/pdf', buffer: pdf },
        },
      }),
    )
    order = (await snapshot(customer)).orders[0]
    expect(order.paid).toBe(0)
    const payment = order.payments[0]
    await successful(await other.get(payment.proofUrl), 404)
    const proof = await successful(await admin.get(payment.proofUrl), 200)
    expect(proof.headers()['content-type']).toBe('application/pdf')
    expect(proof.headers()['content-disposition']).toContain('attachment;')
    expect(await proof.body()).toEqual(pdf)
    expect(await (await customer.get(payment.proofUrl)).body()).toEqual(pdf)
    await successful(
      await admin.patch(`/api/website/payments/${payment.id}/verify`, {
        data: { status: 'Verified' },
      }),
    )
    await successful(
      await admin.patch(`/api/website/payments/${payment.id}/verify`, {
        data: { status: 'Verified' },
      }),
      409,
    )
    for (const status of [
      'Confirmed',
      'In progress',
      'Ready for collection',
      'Collected',
    ])
      await successful(
        await admin.patch(`/api/website/orders/${order.id}/status`, {
          data: { status },
        }),
      )
    order = (await snapshot(customer)).orders[0]
    expect(order.status).toBe('Collected')
    expect(order.paid).toBe(722.02)
    await successful(await customer.post('/api/Auth/logout'))
    await successful(await customer.get('/api/Auth/me'), 401)
  } finally {
    await admin.dispose()
    await customer.dispose()
    await other.dispose()
  }
})

test('custom quotation creates one order; deposit does not allow unpaid handover', async ({
  playwright,
  baseURL,
}) => {
  const admin = await playwright.request.newContext({ baseURL }),
    customer = await playwright.request.newContext({ baseURL })
  try {
    await login(admin)
    await register(customer, `custom-${Date.now()}@integration.test`)
    const form = {
      submissionId: randomUUID(),
      name: 'Custom Customer',
      phone: '0821234567',
      ...collection(12),
      size: '20 cm',
      flavour: 'Chocolate',
      filling: 'Ganache',
      comments: 'Blue cake',
    }
    await successful(
      await customer.post('/api/website/requests', {
        multipart: {
          ...form,
          file: {
            name: 'fake.png',
            mimeType: 'image/png',
            buffer: Buffer.from('not an image'),
          },
        },
      }),
      400,
    )
    expect((await snapshot(customer)).requests).toHaveLength(0)
    await successful(
      await customer.post('/api/website/requests', {
        multipart: {
          ...form,
          file: { name: 'idea.png', mimeType: 'image/png', buffer: png },
        },
      }),
    )
    const request = (await snapshot(customer)).requests[0]
    await successful(
      await admin.post(`/api/website/requests/${request.id}/quote`, {
        data: {
          amount: 100.01,
          notes: 'Approved blue cake and collection slot',
        },
      }),
    )
    const responses = await Promise.all(
      [1, 2].map(() =>
        customer.post(`/api/website/requests/${request.id}/respond`, {
          data: { status: 'Accepted' },
        }),
      ),
    )
    expect(responses.filter((r) => r.status() === 204)).toHaveLength(1)
    expect(responses.filter((r) => r.status() === 409)).toHaveLength(1)
    let order = (await snapshot(customer)).orders[0]
    expect((await snapshot(customer)).orders).toHaveLength(1)
    expect(order.slotApproved).toBe(true)
    const proof = () =>
      customer.post(`/api/website/orders/${order.id}/proof`, {
        multipart: {
          reference: `CUSTOM-${Date.now()}`,
          file: { name: 'proof.png', mimeType: 'image/png', buffer: png },
        },
      })
    await successful(await proof())
    order = (await snapshot(customer)).orders[0]
    expect(order.payments[0].amount).toBe(50.01)
    await successful(
      await admin.patch(
        `/api/website/payments/${order.payments[0].id}/verify`,
        { data: { status: 'Verified' } },
      ),
    )
    for (const status of ['Confirmed', 'In progress', 'Ready for collection'])
      await successful(
        await admin.patch(`/api/website/orders/${order.id}/status`, {
          data: { status },
        }),
      )
    await successful(
      await admin.patch(`/api/website/orders/${order.id}/status`, {
        data: { status: 'Collected' },
      }),
      409,
    )
    await successful(await proof())
    order = (await snapshot(customer)).orders[0]
    const balance = order.payments.find(
      (p) => p.status === 'Awaiting verification',
    )
    expect(balance.amount).toBe(50)
    await successful(
      await admin.patch(`/api/website/payments/${balance.id}/verify`, {
        data: { status: 'Verified' },
      }),
    )
    expect((await snapshot(customer)).orders[0].status).toBe(
      'Ready for collection',
    )
    await successful(
      await admin.patch(`/api/website/orders/${order.id}/status`, {
        data: { status: 'Collected' },
      }),
    )
  } finally {
    await admin.dispose()
    await customer.dispose()
  }
})

test('browser registration, server errors, profile persistence and mobile layout', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#account')
  await expect(
    page.getByRole('combobox', { name: 'Preview role' }),
  ).toHaveCount(0)
  await page.getByLabel('Email address').fill('missing@integration.test')
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText(
    'Invalid email or password',
  )
  await page
    .getByRole('button', { name: 'New here? Create an account' })
    .click()
  const email = `browser-${Date.now()}@integration.test`
  await page.getByLabel('Full name').fill('Browser Customer')
  await page.getByLabel('Phone number').fill('0821234567')
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByLabel('Confirm password', { exact: true }).fill(password)
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Your sweet journey' }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole('heading', { name: 'Your sweet journey' }),
  ).toBeVisible()
  await page
    .getByRole('button', { name: 'My account', exact: true })
    .last()
    .click()
  await page.getByLabel('Full name').fill('Updated Customer')
  await page.getByRole('button', { name: 'Save profile' }).click()
  await expect(page.getByRole('status')).toContainText('Profile updated')
  await page.reload()
  await expect(page.getByLabel('Full name')).toHaveValue('Updated Customer')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  const cookies = await page.context().cookies()
  expect(cookies.find((c) => c.name === 'ksk_session').httpOnly).toBe(true)
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Welcome back' }),
  ).toBeVisible()
  expect((await request.get('/api/website')).status()).toBe(200)
})

test('Staff permissions, public feedback moderation, blocked collection and origin checks', async ({
  playwright,
  baseURL,
}) => {
  const admin = await playwright.request.newContext({ baseURL }),
    staff = await playwright.request.newContext({ baseURL }),
    customer = await playwright.request.newContext({ baseURL }),
    anonymous = await playwright.request.newContext({ baseURL })
  try {
    await login(admin)
    const email = `staff-${Date.now()}@integration.test`
    await successful(
      await admin.post('/api/Auth/staff', {
        data: {
          fullName: 'Bakery Staff',
          email,
          phoneNumber: '0821234567',
          password,
          confirmPassword: password,
        },
      }),
      201,
    )
    await login(staff, email)
    const me = await (await staff.get('/api/Auth/me')).json()
    expect(me.role).toBe('Staff')
    await successful(
      await staff.post('/api/website/products', { data: product }),
      403,
    )
    await successful(
      await staff.patch('/api/website/payments/1/verify', {
        data: { status: 'Verified' },
      }),
      403,
    )
    await successful(
      await staff.put(`/api/website/blocked/${collection(25).date}`),
      403,
    )
    await successful(
      await anonymous.post('/api/website/enquiries', {
        data: {
          name: 'Public enquiry',
          email: 'enquiry@integration.test',
          subject: 'Cake options',
          message: 'What cakes are available?',
        },
        headers: { Origin: 'https://untrusted.invalid' },
      }),
      403,
    )
    await successful(
      await anonymous.post('/api/website/enquiries', {
        data: {
          name: 'Public enquiry',
          email: 'enquiry@integration.test',
          subject: 'Cake options',
          message: 'What cakes are available?',
        },
      }),
    )
    const enquiry = (await snapshot(staff)).enquiries[0]
    await successful(
      await staff.patch(`/api/website/enquiries/${enquiry.id}/status`, {
        data: { status: 'Resolved' },
      }),
    )
    expect((await snapshot(anonymous)).enquiries).toHaveLength(0)
    await register(customer, `review-${Date.now()}@integration.test`)
    await successful(
      await customer.post('/api/website/reviews', {
        data: {
          name: 'Customer',
          rating: 5,
          message: 'A lovely celebration cake.',
        },
      }),
    )
    expect((await snapshot(anonymous)).reviews).toHaveLength(0)
    const review = (await snapshot(admin)).reviews[0]
    await successful(
      await staff.patch(`/api/website/reviews/${review.id}/status`, {
        data: { status: 'Published' },
      }),
      403,
    )
    await successful(
      await admin.patch(`/api/website/reviews/${review.id}/status`, {
        data: { status: 'Published' },
      }),
    )
    expect((await snapshot(anonymous)).reviews).toHaveLength(1)
    const slot = collection(25)
    await successful(await admin.put(`/api/website/blocked/${slot.date}`))
    await successful(
      await customer.post('/api/website/requests', {
        multipart: {
          submissionId: randomUUID(),
          name: 'Customer',
          phone: '0821234567',
          ...slot,
          size: '20 cm',
          flavour: 'Vanilla',
          filling: 'Buttercream',
        },
      }),
      400,
    )
  } finally {
    await admin.dispose()
    await staff.dispose()
    await customer.dispose()
    await anonymous.dispose()
  }
})
