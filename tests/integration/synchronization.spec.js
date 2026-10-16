import { test, expect } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { addDays, today, slots } from '../../src/rules.js'

const password = 'IntegrationOnly123!'
async function ok(response, status = 204) {
  expect(response.status(), await response.text()).toBe(status)
}
async function signIn(request, email = 'admin@integration.test') {
  await ok(
    await request.post('/api/Auth/login', { data: { email, password } }),
    200,
  )
}
async function register(request, email, fullName) {
  await ok(
    await request.post('/api/Auth/register', {
      data: {
        email,
        fullName,
        phoneNumber: '0821234567',
        password,
        confirmPassword: password,
      },
    }),
    201,
  )
  await signIn(request, email)
}
async function snapshot(request) {
  const response = await request.get('/api/website')
  await ok(response, 200)
  return response.json()
}
function collection() {
  let date = addDays(today(), 11)
  while (!slots(date).length) date = addDays(date, 1)
  return { date, time: '10:00' }
}

test('new registration and profile changes reach an already open Admin directory without an order', async ({
  browser,
  playwright,
  baseURL,
}) => {
  const admin = await browser.newContext({ baseURL }),
    customer = await playwright.request.newContext({ baseURL })
  const suffix = Date.now()
  try {
    await signIn(admin.request)
    const page = await admin.newPage()
    await page.clock.install()
    await page.goto('/')
    await page.getByRole('button', { name: 'Customers', exact: true }).click()
    await expect(
      page.getByRole('heading', { name: /Registered customers/ }),
    ).toBeVisible()
    const name = `Registered only ${suffix}`,
      email = `registered-only-${suffix}@integration.test`
    await register(customer, email, name)
    expect((await snapshot(customer)).orders).toHaveLength(0)
    expect((await snapshot(customer)).requests).toHaveLength(0)
    await page.clock.fastForward(31000)
    await expect(
      page.getByRole('row').filter({ hasText: email }),
    ).toContainText(name)
    const row = page.getByRole('row').filter({ hasText: email })
    await expect(row.getByRole('cell').nth(3)).toHaveText('0')
    await expect(row.getByRole('cell').nth(4)).toHaveText('0')
    await ok(
      await customer.put('/api/Auth/me', {
        data: { name: `Updated ${suffix}`, phone: '0837654321' },
      }),
      200,
    )
    await page.clock.fastForward(31000)
    await expect(row).toContainText(`Updated ${suffix}`)
    await expect(row).toContainText('0837654321')
    const own = await snapshot(customer)
    expect(own.customers).toEqual([])
    expect(own.staff).toEqual([])
    await page
      .getByRole('button', { name: 'Staff accounts', exact: true })
      .click()
    const staffEmail = `directory-staff-${suffix}@integration.test`
    await page.getByLabel('Full name').fill(`New staff ${suffix}`)
    await page.getByLabel('Email', { exact: true }).fill(staffEmail)
    await page.getByLabel('Phone number').fill('0821234567')
    await page.getByLabel('Temporary password', { exact: true }).fill(password)
    await page.getByLabel('Confirm password', { exact: true }).fill(password)
    await page
      .getByRole('button', { name: 'Create Staff account', exact: true })
      .click()
    await expect(
      page.getByRole('row').filter({ hasText: staffEmail }),
    ).toBeVisible()
    await signIn(customer, staffEmail)
    const staffSnapshot = await snapshot(customer)
    expect(staffSnapshot.customers).toEqual([])
    expect(staffSnapshot.staff).toEqual([])
  } finally {
    await admin.close()
    await customer.dispose()
  }
})

