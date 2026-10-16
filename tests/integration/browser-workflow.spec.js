import { test, expect } from '@playwright/test'
import { addDays, today, slots } from '../../src/rules.js'

test('browser product management, customer checkout, proof submission and Admin verification', async ({
  browser,
  baseURL,
}) => {
  const adminContext = await browser.newContext({ baseURL }),
    customerContext = await browser.newContext({ baseURL })
  const password = 'IntegrationOnly123!'
  const suffix = Date.now()
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5qkAAAAASUVORK5CYII=',
    'base64',
  )
  try {
    const admin = await adminContext.newPage()
    await admin.goto('/#account')
    await admin.getByLabel('Email address').fill('admin@integration.test')
    await admin.getByLabel('Password', { exact: true }).fill(password)
    await admin.getByRole('button', { name: 'Sign in', exact: true }).click()
    await expect(
      admin.getByRole('heading', { name: 'Hello, bakery team.' }),
    ).toBeVisible()
    await admin.getByRole('button', { name: 'Products', exact: true }).click()
    await admin
      .getByRole('button', { name: 'Add product', exact: true })
      .click()
    const editor = admin.getByRole('dialog')
    await editor.getByLabel('Product name').fill(`Browser Cake ${suffix}`)
    await editor.getByLabel('Description').fill('A chocolate celebration cake')
    await editor.getByLabel('Price (R)').fill('400.50')
    await editor.getByLabel('Size', { exact: true }).fill('20 cm')
    await editor.getByLabel('Servings').fill('12–16')
    await editor
      .getByLabel('Product photograph', { exact: false })
      .setInputFiles({ name: 'cake.png', mimeType: 'image/png', buffer: png })
    const uploadResponse = admin.waitForResponse((r) =>
      r.url().endsWith('/api/website/products/upload'),
    )
    await editor
      .getByRole('button', { name: 'Save product', exact: true })
      .click()
    const uploaded = await uploadResponse
    expect(uploaded.status(), await uploaded.text()).toBe(204)
    await expect(editor).toHaveCount(0)
    const saved = (
      await (await adminContext.request.get('/api/website')).json()
    ).products.find((p) => p.name === `Browser Cake ${suffix}`)
    expect(saved.image).toMatch(/^\/uploads\/products\//)
    const photo = await adminContext.request.get(saved.image)
    expect(photo.status()).toBe(200)
    expect(await photo.body()).toEqual(png)
    await admin
      .getByRole('article')
      .filter({ hasText: `Browser Cake ${suffix}` })
      .getByRole('button', { name: 'Edit product' })
      .click()
    await expect(
      editor.getByRole('img', { name: 'Current product photograph' }),
    ).toBeVisible()
    await editor.getByLabel('Description').fill('Updated photograph product')
    await editor
      .getByRole('button', { name: 'Save product', exact: true })
      .click()
    await expect(editor).toHaveCount(0)
    expect(
      (
        await (await adminContext.request.get('/api/website')).json()
      ).products.find((p) => p.id === saved.id).image,
    ).toBe(saved.image)
    const customer = await customerContext.newPage()
    await customer.goto('/#account')
    await customer
      .getByRole('button', { name: 'New here? Create an account' })
      .click()
    await customer.getByLabel('Full name').fill(`Browser Buyer ${suffix}`)
    await customer.getByLabel('Phone number').fill('0821234567')
    await customer
      .getByLabel('Email address')
      .fill(`buyer-${suffix}@integration.test`)
    await customer.getByLabel('Password', { exact: true }).fill(password)
    await customer
      .getByLabel('Confirm password', { exact: true })
      .fill(password)
    await customer
      .getByRole('button', { name: 'Create account', exact: true })
      .click()
    await expect(
      customer.getByRole('heading', { name: 'Your sweet journey' }),
    ).toBeVisible()
    await customer
      .getByRole('button', { name: 'Our cakes', exact: true })
      .first()
      .click()
    await customer
      .locator('.product-card')
      .filter({ hasText: `Browser Cake ${suffix}` })
      .getByRole('button', { name: 'Add to cart' })
      .click()
    await customer.getByRole('button', { name: 'Cart, 1 items' }).click()
    await customer.getByRole('button', { name: 'Proceed to checkout' }).click()
    let date = addDays(today(), 10)
    while (!slots(date).length) date = addDays(date, 1)
    await customer
      .getByLabel('Preferred collection date', { exact: true })
      .fill(date)
    await customer
      .getByLabel('Collection time', { exact: true })
      .selectOption('10:00')
    await customer.getByRole('button', { name: /Place order/ }).click()
    await expect(customer.getByRole('heading', { name: /^KSK-/ })).toBeVisible()
    await customer.getByText('Submit EFT proof', { exact: true }).click()
    await customer
      .getByLabel('Bank payment reference')
      .fill(`BROWSER-${suffix}`)
    await customer
      .getByLabel('EFT proof (PDF/JPG/PNG/WebP, up to 5 MB)')
      .setInputFiles({
        name: 'proof.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('%PDF-1.4\n1 0 obj<</Type /Catalog>>endobj\n%%EOF'),
      })
    await customer
      .getByRole('button', { name: 'Submit proof', exact: true })
      .click()
    await expect(
      customer.getByText('Payment awaiting verification.', { exact: true }),
    ).toBeVisible()
    await admin.getByRole('button', { name: 'Orders', exact: true }).click()
    await admin
      .getByRole('button', { name: 'Refresh records', exact: true })
      .click()
    await admin
      .getByRole('row')
      .filter({ hasText: `Browser Buyer ${suffix}` })
      .getByRole('button', { name: 'View order' })
      .click()
    await editor
      .getByRole('button', { name: 'Approve collection time', exact: true })
      .click()
    await editor
      .getByRole('button', { name: 'Verify payment', exact: true })
      .click()
    await expect(editor.getByText('Fully paid', { exact: true })).toBeVisible()
    for (const status of [
      'Confirmed',
      'In progress',
      'Ready for collection',
      'Collected',
    ]) {
      await editor.getByRole('button', { name: status, exact: true }).click()
    }
    await customer.reload()
    await expect(
      customer.locator('.order-card > .page-heading .badge'),
    ).toHaveText('Collected')
    await admin.screenshot({
      path: 'test-results/api-admin-order.png',
      fullPage: true,
    })
    await customer.screenshot({
      path: 'test-results/api-customer-order.png',
      fullPage: true,
    })
  } finally {
    await adminContext.close()
    await customerContext.close()
  }
})
