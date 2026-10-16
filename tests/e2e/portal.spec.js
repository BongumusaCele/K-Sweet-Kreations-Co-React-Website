import { test, expect } from '@playwright/test'
import { publicData } from '../fixtures.js'

test('mobile Admin deletion requires confirmation, retains the product on failure and supports retry', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  let deleted = false,
    fail = true,
    calls = 0
  await page.route('**/api/Auth/me', (route) =>
    route.fulfill({
      json: {
        userId: 1,
        fullName: 'Bakery Admin',
        email: 'admin@example.com',
        phoneNumber: '0821234567',
        role: 'Admin',
      },
    }),
  )
  await page.route('**/api/website', (route) =>
    route.fulfill({
      json: {
        ...publicData(),
        products: publicData().products.filter((p) => !deleted || p.id !== 1),
      },
    }),
  )
  await page.route('**/api/website/products/1', (route) => {
    calls++
    if (fail)
      return route.fulfill({
        status: 503,
        json: { message: 'Unable to delete right now.' },
      })
    deleted = true
    return route.fulfill({ status: 204 })
  })
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Open workspace menu', exact: true })
    .click()
  await page.getByRole('button', { name: 'Products', exact: true }).click()
  const row = page.getByRole('article').filter({ hasText: 'Chocolate Luxe' })
  await row.getByRole('button', { name: 'Delete product', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(
    dialog.getByRole('heading', { name: 'Delete product?' }),
  ).toBeVisible()
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()
  expect(calls).toBe(0)
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Delete product', exact: true }).click()
  await dialog
    .getByRole('button', { name: 'Delete product', exact: true })
    .click()
  await expect(dialog.getByRole('alert')).toHaveText(
    'Unable to delete right now.',
  )
  await expect(row).toHaveCount(1)
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  fail = false
  await dialog
    .getByRole('button', { name: 'Delete product', exact: true })
    .click()
  await expect(dialog).toHaveCount(0)
  await expect(row).toHaveCount(0)
  expect(calls).toBe(2)
})
test('Staff identity comes from the API and does not expose Admin product controls', async ({
  page,
}) => {
  await page.route('**/api/Auth/me', (route) =>
    route.fulfill({
      json: {
        userId: 3,
        fullName: 'Bakery Staff',
        email: 'staff@example.com',
        phoneNumber: '0821234567',
        role: 'Staff',
      },
    }),
  )
  await page.route('**/api/website', (route) =>
    route.fulfill({ json: publicData() }),
  )
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Hello, bakery team.' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Products', exact: true }),
  ).toHaveCount(0)
  await expect(page.getByLabel('Preview role')).toHaveCount(0)
  await page.getByRole('button', { name: 'Cake requests', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'No cake requests yet' }),
  ).toBeVisible()
})