test('other independently created records refresh on navigation and periodic sync across sessions', async ({
  browser,
  playwright,
  baseURL,
}) => {
  const admin = await browser.newContext({ baseURL }),
    customer = await playwright.request.newContext({ baseURL }),
    anonymous = await playwright.request.newContext({ baseURL })
  const suffix = Date.now()
  try {
    await signIn(admin.request)
    await register(
      customer,
      `sync-${suffix}@integration.test`,
      `Sync customer ${suffix}`,
    )
    const page = await admin.newPage()
    await page.clock.install()
    await page.goto('/')
    await expect(
      page.getByRole('heading', { name: 'Hello, bakery team.' }),
    ).toBeVisible()
    await ok(
      await admin.request.post('/api/website/products', {
        data: {
          name: `Inactive ${suffix}`,
          description: 'Not available for purchase',
          category: 'Cakes',
          price: 250,
          size: '20 cm',
          servings: '12',
          active: false,
          image: '',
        },
      }),
    )
    await page.getByRole('button', { name: 'Products', exact: true }).click()
    await expect(
      page.getByRole('article').filter({ hasText: `Inactive ${suffix}` }),
    ).toContainText('Unavailable')
    expect(
      (await snapshot(customer)).products.some(
        (p) => p.name === `Inactive ${suffix}`,
      ),
    ).toBe(false)
    const subject = `Guest enquiry ${suffix}`
    await ok(
      await anonymous.post('/api/website/enquiries', {
        data: {
          name: 'Guest',
          email: `guest-${suffix}@integration.test`,
          subject,
          message: 'Please explain your cake options.',
        },
      }),
    )
    await page.getByRole('button', { name: 'Enquiries', exact: true }).click()
    await expect(page.getByRole('heading', { name: subject })).toBeVisible()
    await ok(
      await customer.post('/api/website/requests', {
        multipart: {
          submissionId: randomUUID(),
          name: `Request ${suffix}`,
          phone: '0821234567',
          ...collection(),
          size: '20 cm',
          flavour: 'Vanilla',
          filling: 'Buttercream',
        },
      }),
    )
    await page
      .getByRole('button', { name: 'Cake requests', exact: true })
      .click()
    await expect(
      page.locator('.enquiry-row').filter({ hasText: `Request ${suffix}` }),
    ).toBeVisible()
    expect((await snapshot(customer)).orders).toHaveLength(0)
    const message = `Independent feedback ${suffix}`
    await ok(
      await customer.post('/api/website/reviews', {
        data: { name: `Reviewer ${suffix}`, rating: 5, message },
      }),
    )
    await page.getByRole('button', { name: 'Feedback', exact: true }).click()
    await expect(
      page.locator('.enquiry-row').filter({ hasText: message }),
    ).toContainText('Pending')
    await ok(
      await admin.request.post('/api/website/products', {
        data: {
          name: `Available ${suffix}`,
          description: 'Available cake',
          category: 'Cakes',
          price: 250,
          size: '20 cm',
          servings: '12',
          active: true,
          image: '',
        },
      }),
    )
    const product = (await snapshot(admin.request)).products.find(
      (p) => p.name === `Available ${suffix}`,
    )
    await page.getByRole('button', { name: 'Orders', exact: true }).click()
    await ok(
      await customer.post('/api/website/orders', {
        data: {
          submissionId: randomUUID(),
          name: `Order ${suffix}`,
          phone: '0821234567',
          ...collection(),
          instructions: '',
          items: [{ id: product.id, quantity: 1 }],
        },
      }),
    )
    await page.clock.fastForward(31000)
    const row = page.getByRole('row').filter({ hasText: `Order ${suffix}` })
    await expect(row).toBeVisible()
    const order = (await snapshot(customer)).orders[0]
    await row.getByRole('button', { name: 'View order' }).click()
    await ok(
      await customer.post(`/api/website/orders/${order.id}/proof`, {
        multipart: {
          reference: `SYNC-${suffix}`,
          file: {
            name: 'proof.png',
            mimeType: 'image/png',
            buffer: Buffer.from(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5qkAAAAASUVORK5CYII=',
              'base64',
            ),
          },
        },
      }),
    )
    await page.clock.fastForward(31000)
    await expect(
      page
        .getByRole('dialog')
        .getByText('Awaiting verification', { exact: true }),
    ).toBeVisible()
    const payment = (await snapshot(customer)).orders[0].payments[0]
    await ok(
      await admin.request.patch(`/api/website/payments/${payment.id}/verify`, {
        data: { status: 'Verified' },
      }),
    )
    await page.clock.fastForward(31000)
    await expect(
      page.getByRole('dialog').getByText('Fully paid', { exact: true }),
    ).toBeVisible()
  } finally {
    await admin.close()
    await customer.dispose()
    await anonymous.dispose()
  }
})
